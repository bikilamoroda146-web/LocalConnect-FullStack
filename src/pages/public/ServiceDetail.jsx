import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, ChevronRight, MapPin, SearchX } from 'lucide-react'
import ServiceArt from '../../components/common/ServiceArt'
import ProfileAvatar from '../../components/common/ProfileAvatar'
import Rating from '../../components/common/Rating'
import Button from '../../components/common/Button'
import FavoriteButton from '../../components/common/FavoriteButton'
import { VerificationBadge } from '../../components/common/Badges'
import ServiceCard from '../../components/services/ServiceCard'
import BookingRequestModal from '../../components/bookings/BookingRequestModal'
import AvailabilityPreview from '../../components/providers/AvailabilityPreview'
import { EmptyState } from '../../components/common/States'
import NotFound from './NotFound'
import { categoryById } from '../../data/categories'
import { priceLabel } from '../../utils/format'
import { servicePrice } from '../../utils/filters'
import { fetchServiceById } from '../../api/services'
import { useApp } from '../../app/AppContext'

export default function ServiceDetail() {
  const { id } = useParams()
  const { serviceOf, providerOf, services, reviews, markViewed } = useApp()
  const mockService = serviceOf(id)
  const [remoteService, setRemoteService] = useState(null)
  const [requestState, setRequestState] = useState({ loading: !mockService, error: '', notFound: false })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (mockService) {
      setRemoteService(null)
      setRequestState({ loading: false, error: '', notFound: false })
      return undefined
    }

    let active = true
    setRequestState({ loading: true, error: '', notFound: false })
    fetchServiceById(id)
      .then((value) => {
        if (!active) return
        setRemoteService(value)
        setRequestState({ loading: false, error: '', notFound: false })
      })
      .catch((error) => {
        if (!active) return
        setRemoteService(null)
        setRequestState({ loading: false, error: error.status === 404 ? '' : error.message, notFound: error.status === 404 })
      })

    return () => { active = false }
  }, [id, mockService?.id])

  const service = mockService ?? remoteService
  const isRemote = !mockService && Boolean(remoteService)

  useEffect(() => { if (service) markViewed(service.id) }, [service?.id, markViewed]) // eslint-disable-line

  if (!service && requestState.loading) {
    return <div className="container-page py-16 text-center" role="status">Loading service details...</div>
  }
  if (!service && requestState.notFound) return <NotFound message="We could not find that service." />
  if (!service) {
    return <div className="container-page py-16"><EmptyState icon={SearchX} title="Could not load service" text={requestState.error || 'Please try again.'} actionLabel="Try again" onAction={() => window.location.reload()} /></div>
  }

  const provider = service.provider ?? providerOf(service.providerId)
  const category = categoryById(service.category)
  const hasPrice = servicePrice(service) !== null
  const related = isRemote ? [] : services
    .filter((item) => item.id !== service.id && item.published && item.category === service.category)
    .slice(0, 3)
  const providerReviews = isRemote ? (service.reviews ?? []) : reviews.filter((review) => review.providerId === service.providerId)
  const bookingUnavailable = !service.published

  return (
    <div className="container-page py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link to="/" className="hover:text-brand-800 hover:underline">Home</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link to="/services" className="hover:text-brand-800 hover:underline">Services</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link to={`/services?category=${service.category}`} className="hover:text-brand-800 hover:underline">
          {category?.name ?? 'Services'}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink">{service.title}</span>
      </nav>

      <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-start justify-center p-6 sm:p-9 lg:p-10">
            <Link
              to={`/services?category=${service.category}`}
              className="rounded-pill bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800 hover:bg-brand-100"
            >
              {category?.name ?? 'Local service'}
            </Link>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{service.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-ink-soft">
              <MapPin size={18} aria-hidden="true" />
              <span>Serving {service.area}</span>
            </p>
            {provider && (
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <Rating value={provider.rating} count={provider.reviews} />
                <span className="hidden h-4 border-l border-line sm:block" aria-hidden="true" />
                <Link to={`/providers/${provider.id}`} className="flex items-center gap-2 text-sm font-medium hover:text-brand-800 hover:underline">
                  <ProfileAvatar userId={provider.userId} name={provider.name} hue={provider.hue} size={30} />
                  {provider.name}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}
            <p className="mt-5 max-w-xl leading-relaxed text-ink-soft">{service.desc}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => setOpen(true)} disabled={bookingUnavailable}>
                <CalendarDays size={18} aria-hidden="true" />
                Request booking
              </Button>
              <FavoriteButton id={service.id} label={service.title} />
            </div>
            {isRemote && (
              <p role="status" className="mt-4 rounded-control bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Your request will be saved to LocalConnect and start as pending. No payment is taken.
              </p>
            )}
            {!isRemote && !service.published && (
              <p role="status" className="mt-4 rounded-control bg-amber-50 px-3 py-2 text-sm text-amber-900">
                This service is currently unpublished and cannot be booked.
              </p>
            )}
          </div>
          <ServiceArt
            category={service.category}
            src={service.image}
            hue={provider?.hue}
            className="h-60 sm:h-80 lg:h-full lg:min-h-[440px]"
            size={104}
            alt={`${category?.name ?? 'Local'} service illustration`}
          />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-8">
          {Array.isArray(service.includes) && service.includes.length > 0 && (
            <section aria-labelledby="included-heading">
              <h2 id="included-heading" className="text-xl font-semibold">What’s included</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {service.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 rounded-control border border-line bg-surface p-3">
                    <Check size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="reviews-heading" id="reviews">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="reviews-heading" className="text-xl font-semibold">Provider reviews</h2>
              {provider && <Rating value={provider.rating} count={provider.reviews} />}
            </div>
            <p className="mt-1 text-sm text-ink-muted">Illustrative demo reviews.</p>
            {providerReviews.length === 0 ? (
              <p className="mt-3 rounded-control border border-dashed border-line p-4 text-ink-soft">No reviews yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {providerReviews.map((review) => (
                  <li key={review.id} className="card p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{review.author}</p>
                      <Rating value={review.rating} count={1} />
                    </div>
                    <p className="mt-2 text-ink-soft">{review.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {related.length > 0 && (
            <section aria-labelledby="related-heading">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-800">Explore more</p>
                  <h2 id="related-heading" className="mt-1 text-xl font-semibold">Related services</h2>
                </div>
                <Link to="/services" className="text-sm font-semibold text-brand-800 hover:underline">All services</Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((item) => <ServiceCard key={item.id} service={item} />)}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <p className="text-sm font-medium text-ink-muted">Service price</p>
            {hasPrice ? (
              <>
                <p className="mt-1 text-3xl font-semibold">{priceLabel(service)}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Final price is agreed with the provider. No payment is taken here.
                </p>
              </>
            ) : (
              <p className="mt-1 text-lg font-semibold">Contact provider for pricing</p>
            )}
            <Button size="lg" className="mt-5 w-full" onClick={() => setOpen(true)} disabled={bookingUnavailable}>
              <CalendarDays size={18} aria-hidden="true" />
              Request booking
            </Button>
            {isRemote && <p className="mt-2 text-center text-xs text-ink-muted">The provider will review this request before confirming it.</p>}
            {!isRemote && !service.published && <p className="mt-2 text-center text-xs text-ink-muted">Booking is unavailable for this service.</p>}

            {provider && (
              <div className="mt-6 border-t border-line pt-5">
                <div className="flex items-center gap-3">
                  <ProfileAvatar userId={provider.userId} name={provider.name} hue={provider.hue} size={48} />
                  <div className="min-w-0">
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-ink-soft">{provider.profession}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Rating value={provider.rating} count={provider.reviews} />
                  {provider.verified && <VerificationBadge verified={provider.verified} />}
                </div>
                <Button to={`/providers/${provider.id}`} variant="secondary" className="mt-4 w-full">
                  View provider profile
                </Button>
              </div>
            )}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">Availability</h2>
            <p className="mt-1 text-sm text-ink-soft">Typical hours for this provider.</p>
            <div className="mt-3"><AvailabilityPreview providerId={service.providerId} /></div>
          </div>
        </aside>
      </div>

      <BookingRequestModal service={service} open={open} onClose={() => setOpen(false)} databaseBacked={isRemote} />
    </div>
  )
}
