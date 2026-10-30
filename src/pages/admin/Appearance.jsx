import { useEffect, useRef, useState } from 'react'
import { Camera, Image as ImageIcon, RotateCcw, Trash2, UploadCloud, Video as VideoIcon } from 'lucide-react'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import HomepageHeroBackground from '../../components/public/HomepageHeroBackground'
import useHomepageAppearance from '../../hooks/useHomepageAppearance'
import { saveHomepageAppearance } from '../../utils/homepageAppearance'
import { ACCEPTED_VIDEO_TYPES, isSupportedImageType, isSupportedVideoType, MAX_IMAGE_SIZE_BYTES, MAX_VIDEO_SIZE_BYTES } from '../../utils/media'

function readableStorageError(error) {
  if (error?.name === 'QuotaExceededError') {
    return 'This browser is out of storage space. Remove some site data or choose a smaller image, then try again.'
  }
  return error?.message || 'The changes could not be saved. Please try again.'
}

export default function AdminAppearance() {
  const { appearance, imageUrl, videoUrl, loading, error: loadError, refresh } = useHomepageAppearance()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [position, setPosition] = useState('center')
  const [removeImage, setRemoveImage] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)
  const [videoSaving, setVideoSaving] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [videoSuccess, setVideoSuccess] = useState('')
  const inputRef = useRef(null)
  const videoInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const videoPreviewUrlRef = useRef(null)
  const submitLock = useRef(false)
  const videoSubmitLock = useRef(false)

  useEffect(() => {
    if (!loading) setPosition(appearance.position)
  }, [appearance.position, loading])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    if (videoPreviewUrlRef.current) URL.revokeObjectURL(videoPreviewUrlRef.current)
  }, [])

  const clearPreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
  }

  const chooseFile = (selected) => {
    if (!selected) return
    setError('')
    setSuccess('')
    if (!isSupportedImageType(selected)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (selected.size > MAX_IMAGE_SIZE_BYTES) {
      setError('This image is larger than 5 MB. Choose a smaller file.')
      return
    }
    clearPreview()
    const url = URL.createObjectURL(selected)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setFile(null)
    setValidating(true)
    setRemoveImage(false)
    const image = new window.Image()
    image.onload = () => {
      if (previewUrlRef.current !== url) return
      setFile(selected)
      setValidating(false)
    }
    image.onerror = () => {
      if (previewUrlRef.current !== url) return
      clearPreview()
      setValidating(false)
      setError('This file could not be decoded as an image. Choose a valid JPEG, PNG, or WebP image.')
    }
    image.src = url
  }

  const cancelChanges = () => {
    clearPreview()
    setFile(null)
    setValidating(false)
    setRemoveImage(false)
    setPosition(appearance.position)
    setError('')
    setSuccess('')
  }

  const clearVideoPreview = () => {
    if (videoPreviewUrlRef.current) URL.revokeObjectURL(videoPreviewUrlRef.current)
    videoPreviewUrlRef.current = null
    setVideoPreviewUrl(null)
  }

  const chooseVideo = (selected) => {
    if (!selected) return
    setVideoError('')
    setVideoSuccess('')
    if (!isSupportedVideoType(selected)) {
      setVideoError('Choose an MP4 or WebM video file.')
      return
    }
    if (selected.size > MAX_VIDEO_SIZE_BYTES) {
      setVideoError('This video is larger than 50 MB. Choose a smaller, compressed video.')
      return
    }
    clearVideoPreview()
    const url = URL.createObjectURL(selected)
    videoPreviewUrlRef.current = url
    setVideoPreviewUrl(url)
    setVideoFile(selected)
  }

  const saveVideo = async () => {
    if (videoSubmitLock.current || !videoFile) return
    videoSubmitLock.current = true
    setVideoSaving(true)
    setVideoError('')
    setVideoSuccess('')
    try {
      await saveHomepageAppearance({ video: videoFile })
      clearVideoPreview()
      setVideoFile(null)
      await refresh()
      setVideoSuccess('Background video saved in this browser.')
    } catch (saveError) {
      setVideoError(readableStorageError(saveError))
    } finally {
      videoSubmitLock.current = false
      setVideoSaving(false)
    }
  }

  const removeVideo = async () => {
    if (videoSubmitLock.current) return
    videoSubmitLock.current = true
    setVideoSaving(true)
    setVideoError('')
    setVideoSuccess('')
    try {
      await saveHomepageAppearance({ video: null })
      clearVideoPreview()
      setVideoFile(null)
      await refresh()
      setVideoSuccess('Background video removed. The fallback background is now in use.')
    } catch (saveError) {
      setVideoError(readableStorageError(saveError))
    } finally {
      videoSubmitLock.current = false
      setVideoSaving(false)
    }
  }

  const publishChanges = async () => {
    if (submitLock.current) return
    setError('')
    setSuccess('')
    if (validating) {
      setError('Wait for the image preview to finish loading before publishing.')
      return
    }
    if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('This image is larger than 5 MB. Choose a smaller file.')
      return
    }

    submitLock.current = true
    setSaving(true)
    let nextAppearance
    try {
      nextAppearance = await saveHomepageAppearance({
        image: removeImage ? null : file ?? appearance.image,
        position,
      })
      clearPreview()
      setFile(null)
      setRemoveImage(false)
      setValidating(false)
    } catch (saveError) {
      setError(readableStorageError(saveError))
      submitLock.current = false
      setSaving(false)
      return
    }
    try {
      await refresh()
      setSuccess(`Changes saved in this browser${nextAppearance.image ? '.' : '. The default background is now in use.'}`)
    } catch {
      setSuccess('Changes were saved in this browser, but the preview could not be refreshed. Reload this page to see the saved settings.')
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }

  const displayedUrl = removeImage ? null : previewUrl ?? imageUrl
  const hasSavedOrDraftImage = Boolean(file || appearance.image)

  return (
    <>
      <PageHeader
        title="Homepage appearance"
        text="Choose the background image, position, and video shown behind the homepage hero."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="card overflow-hidden" aria-labelledby="background-heading">
          <div className="border-b border-line p-5 sm:p-6">
            <h2 id="background-heading" className="font-semibold">Hero background</h2>
            <p className="mt-1 text-sm text-ink-muted">Preview changes here before publishing them to the homepage in this browser.</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="relative isolate flex min-h-56 items-center overflow-hidden rounded-lg sm:min-h-72">
              <HomepageHeroBackground
                imageUrl={displayedUrl}
                position={position}
                onImageLoad={() => { if (previewUrl) setError('') }}
                onImageError={() => {
                  setError('The image preview could not be loaded. Choose another image.')
                  if (previewUrl) {
                    clearPreview()
                    setFile(null)
                    setValidating(false)
                  }
                }}
              />
              <div className="relative z-10 max-w-xl p-6 text-white sm:p-9">
                <p className="text-sm font-semibold text-emerald-200">Trusted local professionals</p>
                <p className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Find the Right Professional for Every Job</p>
                <div className="mt-4 h-10 max-w-sm rounded-md bg-white/95 shadow" aria-hidden="true" />
                <p className="mt-3 text-xs text-white/80">Hero background preview · text contrast overlay included</p>
              </div>
              {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-white/80 text-sm font-medium text-ink-soft" role="status">Loading saved appearance…</div>}
            </div>

            <div className="mt-6">
              <div
                onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  chooseFile(event.dataTransfer.files?.[0])
                }}
                className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors sm:p-6 ${dragging ? 'border-brand bg-brand-50' : 'border-slate-300 bg-slate-50'}`}
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-800 shadow-sm"><UploadCloud size={22} aria-hidden="true" /></span>
                <p className="mt-3 font-semibold">Drag and drop an image here</p>
                <p className="mt-1 text-sm text-ink-muted">JPEG, PNG, or WebP · maximum 5 MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Choose homepage background image"
                  className="sr-only"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                <Button variant="secondary" className="mt-4" onClick={() => inputRef.current?.click()}>
                  <Camera size={16} aria-hidden="true" /> {hasSavedOrDraftImage ? 'Replace Image' : 'Choose an Image'}
                </Button>
              </div>
              {(appearance.image || file) && !removeImage && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3">
                  <span className="flex items-center gap-2 text-sm font-medium"><ImageIcon size={17} className="text-brand" aria-hidden="true" />{file?.name || 'Current homepage background'}</span>
                  <Button variant="ghost" size="sm" onClick={() => { clearPreview(); setFile(null); setValidating(false); setRemoveImage(true); setError(''); setSuccess('') }}>
                    <Trash2 size={16} aria-hidden="true" /> Remove Image
                  </Button>
                </div>
              )}
              {removeImage && <p className="mt-3 text-sm text-ink-muted">The default background image will be used after you publish.</p>}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="display-heading">
            <h2 id="display-heading" className="font-semibold">Display settings</h2>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-ink-muted">Accepted formats: JPEG, PNG, and WebP. Maximum file size: 5 MB.</p>
              <div>
                <label htmlFor="image-position" className="mb-1.5 block text-sm font-medium">Image position</label>
                <select id="image-position" className="input" value={position} onChange={(event) => { setPosition(event.target.value); setSuccess('') }}>
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-brand-100 bg-brand-50 p-4" aria-label="Local storage information">
            <h2 className="text-sm font-semibold text-brand-800">Saved only in this browser</h2>
            <p className="mt-1 text-sm text-ink-soft">The image and settings are stored locally on this device. They are not uploaded, shared with other users, or synced to other devices. This page uses the existing demo sign-in; it is not secure server-side authorization.</p>
          </section>
        </aside>
      </div>

      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="video-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="video-heading" className="font-semibold">Homepage background video</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">Choose a short MP4 or WebM clip. Video files are limited to 50 MB and saved only in this browser.</p>
          </div>
          <VideoIcon size={21} className="text-brand" aria-hidden="true" />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg bg-navy">
          {videoPreviewUrl || videoUrl ? (
            <video
              key={videoPreviewUrl || videoUrl}
              className="aspect-video max-h-[28rem] w-full object-cover"
              src={videoPreviewUrl || videoUrl}
              controls
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setVideoError('')}
              onError={() => setVideoError('This video could not be previewed. Choose a valid MP4 or WebM file.')}
            />
          ) : (
            <div className="grid aspect-video place-items-center bg-gradient-to-br from-slate-950 via-blue-950 to-brand-900 p-6 text-center text-white">
              <div><VideoIcon size={36} className="mx-auto text-blue-200" aria-hidden="true" /><p className="mt-3 font-medium">No background video selected</p><p className="mt-1 text-sm text-white/70">The homepage will use its fallback background.</p></div>
            </div>
          )}
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          aria-label="Choose homepage background video"
          className="sr-only"
          onChange={(event) => { chooseVideo(event.target.files?.[0]); event.target.value = '' }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => videoInputRef.current?.click()} disabled={videoSaving}>
            <UploadCloud size={16} aria-hidden="true" /> {videoUrl || videoFile ? 'Replace Video' : 'Upload Background Video'}
          </Button>
          {videoFile && <Button onClick={saveVideo} loading={videoSaving} disabled={videoSaving}>Save and Publish</Button>}
          {(videoUrl || videoFile) && <Button variant="ghost" onClick={removeVideo} loading={videoSaving} disabled={videoSaving}>
            <Trash2 size={16} aria-hidden="true" /> Remove Video
          </Button>}
        </div>
        {videoFile && <p className="mt-2 text-sm text-ink-muted">Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB). Save and publish to persist it.</p>}
        {videoError && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{videoError}</p>}
        {videoSuccess && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{videoSuccess}</p>}
        <p className="mt-4 rounded-md border border-brand-100 bg-brand-50 p-3 text-sm text-ink-soft">This demo stores the selected video in this browser only. It is not shared with other visitors or devices. The admin check is simulated in the frontend; production access control and shared publishing need a backend with authorized media storage.</p>
      </section>

      {(loadError || error) && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error || loadError}</p>}
      {success && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{success}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={cancelChanges} disabled={saving}><RotateCcw size={16} aria-hidden="true" /> Cancel</Button>
        <Button onClick={publishChanges} loading={saving || validating} disabled={loading || saving || validating}>Publish Changes</Button>
      </div>
    </>
  )
}
