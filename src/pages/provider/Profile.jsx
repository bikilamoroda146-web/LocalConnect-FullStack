import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Field from '../../components/common/Field'
import Button from '../../components/common/Button'
import ProfilePhotoField from '../../components/common/ProfilePhotoField'
import { VerificationBadge } from '../../components/common/Badges'
import useProfilePhoto from '../../hooks/useProfilePhoto'
import { useApp } from '../../app/AppContext'
import { categories, locations } from '../../data/categories'
import { removeProfilePhoto, saveProfilePhoto } from '../../utils/profilePhotos'

export default function ProviderProfileEdit() {
  const { user, providerOf, updateProvider, updateUser, toast } = useApp()
  const p = providerOf(user.providerId)
  const photo = useProfilePhoto(user.id)
  const init = () => ({ name: user.name, profession: p.profession, category: p.category, area: p.area, years: p.years, bio: p.bio, skills: p.skills.join(', ') })
  const [f, setF] = useState(init)
  const [err, setErr] = useState({})
  const [photoSelection, setPhotoSelection] = useState({ type: 'unchanged' })
  const [photoResetKey, setPhotoResetKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const submitLock = useRef(false)
  const set = (k) => (e) => {
    setF((current) => ({ ...current, [k]: e.target.value }))
    setErr((current) => {
      if (!current[k]) return current
      const next = { ...current }
      delete next[k]
      return next
    })
  }
  const cancel = () => {
    setF(init())
    setErr({})
    setPhotoSelection({ type: 'unchanged' })
    setPhotoResetKey((key) => key + 1)
  }
  const save = async (e) => {
    e.preventDefault()
    if (submitLock.current) return
    const errors = {}
    if (f.name.trim().length < 2) errors.name = 'Enter your display name.'
    if (f.profession.trim().length < 3) errors.profession = 'Enter your profession.'
    if (f.bio.trim().length < 30) errors.bio = 'Write at least 30 characters about your work.'
    const years = Number(f.years)
    if (!String(f.years).trim() || !Number.isInteger(years) || years < 0 || years > 60) errors.years = 'Enter a whole number of years from 0 to 60.'
    if (!categories.some((category) => category.id === f.category)) errors.category = 'Choose a valid service category.'
    if (!locations.includes(f.area)) errors.area = 'Choose a service area.'
    setErr(errors)
    if (Object.keys(errors).length) return toast('Fix the highlighted fields and try again.', 'error')
    submitLock.current = true
    setSaving(true)
    try {
      const userUpdated = updateUser(user.id, { name: f.name.trim(), area: f.area })
      if (!userUpdated) {
        toast('Your profile could not be saved in this browser. Check available storage and try again.', 'error')
        return
      }
      const providerUpdated = updateProvider(p.id, {
        name: f.name.trim(),
        profession: f.profession.trim(),
        category: f.category,
        area: f.area,
        years,
        bio: f.bio.trim(),
        skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      if (!providerUpdated) {
        updateUser(user.id, { name: user.name, area: user.area })
        toast('Your public profile could not be saved in this browser. Try again.', 'error')
        return
      }
      try {
        if (photoSelection.type === 'file') await saveProfilePhoto(user.id, photoSelection.file)
        if (photoSelection.type === 'remove') await removeProfilePhoto(user.id)
      } catch (error) {
        toast(`Your profile details were saved, but the photo could not be stored: ${error.message}`, 'error')
        return
      }
      setF((current) => ({ ...current, name: current.name.trim(), profession: current.profession.trim(), bio: current.bio.trim() }))
      setPhotoSelection({ type: 'unchanged' })
      setPhotoResetKey((key) => key + 1)
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }
  return (
    <>
      <PageHeader title="Edit your profile" text="Update your public provider details. Changes are saved only in this browser." action={<Button to={`/providers/${p.id}`} variant="secondary">Preview public profile</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form onSubmit={save} noValidate className="space-y-4">
          <ProfilePhotoField name={f.name || user.name} photoUrl={photo.url} photoError={photo.error} selection={photoSelection} onSelectionChange={setPhotoSelection} resetKey={photoResetKey} disabled={saving} />
          <div className="card space-y-4 p-5 sm:p-6">
          <div><h2 className="font-semibold">Public profile details</h2><p className="mt-1 text-sm text-ink-soft">Required fields are used to identify your services and service area.</p></div>
          <Field label="Display name" autoComplete="name" value={f.name} onChange={set('name')} error={err.name} required maxLength={100} />
          <Field label="Profession" value={f.profession} onChange={set('profession')} error={err.profession} required maxLength={100} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" as="select" value={f.category} onChange={set('category')} error={err.category} required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Field>
            <Field label="Service area" as="select" value={f.area} onChange={set('area')} error={err.area} required>{locations.map((l) => <option key={l}>{l}</option>)}</Field>
          </div>
          <Field label="Years of experience" type="number" min="0" max="60" step="1" value={f.years} onChange={set('years')} error={err.years} required hint="Enter a whole number from 0 to 60." />
          <Field label="Biography" as="textarea" rows={5} value={f.bio} onChange={set('bio')} error={err.bio} maxLength={2000} required hint="Describe your services and approach in at least 30 characters." />
          <Field label="Skills" value={f.skills} onChange={set('skills')} maxLength={500} hint="Separate skills with commas." />
          <p className="rounded-control bg-amber-50 px-3 py-2 text-sm text-amber-900">Your public profile and photo are stored only in this browser. Changes are not synchronized to other devices or users.</p>
          <div className="flex flex-wrap gap-3 border-t border-line pt-4"><Button type="submit" loading={saving} disabled={saving}>Save changes</Button><Button variant="secondary" onClick={cancel} disabled={saving}>Cancel changes</Button></div>
          </div>
        </form>
        <aside className="card h-fit p-5">
          <h2 className="font-semibold">Your portfolio</h2>
          <p className="mt-1 text-sm text-ink-muted">Show customers project photos, details, and a custom cover image.</p>
          <Button to="/provider/portfolio" variant="secondary" className="mt-4 w-full">Manage portfolio</Button>
          <div className="mt-4 border-t border-line pt-4"><p className="text-sm text-ink-soft">Verification</p><VerificationBadge verified={p.verified} /><p className="mt-1 text-xs text-ink-muted">Set in demo data. Cannot be changed here.</p></div>
        </aside>
      </div>
    </>
  )
}
