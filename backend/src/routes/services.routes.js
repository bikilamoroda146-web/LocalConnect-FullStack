import { Router } from 'express'
import { createService, getServiceById, getServices } from '../controllers/services.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCsrf } from '../middleware/requireCsrf.js'

export function servicesRoutes({ prisma, config }) {
  const router = Router()
  router.get('/', getServices(prisma))
  router.get('/:id', getServiceById(prisma))
  router.post('/', requireAuth({ prisma, config }), requireCsrf(config), createService(prisma))
  return router
}
