import { useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { useApp } from '../../app/AppContext'
import { validateRanges } from '../../utils/validation'

export default function Availability() {
  const { user, getAvailability, saveAvailability, DAYS, toast } = useApp()
  const saved = getAvailability(user.providerId)
  const [a, setA] = useState(structuredClone(saved))
  const [errs, setErrs] = useState({})
  const [saving, setSaving] = useState(false)
  const submitLock = useRef(false)
  const dirty = JSON.stringify(a) !== JSON.stringify(saved)
  const patch = (day, fn) => {
    const changedDay = fn(a[day])
    setA((current) => ({ ...current, [day]: fn(current[day]) }))
    setErrs((current) => {
      if (!current[day]) return current
      const next = { ...current }
      const message = changedDay.on
        ? changedDay.slots.length ? validateRanges(changedDay.slots) : 'Add at least one time slot or turn the day off.'
        : ''
      if (message) next[day] = message
      else delete next[day]
      return next
    })
  }
  const save = () => {
    if (submitLock.current) return
    const e = {}
    DAYS.forEach((d) => { if (a[d].on) { const m = a[d].slots.length ? validateRanges(a[d].slots) : 'Add at least one time slot or turn the day off.'; if (m) e[d] = m } })
    setErrs(e)
    if (Object.keys(e).length) return toast('Fix the highlighted days before saving.', 'error')
    submitLock.current = true
    setSaving(true)
    try {
      saveAvailability(user.providerId, a)
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }
  return (
    <>
      <PageHeader title="Availability" text="Set the days and hours customers can request." action={<div className="flex gap-2"><Button variant="secondary" disabled={!dirty || saving} onClick={() => { setA(structuredClone(saved)); setErrs({}) }}>Discard changes</Button><Button disabled={!dirty || saving} loading={saving} onClick={save}>{saving ? 'Saving…' : 'Save availability'}</Button></div>} />
      <p className="mb-4 rounded-control border border-line bg-surface p-4 text-sm text-ink-soft">
        Turn on the days you work and add one or more time ranges. Times use your local browser clock; ranges cannot overlap.
      </p>
      <ul className="space-y-3">{DAYS.map((d) => (
        <li key={d} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex min-h-11 items-center gap-3 font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={a[d].on} onChange={(e) => patch(d, (x) => ({ ...x, on: e.target.checked }))} />
              {d}
              <span className={`rounded-pill px-2 py-1 text-xs font-medium ${a[d].on ? 'bg-success-50 text-success-800' : 'bg-slate-100 text-slate-700'}`}>{a[d].on ? 'Working' : 'Unavailable'}</span>
            </label>
            {a[d].on && <Button size="sm" variant="secondary" onClick={() => patch(d, (x) => ({ ...x, slots: [...x.slots, { start: '', end: '' }] }))}><Plus size={14} aria-hidden="true" /> Add time slot</Button>}
          </div>
          {a[d].on && <div className="mt-2 space-y-2">{a[d].slots.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-control bg-slate-50 p-3">
              <label className="sr-only" htmlFor={`${d}s${i}`}>{d} slot {i + 1} start</label><input id={`${d}s${i}`} type="time" className="input !w-auto" value={s.start} onChange={(e) => patch(d, (x) => ({ ...x, slots: x.slots.map((y, j) => j === i ? { ...y, start: e.target.value } : y) }))} aria-invalid={!!errs[d]} aria-describedby={errs[d] ? `${d}-availability-error` : undefined} />
              <span className="text-ink-muted">to</span>
              <label className="sr-only" htmlFor={`${d}e${i}`}>{d} slot {i + 1} end</label><input id={`${d}e${i}`} type="time" className="input !w-auto" value={s.end} onChange={(e) => patch(d, (x) => ({ ...x, slots: x.slots.map((y, j) => j === i ? { ...y, end: e.target.value } : y) }))} aria-invalid={!!errs[d]} aria-describedby={errs[d] ? `${d}-availability-error` : undefined} />
              <button type="button" aria-label={`Remove ${d} slot ${i + 1}`} onClick={() => patch(d, (x) => ({ ...x, slots: x.slots.filter((_, j) => j !== i) }))} className="flex h-10 w-10 items-center justify-center rounded text-ink-muted hover:bg-white hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Trash2 size={16} aria-hidden="true" /></button>
            </div>))}
            {errs[d] && <p id={`${d}-availability-error`} role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">{errs[d]}</p>}
            {!a[d].slots.length && <p className="text-sm text-ink-muted">No time slots. Add one or mark this day unavailable.</p>}
          </div>}
          {!a[d].on && <p className="text-sm text-ink-muted">Customers cannot request appointments for this day.</p>}
        </li>))}</ul>
    </>
  )
}
