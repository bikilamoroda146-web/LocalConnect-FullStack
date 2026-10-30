import { Router } from 'express'
import { decidePendingProvider, getPendingProviders } from '../controllers/admin.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireCsrf } from '../middleware/requireCsrf.js'

export function adminRoutes({ prisma, config }) {
  const router = Router()
  router.use(requireAuth({ prisma, config }), requireAdmin)
  router.get('/providers/pending', getPendingProviders(prisma))
  router.post('/providers/:providerId/approve', requireCsrf(config), decidePendingProvider(prisma, 'approve'))
  router.post('/providers/:providerId/reject', requireCsrf(config), decidePendingProvider(prisma, 'reject'))
  return router
}
