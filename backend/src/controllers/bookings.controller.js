import { AppError } from '../utils/errors.js'
import { createBooking as insertBooking, listBookings } from '../services/bookings.service.js'
import { createBookingSchema } from '../validators/bookings.js'

export function createBooking(prisma) {
  return async (req, res, next) => {
    if (req.auth.user.role !== 'CUSTOMER') return next(new AppError(403, 'FORBIDDEN', 'Only active customer accounts can request bookings.'))
    const parsed = createBookingSchema.safeParse(req.body)
    if (!parsed.success) return next(new AppError(400, 'INVALID_BODY', 'Service, date, time, or note is invalid.'))
    try {
      const result = await insertBooking(prisma, req.auth.user.id, parsed.data)
      if (result.error === 'DATE_NOT_AVAILABLE') return next(new AppError(400, 'INVALID_DATE', 'Choose a date after today.'))
      if (result.error === 'SERVICE_UNAVAILABLE') return next(new AppError(404, 'SERVICE_UNAVAILABLE', 'The requested service is not available for booking.'))
      return res.status(201).json({ data: { booking: result.booking } })
    } catch (error) { return next(error) }
  }
}

export function getBookings(prisma) {
  return async (req, res, next) => {
    try {
      const bookings = await listBookings(prisma, req.auth.user)
      return res.json({ data: bookings })
    } catch (error) { return next(error) }
  }
}
