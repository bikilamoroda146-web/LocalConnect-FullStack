import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import ServiceArt from '../common/ServiceArt'
import Rating from '../common/Rating'
import FavoriteButton from '../common/FavoriteButton'
import { categoryById } from '../../data/categories'
import { priceLabel } from '../../utils/format'
import { servicePrice } from '../../utils/filters'
import { useApp } from '../../app/AppContext'

export default function ServiceCard({ service, layout = 'grid', showDescription = false }) {
  const { providerOf } = useApp()
  const p = service.provider ?? providerOf(service.providerId)
  const list = layout === 'list'
  const price = servicePrice(service)
  const hasRating = Number.isFinite(Number(p?.rating)) && Number(p.rating) > 0 &&
    Number(p.rating) <= 5 && Number(p.reviews) > 0
  return (
    <article className={`card relative overflow-hidden transition-shadow hover:shadow-lift ${list ? 'sm:flex' : 'flex flex-col'}`}>
      <div className={list ? 'sm:w-56 sm:shrink-0' : ''}><ServiceArt category={service.category} src={service.image} hue={p?.hue} className={list ? 'h-36 sm:h-full' : 'h-36'} alt={`${categoryById(service.category)?.name ?? 'Local'} service`} /></div>
      <FavoriteButton id={service.id} label={service.title} className="absolute right-3 top-3 z-10" />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-brand-800">{categoryById(service.category)?.name}</p>
        <h3 className="mt-1 font-semibold leading-snug"><Link to={`/services/${service.id}`} className="after:absolute after:inset-0 after:content-[''] hover:underline">{service.title}</Link></h3>
        {p && <p className="mt-1 text-sm text-ink-soft">{p.name} · {p.profession}</p>}
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted"><MapPin size={14} aria-hidden="true" /> {service.area}</p>
        {(list || showDescription) && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{service.desc}</p>}
        <div className="mt-auto flex items-end justify-between pt-4">
          {price !== null && <p className="text-sm font-semibold">{priceLabel(service)}</p>}
          {hasRating && <Rating value={Number(p.rating)} count={Number(p.reviews)} />}
        </div>
      </div>
    </article>
  )
}
