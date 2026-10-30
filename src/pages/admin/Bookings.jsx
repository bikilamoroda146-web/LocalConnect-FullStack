import { useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Pagination from '../../components/common/Pagination'
import Button from '../../components/common/Button'
import { StatusBadge } from '../../components/common/Badges'
import BookingDetails from '../../components/bookings/BookingDetails'
import { useApp } from '../../app/AppContext'
import { STATUS } from '../../utils/bookings'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 8

export default function AdminBookings() {
  const { bookings, serviceOf, userOf, providerOf } = useApp()
  const [status, setStatus] = useState(''), [q, setQ] = useState(''), [page, setPage] = useState(1)
  const [view, setView] = useState(null)
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return bookings.filter((booking) => {
      if (status && booking.status !== status) return false
      if (!query) return true
      return [
        booking.id,
        booking.status,
        serviceOf(booking.serviceId)?.title,
        userOf(booking.customerId)?.name,
        providerOf(booking.providerId)?.name,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    }).sort((a, b) => (b.updated ?? b.created ?? b.date).localeCompare(a.updated ?? a.created ?? a.date))
  }, [bookings, providerOf, q, serviceOf, status, userOf])
  const pages = Math.ceil(rows.length / PAGE_SIZE)
  return (
    <>
      <PageHeader title="Bookings" text={`${rows.length} matching booking records from sample data.`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="bq">Search bookings</label><input id="bq" className="input sm:max-w-xs" placeholder="Search reference, service, person" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <label className="sr-only" htmlFor="bs">Status</label><select id="bs" className="input sm:!w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div>
      <DataTable empty="No bookings match these filters." rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} columns={[
        { key: 'id', header: 'Reference', render: (b) => <span className="font-medium">{b.id}</span> }, { key: 's', header: 'Service', render: (b) => serviceOf(b.serviceId)?.title },
        { key: 'c', header: 'Customer', render: (b) => userOf(b.customerId)?.name }, { key: 'p', header: 'Provider', render: (b) => providerOf(b.providerId)?.name },
        { key: 'd', header: 'Appointment', render: (b) => `${formatDate(b.date)} at ${b.time}` }, { key: 'st', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
        { key: 'a', header: 'Details', render: (b) => <Button size="sm" variant="secondary" onClick={() => setView(b)}>View details</Button> }]} />
      <Pagination page={page} pages={pages} onChange={setPage} />
      <BookingDetails booking={view} onClose={() => setView(null)} />
    </>
  )
}
