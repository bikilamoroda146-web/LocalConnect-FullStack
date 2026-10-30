import { useEffect, useState } from 'react'
import fallbackImage from '../../assets/homepage-hero-fallback.svg'

export default function HomepageHeroBackground({ imageUrl, position = 'center', onImageError, onImageLoad }) {
  const [customImageFailed, setCustomImageFailed] = useState(false)
  const [fallbackImageFailed, setFallbackImageFailed] = useState(false)

  useEffect(() => {
    setCustomImageFailed(false)
    setFallbackImageFailed(false)
  }, [imageUrl])

  const objectPosition = position === 'top' ? 'center top' : position === 'bottom' ? 'center bottom' : 'center center'
  const showingCustomImage = Boolean(imageUrl) && !customImageFailed
  const source = showingCustomImage ? imageUrl : fallbackImage
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-brand-800" aria-hidden="true">
      {!fallbackImageFailed && (
        <img
          src={source}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition }}
          onLoad={onImageLoad}
          onError={() => {
            if (showingCustomImage) {
              setCustomImageFailed(true)
              onImageError?.()
            } else {
              setFallbackImageFailed(true)
            }
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-950/55" />
    </div>
  )
}
