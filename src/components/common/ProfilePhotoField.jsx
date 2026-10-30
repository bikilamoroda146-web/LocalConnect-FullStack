import { useEffect, useRef, useState } from 'react'
import { Camera, RotateCcw, Trash2 } from 'lucide-react'
import Avatar from './Avatar'
import { ConfirmDialog } from './Modal'
import { isSupportedImageType, MAX_IMAGE_SIZE_BYTES } from '../../utils/media'

export default function ProfilePhotoField({ name, photoUrl, photoError, selection, onSelectionChange, resetKey, disabled = false }) {
  const inputRef = useRef(null)
  const objectUrlRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const clearPreview = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = null
    setPreviewUrl(null)
  }

  useEffect(() => {
    clearPreview()
    setError('')
    setImageFailed(false)
    onSelectionChange({ type: 'unchanged' })
    // resetKey intentionally resets the draft photo after save or cancel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const chooseFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!isSupportedImageType(file)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('That image is over 5 MB. Choose a smaller file.')
      return
    }
    clearPreview()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setPreviewUrl(url)
    setImageFailed(false)
    onSelectionChange({ type: 'file', file })
  }

  const cancelSelection = () => {
    clearPreview()
    setError('')
    setImageFailed(false)
    onSelectionChange({ type: 'unchanged' })
  }

  const removePhoto = () => {
    clearPreview()
    setError('')
    setImageFailed(false)
    onSelectionChange({ type: 'remove' })
    setConfirmRemove(false)
  }

  const displayedUrl = selection.type === 'remove' ? null : previewUrl ?? photoUrl
  return (
    <section aria-labelledby="profile-photo-heading" className="rounded-lg border border-line bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0">
          {displayedUrl && !imageFailed
            ? <img src={displayedUrl} alt={`${name}'s profile photo preview`} onError={() => {
              if (previewUrl && displayedUrl === previewUrl) {
                setError('This image could not be loaded. Choose a different image.')
                clearPreview()
                onSelectionChange({ type: 'unchanged' })
              } else {
                setError('Your saved photo could not be loaded; your initials avatar is shown.')
              }
              setImageFailed(true)
            }} className="h-20 w-20 rounded-full object-cover ring-2 ring-white" />
            : <Avatar name={name} size={80} />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="profile-photo-heading" className="font-semibold">Profile photo</h2>
          <p className="mt-1 text-sm text-ink-muted">JPEG, PNG, or WebP. Maximum file size: 5 MB.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a profile photo" onChange={chooseFile} disabled={disabled} className="sr-only" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60">
              <Camera size={16} aria-hidden="true" /> Upload photo
            </button>
            {(selection.type === 'file' || selection.type === 'remove') && (
              <button type="button" onClick={cancelSelection} disabled={disabled} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                <RotateCcw size={16} aria-hidden="true" /> Cancel photo change
              </button>
            )}
            {(photoUrl || photoError) && selection.type !== 'remove' && (
              <button type="button" onClick={() => setConfirmRemove(true)} disabled={disabled} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                <Trash2 size={16} aria-hidden="true" /> Remove photo
              </button>
            )}
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          {photoError && <p role="status" className="mt-2 text-sm text-amber-800">{photoError}</p>}
          {selection.type === 'file' && <p className="mt-2 text-sm text-ink-muted">Preview ready. Save your profile to keep this photo.</p>}
          {selection.type === 'remove' && <p className="mt-2 text-sm text-ink-muted">Your initials avatar will be restored when you save.</p>}
          <ConfirmDialog open={confirmRemove} onClose={() => setConfirmRemove(false)} onConfirm={removePhoto} title="Remove profile photo?" message="Your initials avatar will be shown instead. The change takes effect when you save your profile." confirmLabel="Remove photo" danger />
        </div>
      </div>
    </section>
  )
}
