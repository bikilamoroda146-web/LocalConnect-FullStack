import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { getPortfolioMedia } from '../../utils/profilePhotos'

export default function PortfolioImage({ ownerId, mediaId, alt, className = '' }) {
  const [image, setImage] = useState({ mediaId: null, url: null, error: '' })

  useEffect(() => {
    let active = true
    let url = null
    setImage({ mediaId, url: null, error: '' })
    if (mediaId) {
      getPortfolioMedia(mediaId, ownerId).then((blob) => {
        if (!active) return
        if (!blob) {
          setImage({ mediaId, url: null, error: 'This photo is no longer available.' })
          return
        }
        url = URL.createObjectURL(blob)
        setImage({ mediaId, url, error: '' })
      }).catch((error) => {
        if (active) setImage({ mediaId, url: null, error: error.message })
      })
    }
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [mediaId, ownerId])

  if (!mediaId || image.mediaId !== mediaId || !image.url) {
    return (
      <span role="img" aria-label={image.error || alt || 'Portfolio photo'} className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <ImageOff size={28} aria-hidden="true" />
      </span>
    )
  }
  return <img src={image.url} alt={alt} className={`object-cover ${className}`} onError={() => {
    URL.revokeObjectURL(image.url)
    setImage({ mediaId, url: null, error: 'This photo could not be displayed.' })
  }} />
}
