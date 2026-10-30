import Modal from '../common/Modal'
import Button from '../common/Button'
import { StatusBadge } from '../common/Badges'
import { formatDate, priceLabel } from '../../utils/format'
import { servicePrice } from '../../utils/filters'
import { useApp } from '../../app/AppContext'

export default function BookingDetails({ booking, onClose }) {
  const { serviceOf, providerOf, userOf } = useApp()
  if (!booking) return null
  const s = booking.isRemote ? booking.service : serviceOf(booking.serviceId)
  const p = booking.isRemote ? { ...booking.provider, name: booking.provider?.user?.name } : providerOf(booking.providerId)
  const c = booking.isRemote ? booking.customer : userOf(booking.customerId)
  const priceService = s ? { ...s, unit: s.unit ?? s.priceUnit } : null
  const hasPrice = servicePrice(priceService) !== null
  const rows = [
    ['Reference', booking.id],
    ['Service', s?.title],
    ['Provider', p?.name],
    ['Customer', c?.name],
    ['Requested appointment', `${formatDate(booking.date)} at ${booking.time}`],
    ['Price estimate', s ? (hasPrice ? priceLabel(priceService) : 'To be agreed with the provider') : null],
    ['Request created', booking.createdAt ? formatDate(booking.createdAt.slice(0, 10)) : booking.created ? formatDate(booking.created) : null],
    ['Last updated', booking.updatedAt ? formatDate(booking.updatedAt.slice(0, 10)) : booking.updated && booking.updated !== booking.created ? formatDate(booking.updated) : null],
  ]
  return (
    <Modal open onClose={onClose} title="Booking details" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={booking.status} />
        <span className="text-xs text-ink-muted">{booking.isRemote ? 'Booking request saved to LocalConnect' : 'Demo booking stored in this browser'}</span>
      </div>
      <dl className="divide-y divide-line text-sm">
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="font-medium sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
      {booking.note && <div className="mt-4 rounded-control bg-slate-50 p-3 text-sm"><p className="font-medium">Booking note</p><p className="mt-1 whitespace-pre-line text-ink-soft">{booking.note}</p></div>}
      {(s || p) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {s && <Button to={`/services/${s.id}`} variant="secondary" size="sm">View service</Button>}
          {p && !booking.isRemote && <Button to={`/providers/${p.id}`} variant="secondary" size="sm">View provider</Button>}
        </div>
      )}
    </Modal>
  )
}
