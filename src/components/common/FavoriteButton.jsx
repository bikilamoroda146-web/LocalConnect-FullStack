import { Heart } from 'lucide-react'
import { useApp } from '../../app/AppContext'
export default function FavoriteButton({ id, label = 'favorites', className = '' }) {
  const { isFavorite, toggleFavorite } = useApp()
  const on = isFavorite(id)
  return (
    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(id) }} aria-pressed={on} aria-label={on ? `Remove ${label} from favorites` : `Save ${label} to favorites`}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/95 text-ink-soft transition-colors hover:text-red-600 ${className}`}>
      <Heart size={18} className={on ? 'fill-red-500 text-red-500' : ''} aria-hidden="true" />
    </button>
  )
}
