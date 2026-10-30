import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Briefcase, MapPin, CircleDollarSign } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Field from '../../components/common/Field'
import Modal, { ConfirmDialog } from '../../components/common/Modal'
import ServiceArt from '../../components/common/ServiceArt'
import { Badge } from '../../components/common/Badges'
import { EmptyState } from '../../components/common/States'
import { useApp } from '../../app/AppContext'
import { categories, categoryById } from '../../data/categories'
import { priceLabel } from '../../utils/format'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, isSupportedImageType } from '../../utils/media'
import { removeServiceImage, saveServiceImage } from '../../utils/serviceImages'

const blank = { title: '', category: 'home-repairs', desc: '', price: '', unit: 'per visit', area: '', image: '', includesText: '' }

function ServiceForm({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState({})
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const submitLock = useRef(false)
  const originalImage = useRef(initial.image)
  useEffect(() => {
    if (!imageFile) { setImagePreview(''); return undefined }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])
  const set = (k) => (e) => {
    setF((current) => ({ ...current, [k]: e.target.value }))
    setErr((current) => {
      if (!current[k]) return current
      const next = { ...current }
      delete next[k]
      return next
    })
  }
  const chooseImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!isSupportedImageType(file)) {
      setErr((current) => ({ ...current, image: `Choose a JPEG, PNG, or WebP image (${ACCEPTED_IMAGE_TYPES.join(', ')}).` }))
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErr((current) => ({ ...current, image: 'Choose an image smaller than 5 MB.' }))
      return
    }
    setImageFile(file)
    setErr((current) => { const next = { ...current }; delete next.image; return next })
  }
  const submit = async (e) => {
    e.preventDefault()
    if (submitLock.current) return
    const errors = {}
    if (f.title.trim().length < 4) errors.title = 'Enter a title of at least 4 characters.'
    if (f.desc.trim().length < 20) errors.desc = 'Describe the service in at least 20 characters.'
    const price = Number(f.price)
    if (!Number.isFinite(price) || price <= 0) errors.price = 'Enter a valid price greater than 0.'
    if (!categories.some((category) => category.id === f.category)) errors.category = 'Choose a valid category.'
    if (!['per visit', 'per hour', 'per item', 'estimate', 'from'].includes(f.unit)) errors.unit = 'Choose a valid price type.'
    if (!f.area.trim()) errors.area = 'Enter the area you serve.'
    if (!imageFile && f.image?.trim() && !f.image.startsWith('indexeddb:')) {
      try {
        const url = new URL(f.image.trim())
        if (!['http:', 'https:'].includes(url.protocol)) errors.image = 'Use an image link starting with http:// or https://.'
      } catch {
        errors.image = 'Enter a complete image URL starting with http:// or https://.'
      }
    }
    setErr(errors)
    if (Object.keys(errors).length) return
    submitLock.current = true
    setSaving(true)
    const { includesText, ...rest } = f
    try {
      const nextImage = imageFile ? await saveServiceImage(imageFile) : f.image?.trim() ?? ''
      await onSave({ ...rest, title: f.title.trim(), desc: f.desc.trim(), image: nextImage, price, includes: includesText.split('\n').map((x) => x.trim()).filter(Boolean) })
      if (originalImage.current?.startsWith('indexeddb:') && originalImage.current !== nextImage) removeServiceImage(originalImage.current).catch(() => {})
      onClose()
    } catch (error) {
      setErr((current) => ({ ...current, form: `Service could not be saved: ${error.message}` }))
      submitLock.current = false
      setSaving(false)
    }
  }
  return (
    <Modal open onClose={saving ? () => {} : onClose} title={f.id ? 'Edit service' : 'Add a service'} footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="svc-form" loading={saving} disabled={saving}>{saving ? 'Saving…' : f.id ? 'Save changes' : 'Publish service'}</Button></>}>
      <form id="svc-form" onSubmit={submit} noValidate className="space-y-4">
        <p className="rounded-control bg-brand-50 p-3 text-sm text-brand-900">
          Tell customers what you offer, where you work, and how your price is calculated. Published listings are saved to LocalConnect.
        </p>
        <Field label="Service title" value={f.title} onChange={set('title')} error={err.title} maxLength={100} required disabled={saving} hint="Use a short, specific name customers can scan." />
        <Field label="Category" as="select" value={f.category} onChange={set('category')} error={err.category} required disabled={saving}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Field>
        <Field label="Description" as="textarea" rows={4} value={f.desc} onChange={set('desc')} error={err.desc} maxLength={1000} required disabled={saving} hint="Describe the work and any important limitations (at least 20 characters)." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (ETB)" type="number" min="0.01" step="0.01" inputMode="decimal" value={f.price} onChange={set('price')} error={err.price} required disabled={saving} hint="Enter an amount greater than zero." />
          <Field label="Price type" as="select" value={f.unit} onChange={set('unit')} error={err.unit} required disabled={saving}>{['per visit', 'per hour', 'per item', 'estimate', 'from'].map((u) => <option key={u}>{u}</option>)}</Field>
        </div>
        <Field label="Service area" value={f.area} onChange={set('area')} error={err.area} maxLength={100} required disabled={saving} hint="Enter the city or area where you provide this service." />
        <Field label="What’s included (optional)" as="textarea" rows={3} value={f.includesText} onChange={set('includesText')} maxLength={1000} disabled={saving} hint="List one item per line." />
        <div>
          <label htmlFor="service-image" className="mb-1.5 block text-sm font-medium text-ink">Service image (optional)</label>
          <p id="service-image-hint" className="mb-2 text-sm text-ink-muted">JPEG, PNG, or WebP. Maximum 5 MB. The image stays in this browser and is not uploaded to a server.</p>
          <input id="service-image" type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={chooseImage} disabled={saving} aria-describedby={err.image ? 'service-image-hint service-image-error' : 'service-image-hint'} className="block w-full rounded-control border border-line bg-white p-2 text-sm file:mr-3 file:min-h-10 file:rounded-control file:border-0 file:bg-brand-50 file:px-3 file:font-semibold file:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" />
          {err.image && <p id="service-image-error" role="alert" className="mt-1 text-sm text-error-700">{err.image}</p>}
          {(imageFile || f.image) && <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => document.getElementById('service-image')?.click()} disabled={saving}>Replace image</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setImageFile(null); setF((current) => ({ ...current, image: '' })); setErr((current) => { const next = { ...current }; delete next.image; return next }) }} disabled={saving}>Remove image</Button>
          </div>}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Image preview</p>
          <ServiceArt category={f.category} src={imagePreview || (!err.image ? f.image : undefined)} className="h-36 rounded-md sm:h-44" alt={f.title ? `${f.title} image preview` : 'Service image preview'} />
        </div>
        {err.form && <p role="alert" className="text-sm text-red-700">{err.form}</p>}
      </form>
    </Modal>
  )
}

export default function ProviderServices() {
  const { user, services, saveService, togglePublish, deleteService } = useApp()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const own = services.filter((s) => s.providerId === user.providerId && `${s.title} ${s.desc} ${s.area}`.toLowerCase().includes(q.trim().toLowerCase()))
  const open = (s) => setForm(s ? { ...s, includesText: (s.includes ?? []).join('\n'), image: s.image ?? '' } : { ...blank, area: '' })
  return (
    <>
      <PageHeader title="My services" text="Published services appear in search. Unpublished ones stay hidden." action={<Button onClick={() => open()}><Plus size={16} /> Add a service</Button>} />
      <div className="relative mb-5 max-w-lg">
        <label htmlFor="sq" className="sr-only">Search your services</label>
        <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input id="sq" className="input pl-9" placeholder="Search title, description, or area" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {own.length === 0 ? <EmptyState icon={Briefcase} title={q ? 'No matching services' : 'You have no services yet'} text="Add a service with a clear price and service area." actionLabel="Add a service" onAction={() => open()} /> : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{own.map((s) => (
          <li key={s.id} className="card flex min-w-0 flex-col overflow-hidden">
            <ServiceArt category={s.category} src={s.image} className="h-36 sm:h-44" size={36} alt={`${s.title} service image`} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={s.published ? 'green' : 'slate'}>{s.published ? <><Eye size={13} aria-hidden="true" /> Published</> : <><EyeOff size={13} aria-hidden="true" /> Unpublished</>}</Badge>
                <span className="text-xs text-ink-muted">{categoryById(s.category)?.name ?? 'Service'}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug">{s.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{s.desc}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" />{s.area}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink"><CircleDollarSign size={15} aria-hidden="true" />{priceLabel(s)}</span>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button size="sm" variant="secondary" onClick={() => open(s)}><Pencil size={14} aria-hidden="true" /> Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => togglePublish(s.id)}>{s.published ? <><EyeOff size={14} aria-hidden="true" /> Unpublish</> : <><Eye size={14} aria-hidden="true" /> Publish</>}</Button>
                <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setDel(s)}><Trash2 size={14} aria-hidden="true" /> Delete</Button>
              </div>
            </div>
          </li>))}</ul>)}
      {form && <ServiceForm initial={form} onClose={() => setForm(null)} onSave={(d) => saveService({ ...d, providerId: user.providerId })} />}
      <ConfirmDialog open={!!del} danger onClose={() => setDel(null)} title="Delete this service?" confirmLabel="Delete service" message={`“${del?.title}” will be removed from this browser’s demo data. Existing booking records are not erased.`} onConfirm={() => del && deleteService(del.id)} />
    </>
  )
}
