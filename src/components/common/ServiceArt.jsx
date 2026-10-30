import { useEffect, useState } from 'react'
import { categoryById } from '../../data/categories'
import { getServiceImage, isStoredServiceImage } from '../../utils/serviceImages'
// Stand-in "photo" panel: tinted category illustration. Replace with real photography via the `src` prop.
export default function ServiceArt({ category, hue = 160, src, alt = '', className = 'h-40', size = 56 }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState(null)
  useEffect(() => {
    let active = true
    let objectUrl
    setImageFailed(false)
    setResolvedSrc(null)
    if (!src) return () => { active = false }
    if (!isStoredServiceImage(src)) {
      setResolvedSrc(src)
      return () => { active = false }
    }
    getServiceImage(src).then((blob) => {
      if (!active || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setResolvedSrc(objectUrl)
    }).catch(() => setImageFailed(true))
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])
  if (resolvedSrc && !imageFailed) return <img src={resolvedSrc} alt={alt} className={`w-full object-cover ${className}`} loading="lazy" onError={() => setImageFailed(true)} />
  const Icon = categoryById(category)?.icon
  return (
    <div role="img" aria-label={alt || 'Service illustration'} className={`flex w-full items-center justify-center ${className}`} style={{ background: `hsl(${hue} 32% 91%)`, color: `hsl(${hue} 50% 28%)` }}>
      {Icon && <Icon size={size} strokeWidth={1.25} aria-hidden="true" />}
    </div>
  )
}
