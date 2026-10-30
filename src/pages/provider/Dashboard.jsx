import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Clock, Inbox, Plus, Briefcase, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import { Badge, StatusBadge } from '../../components/common/Badges'
import { EmptyState } from '../../components/common/States'
import { useApp } from '../../app/AppContext'
import { formatDate, TODAY } from '../../utils/format'

export default function ProviderDashboard() {
  const { user, bookings, services, serviceOf, userOf } = useApp()
  const providerId = user.providerId
  const mine = bookings.filter((booking) => booking.providerId === providerId)
  const pending = mine.filter((booking) => booking.status === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const upcoming = mine.filter((booking) => booking.status === 'confirmed' && booking.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const own = services.filter((service) => service.providerId === providerId)
  const published = own.filter((service) => service.published).length
  const recentBookings = [...mine]
    .sort((a, b) => (b.updated ?? b.created ?? b.date).localeCompare(a.updated ?? a.created ?? a.date))
    .slice(0, 5)
  const serviceActivity = [...own]
    .sort((a, b) => (b.updated ?? b.created ?? '').localeCompare(a.updated ?? a.created ?? ''))
    .slice(0, 4)

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        text="Your requests, appointments, and service listings at a glance."
        action={<Button to="/provider/services"><Plus size={16} aria-hidden="true" /> Add a service</Button>}
      />

      <section aria-label="Provider overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Total bookings" value={mine.length} note="Requests for your services" />
        <StatCard icon={Inbox} label="Pending requests" value={pending.length} note={pending.length ? 'Waiting for your reply' : 'All caught up'} />
        <StatCard icon={Clock} label="Upcoming appointments" value={upcoming.length} note="Confirmed appointments" />
        <StatCard icon={Briefcase} label="Published services" value={published} note={`${own.length} total services`} />
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section aria-labelledby="requests-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-800">Needs your attention</p>
              <h2 id="requests-heading" className="mt-1 text-lg font-semibold">Recent booking requests</h2>
            </div>
            <Link to="/provider/bookings" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-800 hover:underline">
              Manage bookings <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending requests" text="New customer requests for your services will appear here." actionLabel="View all bookings" actionTo="/provider/bookings" />
          ) : (
            <ul className="space-y-3">
              {pending.slice(0, 4).map((booking) => (
                <li key={booking.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{serviceOf(booking.serviceId)?.title ?? 'Service details unavailable'}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {userOf(booking.customerId)?.name ?? 'Customer'} · {formatDate(booking.date)} at {booking.time}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">Ref {booking.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={booking.status} />
                    <Button size="sm" variant="secondary" to="/provider/bookings">Review</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {upcoming.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Upcoming appointments</h2>
                <Link to="/provider/bookings" className="text-sm font-semibold text-brand-800 hover:underline">All bookings</Link>
              </div>
              <ul className="card divide-y divide-line">
                {upcoming.slice(0, 3).map((booking) => (
                  <li key={booking.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{serviceOf(booking.serviceId)?.title ?? 'Service details unavailable'}</p>
                    <p className="text-sm text-ink-soft">{formatDate(booking.date)} at {booking.time} · {userOf(booking.customerId)?.name ?? 'Customer'}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="mb-3 text-lg font-semibold">Manage your business</h2>
          <div className="card grid gap-2 p-4">
            <Button to="/provider/services"><Briefcase size={16} aria-hidden="true" /> Manage services</Button>
            <Button to="/provider/bookings" variant="secondary"><Inbox size={16} aria-hidden="true" /> Review bookings</Button>
            <Button to="/provider/availability" variant="secondary"><Clock size={16} aria-hidden="true" /> Set availability</Button>
            <Button to="/provider/portfolio" variant="secondary">Manage portfolio</Button>
            <Button to="/provider/profile" variant="secondary">Edit profile</Button>
          </div>
        </section>

        <section aria-labelledby="service-activity-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-800">Listing status</p>
              <h2 id="service-activity-heading" className="mt-1 text-lg font-semibold">Service activity</h2>
            </div>
            <Link to="/provider/services" className="text-sm font-semibold text-brand-800 hover:underline">Manage services</Link>
          </div>
          {serviceActivity.length === 0 ? (
            <EmptyState icon={Briefcase} title="No services yet" text="Create a service listing to let customers know what you offer." actionLabel="Add a service" actionTo="/provider/services" />
          ) : (
            <ul className="card divide-y divide-line">
              {serviceActivity.map((service) => (
                <li key={service.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{service.title}</p>
                    <p className="text-xs text-ink-muted">
                      {service.updated || service.created ? `Updated ${formatDate(service.updated ?? service.created)}` : 'Service listing'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={service.published ? 'green' : 'slate'}>{service.published ? <><Eye size={13} aria-hidden="true" /> Published</> : <><EyeOff size={13} aria-hidden="true" /> Unpublished</>}</Badge>
                    <Button size="sm" variant="ghost" to="/provider/services">Edit</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-activity-heading">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-800">Booking history</p>
              <h2 id="recent-activity-heading" className="mt-1 text-lg font-semibold">Recent activity</h2>
            </div>
            <Link to="/provider/bookings" className="text-sm font-semibold text-brand-800 hover:underline">View all</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="card p-4 text-sm text-ink-soft">Booking requests for your services will appear here. Demo data is stored in this browser.</p>
          ) : (
            <ul className="card divide-y divide-line">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{serviceOf(booking.serviceId)?.title ?? 'Service details unavailable'}</p>
                    <p className="text-sm text-ink-muted">
                      {booking.updated && booking.updated !== booking.created
                        ? `Updated ${formatDate(booking.updated)}`
                        : booking.created ? `Requested ${formatDate(booking.created)}` : `Appointment ${formatDate(booking.date)}`} · Ref {booking.id}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
