import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, CheckCircle2, Clock, Heart, Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import { StatusBadge } from '../../components/common/Badges'
import { EmptyState } from '../../components/common/States'
import { useApp } from '../../app/AppContext'
import { formatDate, TODAY } from '../../utils/format'
import { isUpcoming } from '../../utils/bookings'

export default function CustomerDashboard() {
  const { user, bookings, serviceOf, providerOf, favorites, recent } = useApp()
  const mine = bookings.filter((booking) => booking.customerId === user.id)
  const upcoming = mine.filter((booking) => isUpcoming(booking, TODAY)).sort((a, b) => a.date.localeCompare(b.date))
  const recentBookings = [...mine].sort((a, b) => (b.updated ?? b.created ?? b.date).localeCompare(a.updated ?? a.created ?? a.date)).slice(0, 5)
  const count = (status) => mine.filter((booking) => booking.status === status).length
  const savedCount = favorites.filter((key) => key.startsWith('p') ? providerOf(key) : serviceOf(key)).length
  const recentItems = recent.map((key) => (key.startsWith('p')
    ? { key, label: providerOf(key)?.name, to: `/providers/${key}`, kind: 'Provider' }
    : { key, label: serviceOf(key)?.title, to: `/services/${key}`, kind: 'Service' }))
    .filter((item) => item.label)
    .slice(0, 4)

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}`}
        text="A quick look at your bookings and saved services."
        action={<Button to="/services"><Search size={16} aria-hidden="true" /> Find a service</Button>}
      />

      <section aria-label="Account overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="All bookings" value={mine.length} note="Your service requests" />
        <StatCard icon={Clock} label="Upcoming" value={upcoming.length} note="Confirmed appointments" />
        <StatCard icon={CheckCircle2} label="Pending" value={count('pending')} note="Awaiting provider response" />
        <StatCard icon={Heart} label="Favorites" value={savedCount} note="Saved providers and services" />
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section aria-labelledby="upcoming-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-800">Your schedule</p>
              <h2 id="upcoming-heading" className="mt-1 text-lg font-semibold">Upcoming bookings</h2>
            </div>
            <Link to="/customer/bookings" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-800 hover:underline">
              View all bookings <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No upcoming bookings" text="Confirmed appointments will appear here. Browse services when you’re ready to make a request." actionLabel="Browse services" actionTo="/services" />
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 4).map((booking) => {
                const service = serviceOf(booking.serviceId)
                const provider = providerOf(booking.providerId)
                return (
                  <li key={booking.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0">
                      <Link to={`/services/${booking.serviceId}`} className="font-semibold hover:text-brand-800 hover:underline">
                        {service?.title ?? 'Service details unavailable'}
                      </Link>
                      <p className="mt-1 text-sm text-ink-soft">
                        {provider?.name ?? 'Provider details unavailable'} · {formatDate(booking.date)} at {booking.time}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="mb-3 text-lg font-semibold">Quick actions</h2>
          <div className="card grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1">
            <Button to="/services">Browse services</Button>
            <Button to="/customer/bookings" variant="secondary">Manage bookings</Button>
            <Button to="/customer/favorites" variant="secondary">View saved favorites</Button>
            <Button to="/customer/profile" variant="secondary">Edit profile</Button>
          </div>
        </section>

        <section aria-labelledby="activity-heading">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-800">Your requests</p>
              <h2 id="activity-heading" className="mt-1 text-lg font-semibold">Recent booking activity</h2>
            </div>
            <Link to="/customer/bookings" className="text-sm font-semibold text-brand-800 hover:underline">History</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="card p-5 text-sm text-ink-soft">
              Your booking requests will appear here. They are sample/demo records stored in this browser.
            </div>
          ) : (
            <ul className="card divide-y divide-line">
              {recentBookings.map((booking) => {
                const service = serviceOf(booking.serviceId)
                return (
                  <li key={booking.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link to="/customer/bookings" className="font-medium hover:text-brand-800 hover:underline">
                        {service?.title ?? 'Service details unavailable'}
                      </Link>
                      <p className="text-sm text-ink-muted">
                        {booking.updated && booking.updated !== booking.created
                          ? `Updated ${formatDate(booking.updated)}`
                          : booking.created ? `Requested ${formatDate(booking.created)}` : `Appointment ${formatDate(booking.date)}`} · Ref {booking.id}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="recently-viewed-heading">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-800">Pick up where you left off</p>
              <h2 id="recently-viewed-heading" className="mt-1 text-lg font-semibold">Recently viewed</h2>
            </div>
            <Link to="/customer/favorites" className="text-sm font-semibold text-brand-800 hover:underline">Favorites</Link>
          </div>
          {recentItems.length === 0 ? (
            <p className="card p-4 text-sm text-ink-soft">Services and providers you open will appear here.</p>
          ) : (
            <ul className="card divide-y divide-line">
              {recentItems.map((item) => (
                <li key={item.key}>
                  <Link className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50" to={item.to}>
                    <span className="min-w-0 truncate font-medium">{item.label}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{item.kind}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
