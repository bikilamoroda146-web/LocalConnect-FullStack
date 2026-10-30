import { Router } from 'express'
import { healthRoutes } from './health.routes.js'
import { servicesRoutes } from './services.routes.js'
import { authRoutes } from './auth.routes.js'
import { bookingsRoutes } from './bookings.routes.js'
import { adminRoutes } from './admin.routes.js'

// Every API route is mounted here. New resources (auth, services, bookings...) are added in later milestones.
export function apiRoutes(deps) {
  const router = Router()
  router.use('/health', healthRoutes(deps))
  router.use('/services', servicesRoutes(deps))
  router.use('/auth', authRoutes(deps))
  router.use('/bookings', bookingsRoutes(deps))
  router.use('/admin', adminRoutes(deps))
  return router
}
