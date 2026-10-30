import { AppError } from '../utils/errors.js'

export function requireAdmin(req, res, next) {
  if (req.auth?.user?.role !== 'ADMIN') return next(new AppError(403, 'FORBIDDEN', 'Administrator access is required.'))
  return next()
}
