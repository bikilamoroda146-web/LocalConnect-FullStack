import { Star } from 'lucide-react'
export default function Rating({ value, count, size = 16 }) {
  if (!count) return <span className="text-sm text-ink-muted">No reviews yet</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value} out of 5 from ${count} reviews`}>
      <Star size={size} className="fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      <span className="text-ink-muted">({count})</span>
    </span>
  )
}
