import { Router } from 'express'
import { createBooking, getBookings } from '../controllers/bookings.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCsrf } from '../middleware/requireCsrf.js'

export function bookingsRoutes({ prisma, config }) {
  const router = Router()
  router.use(requireAuth({ prisma, config }))
  router.get('/', getBookings(prisma))
  router.post('/', requireCsrf(config), createBooking(prisma))
  return router
}
