import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ClipboardList,
  Compass,
  Search,
  Sparkles,
} from 'lucide-react'
import SearchBar from '../../components/forms/SearchBar'
import Button from '../../components/common/Button'
import ProviderCard from '../../components/providers/ProviderCard'
import ServiceCard from '../../components/services/ServiceCard'
import ServiceArt from '../../components/common/ServiceArt'
import ProfileAvatar from '../../components/common/ProfileAvatar'
import Rating from '../../components/common/Rating'
import { Badge } from '../../components/common/Badges'
import { EmptyState } from '../../components/common/States'
import { categories } from '../../data/categories'
import { useApp } from '../../app/AppContext'
import useHomepageAppearance from '../../hooks/useHomepageAppearance'
import HomepageHeroBackground from '../../components/public/HomepageHeroBackground'
import HomepageHeroVideo from '../../components/public/HomepageHeroVideo'

const steps = [
  {
    icon: Search,
    title: 'Find a service',
    text: 'Search by what you need or where you are, then compare the available listings.',
  },
  {
    icon: Compass,
    title: 'Choose a provider',
    text: 'Explore provider profiles, service details, prices, and the information available.',
  },
  {
    icon: CalendarCheck,
    title: 'Request a booking',
    text: 'Choose a preferred date and time, and follow the request in your dashboard.',
  },
]

const benefits = [
  {
    icon: ClipboardList,
    title: 'Compare useful details',
    text: 'Listings show service descriptions, locations, and the price format provided.',
  },
  {
    icon: CalendarCheck,
    title: 'Keep booking requests together',
    text: 'The demo dashboard shows request status and appointment details in one place.',
  },
  {
    icon: Sparkles,
    title: 'Explore at your own pace',
    text: 'Browse categories and provider profiles before deciding whether to request a service.',
  },
]

export default function Home() {
  const { providers, services, reviews, providerOf } = useApp()
  const { imageUrl, videoUrl, appearance } = useHomepageAppearance()
  const publishedServices = services.filter((service) => service.published)
  const featuredServices = [...publishedServices]
    .sort((a, b) => (providerOf(b.providerId)?.rating ?? 0) - (providerOf(a.providerId)?.rating ?? 0))
    .slice(0, 4)
  const featuredProviders = [...providers]
    .filter((provider) => provider.rating > 0 && provider.reviews > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)
  const sampleReviews = reviews.slice(0, 3)
  const heroService = featuredServices[0]
  const heroProvider = heroService ? providerOf(heroService.providerId) : null

  return (
    <>
      <section className="home-hero-lighting relative isolate overflow-hidden bg-navy">
        <HomepageHeroBackground imageUrl={imageUrl} position={appearance.position} />
        <HomepageHeroVideo videoUrl={videoUrl} />
        <div className="container-page relative z-10 flex items-center py-14 sm:py-20 lg:min-h-[560px] lg:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
              <Sparkles size={15} aria-hidden="true" /> Local services, made easier to explore
            </p>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find the right help for your next project
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Explore local services, compare provider details, and send a booking request when you find a good fit.
            </p>
            <div className="mt-8 max-w-2xl">
              <SearchBar />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5"><Check size={16} aria-hidden="true" /> Browse by service</span>
              <span className="inline-flex items-center gap-1.5"><Check size={16} aria-hidden="true" /> Compare listed prices</span>
              <span className="inline-flex items-center gap-1.5"><Check size={16} aria-hidden="true" /> Request a preferred time</span>
            </div>
          </div>

          <div className="hidden">
            <div className="overflow-hidden rounded-panel border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
              {heroService ? (
                <ServiceArt
                  category={heroService.category}
                  src={heroService.image}
                  hue={heroProvider?.hue}
                  className="h-64 rounded-card sm:h-80"
                  size={88}
                  alt={`${heroService.title} service illustration`}
                />
              ) : (
                <div className="grid h-64 place-items-center rounded-card bg-gradient-to-br from-brand-50 to-brand-100 text-brand-800 sm:h-80">
                  <Search size={72} strokeWidth={1.25} aria-hidden="true" />
                </div>
              )}
            </div>
            {heroService && heroProvider && (
              <article className="relative mx-3 -mt-12 rounded-card border border-line bg-white p-4 shadow-lift sm:mx-6 sm:p-5">
                <div className="flex items-center gap-3">
                  <ProfileAvatar userId={heroProvider.userId} name={heroProvider.name} hue={heroProvider.hue} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{heroService.title}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{heroProvider.name} · {heroProvider.profession}</p>
                  </div>
                  <Rating value={heroProvider.rating} count={heroProvider.reviews} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{heroService.desc}</p>
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16" aria-labelledby="categories-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-800">Start exploring</p>
            <h2 id="categories-heading" className="mt-1 text-2xl font-semibold sm:text-3xl">Popular categories</h2>
          </div>
          <Link to="/services" className="inline-flex min-h-11 items-center gap-1 rounded-control px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 hover:underline">
            All services <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {categories.map(({ id, name, icon: Icon, blurb }) => {
            const count = publishedServices.filter((service) => service.category === id).length
            return (
              <li key={id}>
                <Link
                  to={`/services?category=${encodeURIComponent(id)}`}
                  className="group flex h-full min-h-40 flex-col rounded-card border border-line bg-white p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-control bg-brand-50 text-brand-800 transition-colors group-hover:bg-brand group-hover:text-white">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="mt-3 font-semibold leading-snug text-ink">{name}</span>
                  <span className="mt-1 text-sm leading-snug text-ink-soft">{blurb}</span>
                  <span className="mt-auto pt-3 text-xs font-medium text-ink-muted">{count} {count === 1 ? 'listing' : 'listings'}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="border-y border-line bg-white py-14 sm:py-16" aria-labelledby="services-heading">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-800">A place to begin</p>
              <h2 id="services-heading" className="mt-1 text-2xl font-semibold sm:text-3xl">Featured services</h2>
              <p className="mt-2 max-w-xl text-ink-soft">A selection of published listings from the LocalConnect demo data.</p>
            </div>
            <Button to="/services" variant="secondary">Browse all services <ArrowRight size={16} aria-hidden="true" /></Button>
          </div>
          {featuredServices.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={Search} title="No services to feature yet" text="Browse services to check again when listings are available." actionLabel="Browse services" actionTo="/services" />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredServices.map((service) => <ServiceCard key={service.id} service={service} showDescription />)}
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-14 sm:py-16" aria-labelledby="providers-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-800">Meet the professionals</p>
            <h2 id="providers-heading" className="mt-1 text-2xl font-semibold sm:text-3xl">Featured providers</h2>
            <p className="mt-2 text-sm text-ink-muted">Ratings and profiles shown here use illustrative demo data.</p>
          </div>
          <Button to="/services" variant="secondary">Explore providers <ArrowRight size={16} aria-hidden="true" /></Button>
        </div>
        {featuredProviders.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={Compass} title="No providers to feature yet" text="Browse the service listings to discover providers." actionLabel="Browse services" actionTo="/services" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProviders.map((provider) => <ProviderCard key={provider.id} provider={provider} showVerification={false} />)}
          </div>
        )}
      </section>

      <section className="border-y border-line bg-brand-50/70 py-14 sm:py-16" aria-labelledby="how-heading">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-800">A simple place to start</p>
            <h2 id="how-heading" className="mt-1 text-2xl font-semibold sm:text-3xl">How LocalConnect works</h2>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-control bg-brand-50 text-brand-800"><Icon size={21} aria-hidden="true" /></span>
                  <span className="text-sm font-semibold text-ink-muted">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16" aria-labelledby="benefits-heading">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-800">Useful details, all in one demo</p>
          <h2 id="benefits-heading" className="mt-1 text-2xl font-semibold sm:text-3xl">Explore with more context</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-secondary-50 text-secondary-800"><Icon size={21} aria-hidden="true" /></span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white py-14 sm:py-16" aria-labelledby="reviews-heading">
        <div className="container-page">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-800">From the demo dataset</p>
              <h2 id="reviews-heading" className="mt-1 text-2xl font-semibold sm:text-3xl">Sample reviews</h2>
            </div>
            <Badge tone="amber">Illustrative only · not genuine customer testimonials</Badge>
          </div>
          {sampleReviews.length === 0 ? (
            <p className="mt-6 rounded-card border border-dashed border-slate-300 p-6 text-center text-ink-soft">There are no sample reviews to show.</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {sampleReviews.map((review) => {
                const provider = providerOf(review.providerId)
                return (
                  <li key={review.id} className="rounded-card border border-line bg-canvas p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Rating value={review.rating} count={1} />
                      <span className="text-xs font-medium text-ink-muted">Sample</span>
                    </div>
                    <blockquote className="mt-4 text-sm leading-relaxed text-ink-soft">“{review.text}”</blockquote>
                    <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                      {provider && <ProfileAvatar userId={provider.userId} name={provider.name} hue={provider.hue} size={36} />}
                      <div>
                        <p className="text-sm font-semibold text-ink">{review.author}</p>
                        <p className="text-xs text-ink-muted">{provider?.name ?? 'Local provider'}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="overflow-hidden rounded-panel bg-navy px-5 py-10 text-center text-white shadow-lift sm:px-10 sm:py-14">
          <p className="text-sm font-semibold text-brand-100">Your next step starts here</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Ready to explore LocalConnect?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Browse service listings as a customer, or create a provider demo profile to explore the provider tools.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/services" size="lg">Find a service</Button>
            <Button to="/register?role=provider" variant="light" size="lg">Join as a provider</Button>
          </div>
        </div>
      </section>
    </>
  )
}
