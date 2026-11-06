import { AppError } from '../utils/errors.js'
import { decideProvider, listPendingProviders, listAdminUsers, updateAdminUserStatus } from '../services/admin.service.js'

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


export function getAdminUsers(prisma) {
  return async (req, res, next) => {
    try {
      return res.json({ data: await listAdminUsers(prisma) })
    } catch (error) {
      return next(error)
    }
  }
}

export function changeAdminUserStatus(prisma) {
  return async (req, res, next) => {
    try {
      const result = await updateAdminUserStatus(prisma, req.params.userId, req.body?.status)
      if (result.error === 'INVALID_STATUS') {
        return next(new AppError(400, 'INVALID_USER_STATUS', 'Status must be ACTIVE or SUSPENDED.'))
      }
      if (result.error === 'USER_NOT_FOUND') {
        return next(new AppError(404, 'USER_NOT_FOUND', 'The user could not be found.'))
      }
      if (result.error === 'CANNOT_CHANGE_ADMIN') {
        return next(new AppError(403, 'CANNOT_CHANGE_ADMIN', 'Administrator accounts cannot be suspended here.'))
      }
      return res.json({ data: result.user })
    } catch (error) {
      return next(error)
    }
  }
}
