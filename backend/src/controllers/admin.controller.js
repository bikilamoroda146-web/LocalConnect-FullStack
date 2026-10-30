import { AppError } from '../utils/errors.js'
import { decideProvider, listPendingProviders } from '../services/admin.service.js'

export function getPendingProviders(prisma) {
  return async (req, res, next) => {
    try { return res.json({ data: await listPendingProviders(prisma) }) } catch (error) { return next(error) }
  }
}

export function decidePendingProvider(prisma, decision) {
  return async (req, res, next) => {
    try {
      const result = await decideProvider(prisma, req.params.providerId, decision)
      if (result.error === 'NOT_PENDING') return next(new AppError(404, 'PROVIDER_NOT_PENDING', 'The provider is not awaiting review.'))
      return res.json({ data: result.provider })
    } catch (error) { return next(error) }
  }
}
