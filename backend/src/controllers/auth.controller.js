import { AppError } from '../utils/errors.js'
import { createCsrfToken, createSessionToken, hashPassword, publicUserSelect, setCsrfCookie, setSessionCookie, sessionCookieOptions, toPublicUser, verifyPassword } from '../services/auth.service.js'
import { loginSchema, registerSchema } from '../validators/auth.js'

export function register(prisma, config) {
  return async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return next(new AppError(400, 'INVALID_BODY', 'Name, email, password, and role are invalid.'))
    const { name, email, password, role } = parsed.data
    try {
      const data = { name, email, passwordHash: await hashPassword(password), role, status: role === 'PROVIDER' ? 'PENDING' : 'ACTIVE' }
      if (role === 'PROVIDER') {
        data.providerProfile = {
          create: {
            profession: 'Service Provider',
            category: 'general',
            area: 'Not provided',
            years: 0,
            bio: '',
            skills: [],
            verified: false,
          },
        }
      }
      const user = await prisma.user.create({
        data,
        select: publicUserSelect,
      })
      if (user.status !== 'ACTIVE') return res.status(201).json({ data: { user: toPublicUser(user), authenticated: false } })
      setSessionCookie(res, createSessionToken(user.id, config.authSessionSecret), config.isProduction)
      return res.status(201).json({ data: { user: toPublicUser(user), authenticated: true } })
    } catch (error) {
      if (error?.code === 'P2002') return next(new AppError(409, 'ACCOUNT_EXISTS', 'An account with that email already exists.'))
      return next(error)
    }
  }
}

export function login(prisma, config) {
  return async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return next(new AppError(400, 'INVALID_BODY', 'Email or password is invalid.'))
    try {
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { ...publicUserSelect, passwordHash: true } })
      if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return next(new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.'))
      if (user.status !== 'ACTIVE') return next(new AppError(403, 'ACCOUNT_INACTIVE', 'This account is not active.'))
      const { passwordHash: _passwordHash, ...safeUser } = user
      setSessionCookie(res, createSessionToken(user.id, config.authSessionSecret), config.isProduction)
      return res.json({ data: { user: safeUser, authenticated: true } })
    } catch (error) {
      return next(error)
    }
  }
}

export function me() {
  return (req, res) => res.json({ data: { user: req.auth.user } })
}

export function logout(config) {
  return (req, res) => res.set('Set-Cookie', sessionCookieOptions(config.isProduction)).json({ data: { authenticated: false } })
}

export function csrf(config) {
  return (req, res) => {
    const token = createCsrfToken(config.authSessionSecret)
    setCsrfCookie(res, token, config.isProduction)
    return res.json({ data: { token } })
  }
}
