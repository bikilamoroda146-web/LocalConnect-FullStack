import { AppError } from '../utils/errors.js'
import { CSRF_COOKIE, readCookie, verifyCsrfToken } from '../services/auth.service.js'

export function requireCsrf(config) {
  return (req, res, next) => {
    const cookieToken = readCookie(req, CSRF_COOKIE)
    const headerToken = req.get('x-csrf-token')
    if (!cookieToken || !headerToken || cookieToken !== headerToken || !verifyCsrfToken(headerToken, config.authSessionSecret)) {
      return next(new AppError(403, 'CSRF_INVALID', 'The security token is missing or invalid.'))
    }
    return next()
  }
}
