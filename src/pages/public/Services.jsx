import { useCallback, useMemo, useRef, useState, useEffect, useId } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, LayoutGrid, List, X, SearchX, Search } from 'lucide-react'
import ServiceCard from '../../components/services/ServiceCard'
import Pagination from '../../components/common/Pagination'
import { EmptyState, CardSkeleton } from '../../components/common/States'
import Button from '../../components/common/Button'
import Field from '../../components/common/Field'
import { categories, locations } from '../../data/categories'
import { activeFilterChips, defaultFilters, priceRangeError, servicePrice } from '../../utils/filters'
import { fetchServices, normalizeService } from '../../api/services'
import useDialogFocus from '../../hooks/useDialogFocus'

const PAGE_SIZE = 6

function FilterPanel({ f, set, clear, availableLocations, hasRatings, rangeError }) {
  const priceId = useId()
  return (
    <div className="space-y-5">
      <Field label="Category" as="select" value={f.category} onChange={(e) => set({ category: e.target.value })}>
        <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Field>
      <Field label="Location" as="select" value={f.location} onChange={(e) => set({ location: e.target.value })}>
        <option value="">Any location</option>{availableLocations.map((l) => <option key={l}>{l}</option>)}
      </Field>
      <fieldset><legend className="mb-1.5 text-sm font-medium">Price (ETB)</legend>
        <div className="flex gap-2">
          <label htmlFor={`${priceId}-min`} className="sr-only">Minimum price</label>
          <input id={`${priceId}-min`} type="number" min="0" step="any" inputMode="decimal" placeholder="Min" className="input" value={f.min} onChange={(e) => set({ min: e.target.value })} aria-invalid={!!rangeError} aria-describedby={rangeError ? `${priceId}-error` : undefined} />
          <label htmlFor={`${priceId}-max`} className="sr-only">Maximum price</label>
          <input id={`${priceId}-max`} type="number" min="0" step="any" inputMode="decimal" placeholder="Max" className="input" value={f.max} onChange={(e) => set({ max: e.target.value })} aria-invalid={!!rangeError} aria-describedby={rangeError ? `${priceId}-error` : undefined} />
        </div>
        {rangeError && <p id={`${priceId}-error`} role="alert" className="mt-2 text-sm text-error-800">{rangeError}</p>}
      </fieldset>
      {hasRatings && <Field label="Minimum rating" as="select" value={f.rating} onChange={(e) => set({ rating: Number(e.target.value) })}>
        <option value={0}>Any rating</option><option value={4}>4.0 and up</option><option value={4.5}>4.5 and up</option><option value={4.8}>4.8 and up</option>
      </Field>}
      <Button variant="secondary" className="w-full" onClick={clear}>Clear all filters</Button>
    </div>
  )
}

export default function Services() {
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [layout, setLayout] = useState('grid')
  const [drawer, setDrawer] = useState(false)
  const closeDrawer = useCallback(() => setDrawer(false), [])
  const drawerRef = useRef(null)
  const drawerTitleId = useId()
  const [loading, setLoading] = useState(true)
  const [apiServices, setApiServices] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 })
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useDialogFocus(drawerRef, drawer, closeDrawer)

  const f = useMemo(() => ({
    ...defaultFilters,
    q: params.get('q') ?? '', category: params.get('category') ?? '', location: params.get('location') ?? '',
    min: params.get('min') ?? '', max: params.get('max') ?? '',
    rating: [0, 4, 4.5, 4.8].includes(Number(params.get('rating'))) ? Number(params.get('rating')) : 0,
    sort: ['relevance', 'price-asc', 'price-desc', 'rating'].includes(params.get('sort')) ? params.get('sort') : 'relevance',
  }), [params])
  const set = (patch) => {
    setParams((currentParams) => {
      const next = {
        ...defaultFilters,
        q: currentParams.get('q') ?? '',
        category: currentParams.get('category') ?? '',
        location: currentParams.get('location') ?? '',
        min: currentParams.get('min') ?? '',
        max: currentParams.get('max') ?? '',
        rating: Number(currentParams.get('rating') ?? 0),
        sort: currentParams.get('sort') ?? 'relevance',
        ...patch,
      }
      const updatedParams = new URLSearchParams()
      Object.entries(next).forEach(([key, value]) => {
        if (value !== '' && value !== 0 && !(key === 'sort' && value === 'relevance')) updatedParams.set(key, value)
      })
      return updatedParams
    }, { replace: true })
    setPage(1)
  }
  const clear = () => { setParams({}, { replace: true }); setPage(1) }
  const clearPriceRange = () => set({ min: '', max: '' })
  const rangeError = priceRangeError(f)
  useEffect(() => {
    if (rangeError) {
      setApiServices([])
      setMeta({ page, pageSize: PAGE_SIZE, total: 0, totalPages: 0 })
      setError('')
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')
    fetchServices({
      q: f.q,
      category: f.category,
      location: f.location,
      min: f.min,
      max: f.max,
      rating: f.rating || undefined,
      sort: f.sort,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((body) => {
        if (!active) return
        setApiServices((body.data ?? []).map(normalizeService))
        setMeta(body.meta ?? { page, pageSize: PAGE_SIZE, total: 0, totalPages: 0 })
      })
      .catch((requestError) => {
        if (!active) return
        setApiServices([])
        setMeta({ page, pageSize: PAGE_SIZE, total: 0, totalPages: 0 })
        setError(requestError.message || 'Could not load services.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [f, page, rangeError, retry])
  const availableLocations = useMemo(() => [...new Set([
    ...locations,
    ...apiServices.map((service) => service.area).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b)), [apiServices])
  const hasPrices = useMemo(() => apiServices.some((service) => servicePrice(service) !== null), [apiServices])
  const hasRatings = useMemo(() => apiServices.some((service) => Number(service.averageRating) > 0 && Number(service.reviewCount) > 0), [apiServices])
  useEffect(() => { setPage(1) }, [params])
  const pages = meta.totalPages
  const shown = apiServices
  const chips = activeFilterChips(f)

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-semibold">Browse services</h1>
      <p className="mt-1 text-ink-soft">Search local professionals, compare prices and request a booking.</p>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mt-5 max-w-2xl">
        <label htmlFor="dq" className="sr-only">Search by service, provider or keyword</label>
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input id="dq" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search by service, provider or keyword" className={`input pl-10 ${f.q ? 'pr-11' : ''}`} />
        {f.q && <button type="button" onClick={() => set({ q: '' })} aria-label="Clear search" className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><X size={17} aria-hidden="true" /></button>}
      </form>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters"><div className="card sticky top-24 p-5"><FilterPanel f={f} set={set} clear={clear} availableLocations={availableLocations} hasRatings={hasRatings} rangeError={rangeError} /></div></aside>
        <section aria-label="Results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft" aria-live="polite">{rangeError ? 'Review the price range below.' : <><span className="font-semibold text-ink">{meta.total}</span> {meta.total === 1 ? 'service' : 'services'} found</>}</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal size={16} aria-hidden="true" /> Filters{chips.length > 0 && ` (${chips.length})`}</Button>
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select id="sort" className="input !w-auto !py-1.5 text-sm" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="relevance">Relevance</option>{hasPrices && <><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></>}{hasRatings && <option value="rating">Highest rated</option>}
              </select>
              <div className="hidden overflow-hidden rounded-md border border-slate-300 sm:flex" role="group" aria-label="Layout">
                {[['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']].map(([id, Icon, label]) => (
                  <button key={id} type="button" onClick={() => setLayout(id)} aria-pressed={layout === id} aria-label={label} className={`flex h-10 w-10 items-center justify-center focus-visible:z-10 ${layout === id ? 'bg-brand-50 text-brand-800' : 'bg-white text-ink-soft'}`}><Icon size={16} aria-hidden="true" /></button>
                ))}
              </div>
            </div>
          </div>
          {rangeError && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-control border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-800" role="alert"><span>{rangeError}</span><button type="button" onClick={clearPriceRange} className="min-h-9 font-semibold underline underline-offset-2">Clear price range</button></div>}
          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((c) => <li key={c.key}><button type="button" onClick={() => set({ [c.key]: c.key === 'rating' ? 0 : '' })} className="flex min-h-9 items-center gap-1 rounded-pill bg-brand-50 px-3 py-1 text-sm text-brand-800 hover:bg-brand-100" aria-label={`Remove filter ${c.label}`}>{c.label}<X size={14} aria-hidden="true" /></button></li>)}
              <li><button type="button" onClick={clear} className="min-h-9 px-2 text-sm font-medium text-ink-soft underline">Clear all</button></li>
            </ul>
          )}
          <div className="mt-5">
            {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading services">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
              : error ? <EmptyState icon={SearchX} title="Could not load services" text={error} actionLabel="Try again" onAction={() => setRetry((value) => value + 1)} />
              : rangeError ? <EmptyState icon={SearchX} title="Check your price range" text="Correct the minimum and maximum prices to see matching services." />
              : shown.length === 0 ? <EmptyState icon={SearchX} title="No services match these filters" text="Try a broader search, a different location or a wider price range." actionLabel="Clear all filters" onAction={clear} />
              : <div className={layout === 'list' ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>{shown.map((s) => <ServiceCard key={s.id} service={s} layout={layout} />)}</div>}
          </div>
          <Pagination page={page} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0 }) }} />
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby={drawerTitleId}>
          <div className="absolute inset-0 bg-navy/50" onClick={() => setDrawer(false)} />
          <div ref={drawerRef} tabIndex={-1} className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between"><h2 id={drawerTitleId} className="text-lg font-semibold">Filters</h2><button onClick={() => setDrawer(false)} aria-label="Close filters" className="p-2"><X /></button></div>
            <FilterPanel f={f} set={set} clear={clear} availableLocations={availableLocations} hasRatings={hasRatings} rangeError={rangeError} />
            <Button className="mt-3 w-full" onClick={() => setDrawer(false)}>
              {rangeError ? 'Show services' : `Show ${meta.total} ${meta.total === 1 ? 'service' : 'services'}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
