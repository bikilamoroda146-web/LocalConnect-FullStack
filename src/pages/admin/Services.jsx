import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Pagination from '../../components/common/Pagination'
import Button from '../../components/common/Button'
import Field from '../../components/common/Field'
import { ConfirmDialog } from '../../components/common/Modal'
import { Badge } from '../../components/common/Badges'
import { useApp } from '../../app/AppContext'
import { categories, categoryById } from '../../data/categories'
import { priceLabel } from '../../utils/format'

const PAGE_SIZE = 10

export default function AdminServices() {
  const { services, providers, providerOf, togglePublish } = useApp()
  const [q, setQ] = useState('')
  const [prov, setProv] = useState('')
  const [cat, setCat] = useState('')
  const [pub, setPub] = useState('')
  const [page, setPage] = useState(1)
  const [moderation, setModeration] = useState(null)
  const updateFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return services.filter((service) => {
      const provider = providerOf(service.providerId)
      const matchesText = !query || [
        service.title, service.desc, service.area, provider?.name, categoryById(service.category)?.name,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
      return matchesText &&
        (!prov || service.providerId === prov) &&
        (!cat || service.category === cat) &&
        (!pub || String(service.published) === pub)
    })
  }, [services, q, prov, cat, pub, providerOf])
  const pages = Math.ceil(rows.length / PAGE_SIZE)
  useEffect(() => setPage((current) => Math.min(current, Math.max(1, pages))), [pages])
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <PageHeader title="Services" text={`${rows.length} matching listings from sample data.`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_repeat(3,minmax(10rem,auto))]">
        <div className="relative">
          <label className="sr-only" htmlFor="asq">Search services</label>
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input id="asq" className="input pl-9" value={q} onChange={updateFilter(setQ)} placeholder="Search title, provider, area" />
        </div>
        <Field label="Provider" as="select" value={prov} onChange={updateFilter(setProv)}>
          <option value="">All providers</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
        </Field>
        <Field label="Category" as="select" value={cat} onChange={updateFilter(setCat)}>
          <option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Field>
        <Field label="Publication status" as="select" value={pub} onChange={updateFilter(setPub)}>
          <option value="">Any status</option><option value="true">Published</option><option value="false">Unpublished</option>
        </Field>
      </div>
      <DataTable empty="No services match these filters." rows={shown} columns={[
        { key: 't', header: 'Service', render: (service) => <div className="min-w-0"><p className="font-medium">{service.title}</p><p className="mt-1 line-clamp-2 text-xs text-ink-muted">{service.desc}</p></div> },
        { key: 'p', header: 'Provider', render: (service) => providerOf(service.providerId)?.name ?? 'Provider unavailable' },
        { key: 'c', header: 'Category / area', render: (service) => <span>{categoryById(service.category)?.name ?? service.category}<br /><span className="text-xs text-ink-muted">{service.area}</span></span> },
        { key: 'pr', header: 'Price', render: (service) => priceLabel(service) },
        { key: 'st', header: 'Publication', render: (service) => <Badge tone={service.published ? 'green' : 'slate'}>{service.published ? 'Published' : 'Unpublished'}</Badge> },
        { key: 'a', header: 'Moderation', render: (service) => <Button size="sm" variant="secondary" onClick={() => setModeration(service)}>{service.published ? 'Unpublish' : 'Publish'}</Button> },
      ]} />
      <Pagination page={page} pages={pages} onChange={setPage} />
      <ConfirmDialog
        open={!!moderation}
        onClose={() => setModeration(null)}
        danger={!!moderation?.published}
        title={moderation?.published ? 'Unpublish this service?' : 'Publish this service?'}
        confirmLabel={moderation?.published ? 'Unpublish service' : 'Publish service'}
        message={moderation
          ? `${moderation.published ? 'Unpublishing' : 'Publishing'} “${moderation.title}” updates its visibility in this browser’s sample data.`
          : ''}
        onConfirm={() => moderation && togglePublish(moderation.id)}
      />
    </>
  )
}
