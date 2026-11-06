import { useMemo, useState } from 'react'
import { CalendarDays, CalendarX, Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import Field from '../../components/common/Field'
import Modal, { ConfirmDialog } from '../../components/common/Modal'
import { StatusBadge } from '../../components/common/Badges'
import { EmptyState } from '../../components/common/States'
import BookingDetails from '../../components/bookings/BookingDetails'
import { useApp } from '../../app/AppContext'
import { formatDate, priceLabel, TODAY } from '../../utils/format'
import { allowedNext, canReschedule, isUpcoming } from '../../utils/bookings'
import { servicePrice } from '../../utils/filters'

const TABS = [
  { id: 'all', label: 'All bookings', match: () => true },
  { id: 'upcoming', label: 'Upcoming', match: (booking) => isUpcoming(booking, TODAY) },
  { id: 'pending', label: 'Pending', match: (booking) => booking.status === 'pending' },
  { id: 'completed', label: 'Completed', match: (booking) => booking.status === 'completed' },
  { id: 'cancelled', label: 'Cancelled', match: (booking) => booking.status === 'cancelled' || booking.status === 'rejected' },
]

export default function CustomerBookings() {
  const { user, bookings, serviceOf, providerOf, changeBookingStatus, rescheduleBooking } = useApp()
  const [tab, setTab] = useState('upcoming')
  const [query, setQuery] = useState('')
  const [view, setView] = useState(null)
  const [cancel, setCancel] = useState(null)
  const [resched, setResched] = useState(null)
  const [date, setDate] = useState('')
  const [err, setErr] = useState('')
  const mine = bookings.filter((booking) => booking.customerId === user.id)
  const selectedTab = TABS.find((item) => item.id === tab)

  const list = useMemo(() => {
    const search = query.trim().toLowerCase()
    return mine.filter((booking) => {
      if (!selectedTab.match(booking)) return false
      if (!search) return true
      const service = serviceOf(booking.serviceId)
      const provider = providerOf(booking.providerId)
      return [booking.id, service?.title, provider?.name, booking.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    }).sort((a, b) => {
      if (tab === 'upcoming') return a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
      return (b.created ?? b.date).localeCompare(a.created ?? a.date)
    })
  }, [mine, providerOf, query, selectedTab, serviceOf, tab])

  const doResched = () => {
    if (!date || date <= TODAY) {
      setErr('Choose a date after today.')
      return
    }
    rescheduleBooking(resched.id, date, resched.time)
    setResched(null)
    setDate('')
    setErr('')
  }
  const closeReschedule = () => {
    setResched(null)
    setDate('')
    setErr('')
  }

  return (
    <>
      <PageHeader title="My bookings" text="Review your service requests and manage upcoming appointments." />
      <Tabs
        label="Booking status"
        value={tab}
        onChange={setTab}
        tabs={TABS.map((item) => ({ ...item, count: mine.filter(item.match).length }))}
      />

      <div className="mt-5 max-w-xl">
        <Field
          label="Search bookings"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search service, provider, reference, or status"
          hint="Search within the selected status."
        />
      </div>

      <div className="mt-5">
        {list.length === 0 ? (
          query || mine.some(selectedTab.match) ? (
            <EmptyState
              icon={Search}
              title="No matching bookings"
              text="Try another search term or clear your search to see bookings in this status."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <EmptyState
              icon={CalendarX}
              title={tab === 'all' ? 'No bookings yet' : `No ${selectedTab.label.toLowerCase()}`}
              text="Your booking requests are demo data stored in this browser. Browse a service to make a new request."
              actionLabel="Browse services"
              actionTo="/services"
            />
          )
        ) : (
          <ul className="space-y-3">
            {list.map((booking) => {
              const service = booking.isRemote ? booking.service : serviceOf(booking.serviceId)
              const provider = booking.isRemote ? { ...booking.provider, name: booking.provider?.user?.name } : providerOf(booking.providerId)
              const priceService = service ? { ...service, unit: service.unit ?? service.priceUnit } : null
              const hasPrice = servicePrice(priceService) !== null
              return (
                <li key={booking.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="min-w-0 text-base font-semibold">
                          {service
                            ? <Button to={`/services/${service.id}`} variant="ghost" className="min-h-0 px-0 py-0 text-left font-semibold">{service.title}</Button>
                            : 'Service details unavailable'}
                        </h2>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        {provider
                          ? <Button to={`/providers/${provider.id}`} variant="ghost" className="min-h-0 px-0 py-0 text-sm font-normal">{provider.name}</Button>
                          : 'Provider details unavailable'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" />{formatDate(booking.date)} at {booking.time}</span>
                        <span>Ref {booking.id}</span>
                        {hasPrice && <span className="font-medium text-ink-soft">{priceLabel(priceService)}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <Button size="sm" variant="secondary" onClick={() => setView(booking)}>View details</Button>
                      {!booking.isRemote && canReschedule(booking, TODAY) && <Button size="sm" variant="secondary" onClick={() => { setResched(booking); setDate(booking.date) }}>Reschedule</Button>}
                      {!booking.isRemote && allowedNext(booking.status, 'customer').includes('cancelled') && (
                        <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setCancel(booking)}>Cancel</Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <BookingDetails booking={view} onClose={() => setView(null)} />
      <ConfirmDialog
        open={!!cancel}
        onClose={() => setCancel(null)}
        danger
        title="Cancel this booking?"
        confirmLabel="Cancel booking"
        message={`Cancel ${serviceOf(cancel?.serviceId)?.title ?? 'this booking'}? This changes its status in your local demo data. You can send a new request any time.`}
        onConfirm={() => cancel && changeBookingStatus(cancel.id, 'cancelled', 'customer')}
      />
      <Modal
        open={!!resched}
        onClose={closeReschedule}
        title="Reschedule booking"
        footer={<><Button variant="secondary" onClick={closeReschedule}>Keep current time</Button><Button onClick={doResched}>Request new date</Button></>}
      >
        <p className="mb-3 text-sm text-ink-soft">The updated request will return to pending in this browser’s demo data.</p>
        <Field label="New date" type="date" min={TODAY} value={date} onChange={(event) => setDate(event.target.value)} error={err} />
      </Modal>
    </>
  )
}
