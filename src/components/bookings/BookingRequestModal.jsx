import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Field from '../common/Field'
import { useApp } from '../../app/AppContext'
import { TODAY, todayISO, priceLabel } from '../../utils/format'
import { servicePrice } from '../../utils/filters'

export default function BookingRequestModal({ service, open, onClose, databaseBacked = false }) {
  const { user, createBooking, createDatabaseBooking, toast } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [f, setF] = useState({ date: '', time: '10:00', note: '' })
  const [err, setErr] = useState({})
  const [saving, setSaving] = useState(false)
  const submitLock = useRef(false)
  useEffect(() => {
    if (!open) submitLock.current = false
  }, [open])
  const hasPrice = servicePrice(service) !== null
  const set = (k) => (e) => {
    setF((current) => ({ ...current, [k]: e.target.value }))
    setErr((current) => {
      if (!current[k]) return current
      const next = { ...current }
      delete next[k]
      return next
    })
  }
  const close = () => {
    if (saving) return
    submitLock.current = false
    setF({ date: '', time: '10:00', note: '' })
    setErr({})
    onClose()
  }

  if (open && !user) {
    return (
      <Modal open onClose={onClose} title="Sign in to request a booking"
        footer={<><Button variant="secondary" onClick={onClose}>Not now</Button><Button onClick={() => nav('/login', { state: { from: loc.pathname } })}>Sign in</Button></>}>
        <p className="text-ink-soft">Sign in as a customer to send a secure booking request.</p>
      </Modal>
    )
  }
  if (open && user.role !== 'customer') {
    return <Modal open onClose={onClose} title="Customer accounts only" footer={<Button onClick={onClose}>Close</Button>}><p className="text-ink-soft">Sign in as a customer to request a booking.</p></Modal>
  }
  const submit = async (e) => {
    e.preventDefault()
    if (submitLock.current) return
    const errors = {}
    const minimumDate = databaseBacked ? todayISO() : TODAY
    if (!f.date) errors.date = 'Choose a date.'
    else if (f.date <= minimumDate) errors.date = 'Choose a date after today.'
    if (!f.time) errors.time = 'Choose a time.'
    setErr(errors)
    if (Object.keys(errors).length) return
    submitLock.current = true
    setSaving(true)
    try {
      const input = { serviceId: service.id, date: f.date, time: f.time, note: f.note.trim() }
      if (databaseBacked) await createDatabaseBooking(input)
      else createBooking(input)
      setSaving(false)
      setF({ date: '', time: '10:00', note: '' })
      setErr({})
      onClose()
      nav('/customer/bookings')
    } catch (error) {
      submitLock.current = false
      setSaving(false)
      toast(`Booking request could not be saved: ${error.message}`, 'error')
    }
  }
  return (
      <Modal open={open} onClose={close} title="Request a booking"
      footer={<><Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button><Button type="submit" form="booking-form" loading={saving} disabled={saving}>{saving ? 'Sending request…' : 'Send request'}</Button></>}>
      <form id="booking-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="rounded-md bg-slate-50 p-3 text-sm"><p className="font-semibold">{service.title}</p><p className="text-ink-soft">{hasPrice ? `${priceLabel(service)} · estimate only, no payment is taken` : 'Price to be agreed with the provider. No payment is taken here.'}</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred date" type="date" min={databaseBacked ? todayISO() : TODAY} value={f.date} onChange={set('date')} error={err.date} required disabled={saving} />
          <Field label="Preferred time" type="time" value={f.time} onChange={set('time')} error={err.time} required disabled={saving} />
        </div>
        <Field label="What do you need done? (optional)" as="textarea" rows={3} value={f.note} onChange={set('note')} maxLength={300} disabled={saving} hint={`${f.note.length}/300 characters`} />
      </form>
    </Modal>
  )
}
