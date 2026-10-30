import { useRef, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import Field from '../../components/common/Field'
import Button from '../../components/common/Button'
import ProfilePhotoField from '../../components/common/ProfilePhotoField'
import useProfilePhoto from '../../hooks/useProfilePhoto'
import { useApp } from '../../app/AppContext'
import { locations } from '../../data/categories'
import { isEmail } from '../../utils/validation'
import { removeProfilePhoto, saveProfilePhoto } from '../../utils/profilePhotos'
import { formatDate } from '../../utils/format'

export default function CustomerProfile() {
  const { user, users, updateUser, toast } = useApp()
  const photo = useProfilePhoto(user.id)
  const initial = () => ({ name: user.name, email: user.email, phone: user.phone ?? '', area: user.area ?? '' })
  const [f, setF] = useState(initial)
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
    setF(initial())
    setErr({})
    setPhotoSelection({ type: 'unchanged' })
    setPhotoResetKey((key) => key + 1)
  }
  const save = async (e) => {
    e.preventDefault()
    if (submitLock.current) return
    const name = f.name.trim()
    const email = f.email.trim()
    const phone = f.phone.trim()
    const errors = {}
    if (name.length < 2) errors.name = 'Enter your name.'
    if (!isEmail(email)) errors.email = 'Enter a valid email address.'
    else if (users.some((item) => item.id !== user.id && (item.email ?? '').toLowerCase() === email.toLowerCase())) errors.email = 'This email is already used by another demo account.'
    if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) errors.phone = 'Use digits, spaces or dashes (at least 7 characters).'
    setErr(errors)
    if (Object.keys(errors).length) return toast('Fix the highlighted fields and try again.', 'error')
    submitLock.current = true
    setSaving(true)
    try {
      if (!updateUser(user.id, { name, email, phone, area: f.area })) {
        toast('Your profile could not be saved in this browser. Check available storage and try again.', 'error')
        return
      }
      try {
        if (photoSelection.type === 'file') await saveProfilePhoto(user.id, photoSelection.file)
        if (photoSelection.type === 'remove') await removeProfilePhoto(user.id)
      } catch (error) {
        toast(`Your profile details were saved, but the photo could not be stored: ${error.message}`, 'error')
        return
      }
      setF({ name, email, phone, area: f.area })
      setPhotoSelection({ type: 'unchanged' })
      setPhotoResetKey((key) => key + 1)
      toast('Profile saved in this browser.')
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }
  return (
    <>
      <PageHeader title="Edit your profile" text="Update the details providers use to contact you." />
      <form onSubmit={save} noValidate className="max-w-3xl space-y-5">
        <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-labelledby="account-info-heading">
          <div>
            <h2 id="account-info-heading" className="font-semibold">Account information</h2>
            <p className="mt-1 text-sm text-ink-soft">Your profile is saved locally in this browser.</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-ink-muted">Account type</dt><dd className="font-medium capitalize">{user.role}</dd></div>
            {user.joined && <div><dt className="text-ink-muted">Member since</dt><dd className="font-medium">{formatDate(user.joined)}</dd></div>}
          </dl>
        </section>
        <ProfilePhotoField name={f.name || user.name} photoUrl={photo.url} photoError={photo.error} selection={photoSelection} onSelectionChange={setPhotoSelection} resetKey={photoResetKey} disabled={saving} />
        <section className="card space-y-4 p-5 sm:p-6" aria-labelledby="contact-details-heading">
          <div>
            <h2 id="contact-details-heading" className="font-semibold">Contact details</h2>
            <p className="mt-1 text-sm text-ink-soft">Keep your information up to date for booking requests.</p>
          </div>
          <Field label="Display name" autoComplete="name" value={f.name} onChange={set('name')} error={err.name} required disabled={saving} />
          <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={err.email} required disabled={saving} />
          <Field label="Phone (optional)" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} error={err.phone} disabled={saving} />
          <Field label="Location" as="select" value={f.area} onChange={set('area')} disabled={saving}>
            <option value="">Select location</option>
            {locations.map((location) => <option key={location}>{location}</option>)}
          </Field>
          <p className="rounded-control bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Profile changes and photos are stored only in this browser. They are not synchronized to other devices or users.
          </p>
          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <Button type="submit" loading={saving} disabled={saving}>Save changes</Button>
            <Button variant="secondary" onClick={cancel} disabled={saving}>Cancel changes</Button>
          </div>
        </section>
      </form>
    </>
  )
}
