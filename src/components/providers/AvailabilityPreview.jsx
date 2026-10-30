import { useApp } from '../../app/AppContext'
export default function AvailabilityPreview({ providerId }) {
  const { getAvailability, DAYS } = useApp()
  const a = getAvailability(providerId)
  return (
    <ul className="divide-y divide-line rounded-md border border-line bg-white text-sm">
      {DAYS.map((d) => (
        <li key={d} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="font-medium">{d}</span>
          <span className={a[d].on ? 'text-ink-soft' : 'text-ink-muted'}>{a[d].on ? a[d].slots.map((s) => `${s.start}–${s.end}`).join(', ') : 'Unavailable'}</span>
        </li>
      ))}
    </ul>
  )
}
