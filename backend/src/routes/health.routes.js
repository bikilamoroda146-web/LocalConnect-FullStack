import { Router } from 'express'
import { getHealth } from '../controllers/health.controller.js'

export function healthRoutes({ prisma }) {
  const router = Router()
  router.get('/', getHealth(prisma))
  return router
}
