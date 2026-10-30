import { Router } from 'express'
import { csrf, login, logout, me, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCsrf } from '../middleware/requireCsrf.js'

export function authRoutes({ prisma, config }) {
  const router = Router()
  router.post('/register', register(prisma, config))
  router.post('/login', login(prisma, config))
  router.get('/me', requireAuth({ prisma, config }), me())
  router.post('/logout', requireCsrf(config), logout(config))
  router.get('/csrf', csrf(config))
  return router
}
