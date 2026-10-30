import { useEffect, useRef, useState } from 'react'
import { Camera, ImageOff, Trash2 } from 'lucide-react'
import Button from '../common/Button'
import { ConfirmDialog } from '../common/Modal'
import PortfolioImage from './PortfolioImage'
import { isSupportedImageType, MAX_IMAGE_SIZE_BYTES } from '../../utils/media'

export default function PortfolioCoverEditor({ ownerId, coverId, selection, onSelectionChange, resetKey }) {
  const inputRef = useRef(null)
  const previewRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreviewUrl(null)
    setError('')
    onSelectionChange(null)
    // Reset the temporary cover preview after a save or cancel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const choose = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!isSupportedImageType(file)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Cover images must be 5 MB or smaller.')
      return
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const url = URL.createObjectURL(file)
    previewRef.current = url
    setPreviewUrl(url)
    onSelectionChange(file)
  }

  const remove = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreviewUrl(null)
    onSelectionChange('remove')
    setConfirmRemove(false)
  }

  return (
    <section aria-labelledby="cover-title" className="card overflow-hidden">
      <div className="relative h-44 bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-300 sm:h-56">
        {previewUrl
          ? <img src={previewUrl} alt="Portfolio cover preview" className="h-full w-full object-cover" onError={() => {
            setError('This image could not be loaded. Choose another cover photo.')
            if (previewRef.current) URL.revokeObjectURL(previewRef.current)
            previewRef.current = null
            setPreviewUrl(null)
            onSelectionChange(null)
          }} />
          : coverId && selection !== 'remove'
            ? <PortfolioImage ownerId={ownerId} mediaId={coverId} alt="Current portfolio cover" className="h-full w-full" />
            : <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-300 text-white"><ImageOff size={40} strokeWidth={1.2} aria-hidden="true" /><span className="sr-only">Default portfolio cover background</span></div>}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
        <span className="absolute bottom-4 left-4 text-sm font-semibold text-white drop-shadow">Portfolio cover</span>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="cover-title" className="font-semibold">Cover photo</h2>
          <p className="text-sm text-ink-muted">A wide photo gives your public portfolio a personal touch. JPEG, PNG, or WebP, up to 5 MB.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose portfolio cover photo" onChange={choose} className="sr-only" />
          <Button variant="secondary" onClick={() => inputRef.current?.click()}><Camera size={16} aria-hidden="true" /> {coverId || previewUrl ? 'Replace cover' : 'Upload cover'}</Button>
          {(coverId || previewUrl) && <Button variant="ghost" onClick={() => setConfirmRemove(true)}><Trash2 size={16} aria-hidden="true" /> Remove</Button>}
        </div>
      </div>
      {error && <p className="px-4 pb-4 text-sm text-red-700" role="alert">{error}</p>}
      {selection && selection !== 'remove' && <p className="px-4 pb-4 text-sm text-ink-muted">Cover preview ready. Save your portfolio to keep it.</p>}
      {selection === 'remove' && <p className="px-4 pb-4 text-sm text-ink-muted">The default cover will be restored when you save.</p>}
      <ConfirmDialog open={confirmRemove} onClose={() => setConfirmRemove(false)} onConfirm={remove} title="Remove portfolio cover?" message="The default background will be used instead. The change takes effect when you save your portfolio." confirmLabel="Remove cover" danger />
    </section>
  )
}
