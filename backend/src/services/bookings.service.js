import { APP_TIME_ZONE } from '../config/constants.js'

export const bookingSelect = {
  id: true,
  serviceId: true,
  providerId: true,
  customerId: true,
  date: true,
  time: true,
  note: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  service: { select: { id: true, title: true, category: true, area: true, price: true, priceUnit: true } },
  provider: { select: { id: true, profession: true, area: true, user: { select: { id: true, name: true } } } },
  customer: { select: { id: true, name: true } },
}

function localDateInAppZone(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function toDatabaseDate(date) {
  return new Date(`${date}T00:00:00.000Z`)
}

function toDatabaseTime(time) {
  return new Date(`1970-01-01T${time}:00.000Z`)
}

export async function createBooking(prisma, customerId, input) {
  const requestedDate = new Date(`${input.date}T00:00:00.000Z`)
  if (Number.isNaN(requestedDate.getTime()) || requestedDate.toISOString().slice(0, 10) !== input.date || input.date <= localDateInAppZone()) {
    return { error: 'DATE_NOT_AVAILABLE' }
  }
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, published: true, provider: { user: { status: 'ACTIVE' } } },
    select: { id: true, providerId: true },
  })
  if (!service) return { error: 'SERVICE_UNAVAILABLE' }

  const booking = await prisma.booking.create({
    data: {
      serviceId: service.id,
      providerId: service.providerId,
      customerId,
      date: toDatabaseDate(input.date),
      time: toDatabaseTime(input.time),
      note: input.note || null,
      status: 'PENDING',
    },
    select: bookingSelect,
  })
  return { booking }
}

export async function listBookings(prisma, user) {
  const where = user.role === 'CUSTOMER'
    ? { customerId: user.id }
    : user.role === 'PROVIDER' && user.providerProfile
      ? { providerId: user.providerProfile.id }
      : user.role === 'ADMIN'
        ? {}
        : null
  if (!where) return []
  return prisma.booking.findMany({ where, orderBy: [{ date: 'asc' }, { time: 'asc' }], select: bookingSelect })
}
