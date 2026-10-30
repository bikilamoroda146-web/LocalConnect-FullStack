import { Heart } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/States'
import ProviderCard from '../../components/providers/ProviderCard'
import ServiceCard from '../../components/services/ServiceCard'
import { useApp } from '../../app/AppContext'

export default function Favorites() {
  const { favorites, providerOf, serviceOf } = useApp()
  const provs = favorites.map((k) => k.startsWith('p') ? providerOf(k) : null).filter(Boolean)
  const svcs = favorites.map((k) => k.startsWith('s') ? serviceOf(k) : null).filter(Boolean)
  const missingCount = favorites.length - provs.length - svcs.length
  return (
    <>
      <PageHeader title="Favorites" text="Your saved providers and services. Use the heart on any card to remove it." />
      {!provs.length && !svcs.length ? (
        <EmptyState icon={Heart} title="Nothing saved yet" text="Tap the heart on a provider or service to keep it here. Favorites are stored in this browser." actionLabel="Discover services" actionTo="/services" />
      ) : (
        <div className="space-y-8">
          {missingCount > 0 && <p role="status" className="rounded-control border border-line bg-slate-50 p-3 text-sm text-ink-soft">Some saved records are no longer available and are hidden from this list.</p>}
          {provs.length > 0 && (
            <section aria-labelledby="fp">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 id="fp" className="text-lg font-semibold">Providers</h2>
                <span className="text-sm text-ink-muted">{provs.length} saved</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{provs.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
            </section>
          )}
          {svcs.length > 0 && (
            <section aria-labelledby="fs">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 id="fs" className="text-lg font-semibold">Services</h2>
                <span className="text-sm text-ink-muted">{svcs.length} saved</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{svcs.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
