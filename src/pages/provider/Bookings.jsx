import { useMemo, useState } from 'react'
import { Inbox, Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import Field from '../../components/common/Field'
import { ConfirmDialog } from '../../components/common/Modal'
import { StatusBadge } from '../../components/common/Badges'
import { EmptyState } from '../../components/common/States'
import BookingDetails from '../../components/bookings/BookingDetails'
import { useApp } from '../../app/AppContext'
import { formatDate } from '../../utils/format'
import { allowedNext } from '../../utils/bookings'

const TABS = [['all', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['closed', 'Cancelled / declined']]
const match = (tab, b) => tab === 'all' || (tab === 'closed' ? ['cancelled', 'rejected'].includes(b.status) : b.status === tab)
const LABEL = { confirmed: 'Accept', rejected: 'Decline', completed: 'Mark completed', cancelled: 'Cancel booking' }

export default function ProviderBookings() {
  const { user, bookings, serviceOf, userOf, changeBookingStatus } = useApp()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const mine = bookings.filter((b) => b.providerId === user.providerId)
  const list = useMemo(() => {
    const search = query.trim().toLowerCase()
    return mine.filter((booking) => {
      if (!match(tab, booking)) return false
      if (!search) return true
      const service = serviceOf(booking.serviceId)
      const customer = userOf(booking.customerId)
      return [booking.id, service?.title, customer?.name, booking.status, booking.note]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [mine, query, serviceOf, tab, userOf])
  const selectedHasBookings = mine.some((booking) => match(tab, booking))
  return (
    <>
      <PageHeader title="Booking requests" text="Accept or decline pending requests and mark finished jobs as completed." />
      <Tabs label="Booking status" value={tab} onChange={setTab} tabs={TABS.map(([id, label]) => ({ id, label, count: mine.filter((b) => match(id, b)).length }))} />
      <div className="mt-5 max-w-lg">
        <Field label="Search bookings" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Search service, customer, reference, or note" hint="Results stay within the selected status." />
      </div>
      <div className="mt-5">
        {list.length === 0 ? (
          query || selectedHasBookings
            ? <EmptyState icon={Search} title="No matching bookings" text="Try a different search or clear the search to see all bookings in this status." actionLabel="Clear search" onAction={() => setQuery('')} />
            : <EmptyState icon={Inbox} title="No bookings here" text="Requests from customers for your services will appear in this list. Demo booking data is stored in this browser." />
        ) : (
          <ul className="space-y-3">{list.map((b) => (
            <li key={b.id} className="card flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{(b.isRemote ? b.service?.title : serviceOf(b.serviceId)?.title) ?? 'Service details unavailable'}</h2>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">{(b.isRemote ? b.customer?.name : userOf(b.customerId)?.name) ?? 'Customer details unavailable'} · {formatDate(b.date)} at {b.time}</p>
                <p className="mt-1 text-xs text-ink-muted">Ref {b.id}</p>
                {b.note && <p className="mt-3 rounded-control bg-slate-50 p-3 text-sm text-ink-soft">“{b.note}”</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setView(b)}>Details</Button>
                {!b.isRemote && allowedNext(b.status, 'provider').map((to) => <Button key={to} size="sm" variant={to === 'confirmed' || to === 'completed' ? 'primary' : 'secondary'} onClick={() => setConfirm({ b, to })}>{LABEL[to]}</Button>)}
              </div>
            </li>))}</ul>)}
      </div>
      <BookingDetails booking={view} onClose={() => setView(null)} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} danger={confirm && ['rejected', 'cancelled'].includes(confirm.to)}
        title={confirm ? `${LABEL[confirm.to]}?` : ''} confirmLabel={confirm ? LABEL[confirm.to] : ''}
        message={confirm ? `${LABEL[confirm.to]} for ${serviceOf(confirm.b.serviceId)?.title ?? 'this booking'}? This updates the booking status in this browser’s demo data.` : ''}
        onConfirm={() => confirm && changeBookingStatus(confirm.b.id, confirm.to, 'provider')} />
    </>
  )
}
