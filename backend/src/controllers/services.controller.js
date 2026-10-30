import { parseServicesQuery } from '../validators/services.query.js'
import { createService as insertService, getServiceById as findServiceById, listServices } from '../services/services.service.js'
import { AppError } from '../utils/errors.js'
import { createServiceSchema } from '../validators/services.js'

export function createService(prisma) {
  return async (req, res, next) => {
    if (req.auth.user.role !== 'PROVIDER') return next(new AppError(403, 'FORBIDDEN', 'Only provider accounts can create services.'))
    if (!req.auth.user.providerProfile?.id) return next(new AppError(403, 'PROVIDER_PROFILE_REQUIRED', 'A provider profile is required before creating services.'))
    const parsed = createServiceSchema.safeParse(req.body)
    if (!parsed.success) return next(new AppError(400, 'INVALID_BODY', 'Service details are invalid.'))
    try {
      const service = await insertService(prisma, req.auth.user.providerProfile.id, parsed.data)
      return res.status(201).json({ data: { service } })
    } catch (error) { return next(error) }
  }
}

export function getServices(prisma) {
  return async (req, res, next) => {
    const parsed = parseServicesQuery(req.query)
    if (!parsed.success) {
      return next(new AppError(400, 'INVALID_QUERY', 'One or more query parameters are invalid.'))
    }
    try {
      const result = await listServices(prisma, parsed.data)
      res.set('Cache-Control', 'public, max-age=60')
      return res.json(result)
    } catch (error) {
      return next(error)
    }
  }
}

export function getServiceById(prisma) {
  return async (req, res, next) => {
    try {
      const service = await findServiceById(prisma, req.params.id)
      if (!service) {
        return next(new AppError(404, 'NOT_FOUND', 'The requested service was not found.'))
      }
      return res.json({ data: service })
    } catch (error) {
      return next(error)
    }
  }
}
