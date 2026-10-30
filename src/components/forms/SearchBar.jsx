import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin } from 'lucide-react'
import Button from '../common/Button'
import { locations } from '../../data/categories'
import { useApp } from '../../app/AppContext'

export default function SearchBar() {
  const [q, setQ] = useState('')
  const [loc, setLoc] = useState('')
  const { services } = useApp()
  const nav = useNavigate()
  const availableLocations = useMemo(() => [...new Set([
    ...locations,
    ...services.map((service) => service.area).filter(Boolean),
  ])], [services])
  const submit = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (loc) p.set('location', loc)
    nav(`/services${p.toString() ? `?${p}` : ''}`)
  }
  return (
    <form onSubmit={submit} role="search" aria-label="Search services" className="card flex flex-col gap-2 p-2 shadow-lift sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="hero-q" className="sr-only">What do you need help with?</label>
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input id="hero-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plumber, cleaner, tutor…" className="input border-0 pl-10 focus:ring-0 sm:h-12" />
      </div>
      <div className="relative sm:w-52 sm:border-l sm:border-line">
        <label htmlFor="hero-loc" className="sr-only">Location</label>
        <MapPin size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <select id="hero-loc" value={loc} onChange={(e) => setLoc(e.target.value)} className="input border-0 pl-10 focus:ring-0 sm:h-12">
          <option value="">Any location</option>
          {availableLocations.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <Button type="submit" size="lg">Search</Button>
    </form>
  )
}
