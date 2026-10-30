import { AppError } from '../utils/errors.js'
import { publicUserSelect, readCookie, SESSION_COOKIE, verifySessionToken, toPublicUser } from '../services/auth.service.js'

export function requireAuth({ prisma, config }) {
  return async (req, res, next) => {
    const token = readCookie(req, SESSION_COOKIE)
    const session = token && verifySessionToken(token, config.authSessionSecret)
    if (!session) return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.'))
    try {
      const user = await prisma.user.findUnique({ where: { id: session.sub }, select: publicUserSelect })
      if (!user || user.status !== 'ACTIVE') return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.'))
      req.auth = { user: toPublicUser(user) }
      return next()
    } catch (error) {
      return next(error)
    }
  }
}
