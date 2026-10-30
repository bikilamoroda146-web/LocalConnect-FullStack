import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowDown, Briefcase, Heart, MapPin } from 'lucide-react'
import ProfileAvatar from '../../components/common/ProfileAvatar'
import Rating from '../../components/common/Rating'
import Button from '../../components/common/Button'
import { Badge, VerificationBadge } from '../../components/common/Badges'
import AvailabilityPreview from '../../components/providers/AvailabilityPreview'
import ServiceCard from '../../components/services/ServiceCard'
import PortfolioImage from '../../components/providers/PortfolioImage'
import BookingRequestModal from '../../components/bookings/BookingRequestModal'
import Modal from '../../components/common/Modal'
import NotFound from './NotFound'
import { categoryById } from '../../data/categories'
import { useApp } from '../../app/AppContext'
import { formatDate } from '../../utils/format'
import { normalizePortfolio } from '../../utils/portfolio'

export default function ProviderProfile() {
  const { id } = useParams()
  const { user, providerOf, services, reviews, portfolios, isFavorite, toggleFavorite, markViewed } = useApp()
  const [book, setBook] = useState(null)
  const [viewing, setViewing] = useState(null)
  const p = providerOf(id)
  useEffect(() => { if (p) markViewed(p.id) }, [p?.id, markViewed]) // eslint-disable-line
  if (!p) return <NotFound message="We could not find that provider." />
  const own = services.filter((s) => s.providerId === p.id && s.published)
  const revs = reviews.filter((r) => r.providerId === p.id)
  const portfolio = normalizePortfolio(portfolios?.[p.id])
  const projects = portfolio.published ? portfolio.projects : []
  const saved = isFavorite(p.id)
  const category = categoryById(p.category)
  const CategoryIcon = category?.icon
  return (
    <div className="container-page py-8">
      <div className="relative h-40 overflow-hidden rounded-t-card bg-gradient-to-br from-brand-900 via-brand-700 to-emerald-400 sm:h-56">
        {portfolio.published && portfolio.coverId
          ? <PortfolioImage ownerId={p.id} mediaId={portfolio.coverId} alt={`${p.name}'s portfolio cover`} className="h-full w-full object-cover" />
          : CategoryIcon && <CategoryIcon size={112} strokeWidth={0.8} className="absolute bottom-[-1rem] right-8 text-white/30 sm:right-16" aria-hidden="true" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" aria-hidden="true" />
      </div>
      <section className="card relative flex flex-col gap-5 rounded-t-none p-5 sm:flex-row sm:items-start sm:p-7">
        <ProfileAvatar userId={p.userId} name={p.name} hue={p.hue} size={96} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{p.name}</h1>
          <p className="mt-1 text-lg text-ink-soft">{p.profession}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5"><MapPin size={16} aria-hidden="true" /> Serves {p.area}</span>
            <span className="flex items-center gap-1.5"><Briefcase size={16} /> {p.years} years experience</span>
            {category && <Badge>{category.name}</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4"><Rating value={p.rating} count={p.reviews} /><VerificationBadge verified={p.verified} /></div>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Button onClick={() => own[0] && setBook(own[0])} disabled={!own.length}>Request booking</Button>
          <Button variant="secondary" onClick={() => toggleFavorite(p.id)} aria-pressed={saved}><Heart size={16} className={saved ? 'fill-red-500 text-red-500' : ''} /> {saved ? 'Saved' : 'Save provider'}</Button>
          {own.length > 0 && <Button to={`/providers/${p.id}#services`} variant="ghost"><ArrowDown size={16} aria-hidden="true" /> View services</Button>}
          {user?.id === p.userId && <Button to="/provider/portfolio" variant="ghost">Manage portfolio</Button>}
        </div>
      </section>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section aria-labelledby="about"><h2 id="about" className="text-xl font-semibold">About {p.name.split(' ')[0]}</h2><p className="mt-2 max-w-prose leading-relaxed text-ink-soft">{p.bio}</p>
            {p.skills.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{p.skills.map((s) => <li key={s}><Badge tone="green">{s}</Badge></li>)}</ul>}</section>
          <section aria-labelledby="sv" id="services"><h2 id="sv" className="text-xl font-semibold">Published services</h2>
            {own.length === 0 ? <p className="mt-2 text-ink-soft">No published services yet.</p> : <div className="mt-3 grid gap-4 sm:grid-cols-2">{own.map((s) => <ServiceCard key={s.id} service={s} />)}</div>}</section>
          <section aria-labelledby="pf" id="portfolio"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="pf" className="text-xl font-semibold">Portfolio</h2><p className="mt-1 text-sm text-ink-muted">Published work from {p.name.split(' ')[0]}.</p></div>{user?.id === p.userId && <Link to="/provider/portfolio" className="text-sm font-semibold text-brand-800 hover:underline">Edit portfolio</Link>}</div>
            {!projects.length
              ? <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-ink-muted">This provider has not published any portfolio projects yet.</p>
              : <div className="mt-4 grid gap-4 sm:grid-cols-2">{projects.map((project) => <article key={project.id} className="card overflow-hidden">
                {project.photoIds?.length > 0
                  ? <div className={`grid aspect-[4/3] gap-1 overflow-hidden bg-slate-100 ${project.photoIds.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {project.photoIds.slice(0, 4).map((photoId, index) => <button key={photoId} type="button" onClick={() => setViewing({ project, index })} aria-label={`View photo ${index + 1} of ${project.title}`} className="min-h-0 min-w-0 overflow-hidden focus-visible:z-10 focus-visible:outline">
                      <PortfolioImage ownerId={p.id} mediaId={photoId} alt={`${project.title} portfolio photo ${index + 1}`} className="h-full w-full object-cover transition-transform duration-200 hover:scale-105" />
                    </button>)}
                  </div>
                  : <div className="flex aspect-[4/3] items-center justify-center bg-brand-50 text-brand-800"><Briefcase size={36} strokeWidth={1.25} aria-hidden="true" /></div>}
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{categoryById(project.category)?.name}</p>
                  <h3 className="mt-1 font-semibold">{project.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{project.description}</p>
                  {(project.location || project.completedAt) && <p className="mt-3 text-xs text-ink-muted">{[project.location, project.completedAt ? formatDate(project.completedAt) : ''].filter(Boolean).join(' · ')}</p>}
                </div>
              </article>)}</div>}</section>
          <section aria-labelledby="rv" id="reviews"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="rv" className="text-xl font-semibold">Reviews</h2><Rating value={p.rating} count={p.reviews} /></div><p className="mt-1 text-sm text-ink-muted">Illustrative demo reviews.</p>
            {revs.length === 0 ? <p className="mt-2 text-ink-soft">No reviews yet.</p> : <ul className="mt-3 space-y-3">{revs.map((r) => <li key={r.id} className="card p-4"><div className="flex justify-between"><p className="font-semibold">{r.author}</p><Rating value={r.rating} count={1} /></div><p className="mt-1 text-ink-soft">{r.text}</p></li>)}</ul>}</section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5"><h2 className="font-semibold">Availability</h2><p className="mt-1 text-sm text-ink-soft">Usual hours for this provider.</p><div className="mt-3"><AvailabilityPreview providerId={p.id} /></div></div>
          {!own.length && <p className="rounded-control border border-dashed border-line bg-surface p-4 text-sm text-ink-muted">This provider has no published services to book right now.</p>}
        </aside>
      </div>
      {book && <BookingRequestModal service={book} open onClose={() => setBook(null)} />}
      {viewing && <ProjectPhotoViewer ownerId={p.id} project={viewing.project} index={viewing.index} onChange={(index) => setViewing((current) => ({ ...current, index }))} onClose={() => setViewing(null)} />}
    </div>
  )
}

function ProjectPhotoViewer({ ownerId, project, index, onChange, onClose }) {
  const photoIds = project.photoIds ?? []
  const current = Math.min(index, photoIds.length - 1)
  return (
    <Modal open onClose={onClose} title={`${project.title} — photo ${current + 1} of ${photoIds.length}`}
      footer={<div className="flex w-full items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => onChange((current - 1 + photoIds.length) % photoIds.length)} disabled={photoIds.length < 2}>Previous photo</Button>
        <span className="text-sm text-ink-muted">{current + 1} / {photoIds.length}</span>
        <Button variant="secondary" onClick={() => onChange((current + 1) % photoIds.length)} disabled={photoIds.length < 2}>Next photo</Button>
      </div>}>
      <PortfolioImage ownerId={ownerId} mediaId={photoIds[current]} alt={`${project.title}, photo ${current + 1}`} className="max-h-[65vh] w-full rounded-md bg-slate-100" />
    </Modal>
  )
}
