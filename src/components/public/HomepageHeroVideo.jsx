import { useEffect, useState } from 'react'
import posterImage from '../../assets/homepage-hero-fallback.svg'

export default function HomepageHeroVideo({ videoUrl }) {
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (event) => setReducedMotion(event.matches)
    setReducedMotion(preference.matches)
    preference.addEventListener?.('change', updatePreference)
    return () => preference.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => {
    setPlaying(false)
    setFailed(false)
  }, [videoUrl])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-navy" aria-hidden="true">
      <img src={posterImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {videoUrl && !failed && !reducedMotion && <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterImage}
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
        >
          <source src={videoUrl} />
        </video>}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/60 to-slate-950/55" />
    </div>
  )
}
