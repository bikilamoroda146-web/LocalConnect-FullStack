import { promisify } from 'node:util'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto'

const scrypt = promisify(scryptCallback)
const SCRYPT_N = 16_384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  phone: true,
  area: true,
  avatarKey: true,
  providerProfile: {
    select: { id: true, profession: true, category: true, area: true, years: true, bio: true, skills: true, verified: true },
  },
}

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, saltText, hashText] = encoded.split('$')
    if (algorithm !== 'scrypt' || !n || !r || !p || !saltText || !hashText) return false
    const cost = Number(n)
    const blockSize = Number(r)
    const parallelism = Number(p)
    if (!Number.isInteger(cost) || cost < 1024 || cost > 1_048_576 || (cost & (cost - 1)) !== 0 || !Number.isInteger(blockSize) || blockSize < 1 || blockSize > 32 || !Number.isInteger(parallelism) || parallelism < 1 || parallelism > 16) return false
    const salt = Buffer.from(saltText, 'base64url')
    const expected = Buffer.from(hashText, 'base64url')
    const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: cost, r: blockSize, p: parallelism }))
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function toPublicUser(user) {
  if (!user) return null
  const { passwordHash: _passwordHash, ...safeUser } = user
  return safeUser
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
}

export function createSessionToken(userId, secret, now = Date.now()) {
  const payload = encode({ sub: userId, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS })
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifySessionToken(token, secret, now = Date.now()) {
  try {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null
    const expected = createHmac('sha256', secret).update(payload).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
    const data = decode(payload)
    if (typeof data.sub !== 'string' || !Number.isInteger(data.exp) || data.exp <= Math.floor(now / 1000)) return null
    return data
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'localconnect_session'
export const CSRF_COOKIE = 'localconnect_csrf'
export const sessionCookieOptions = (isProduction) => [
  `${SESSION_COOKIE}=`,
  'Max-Age=0',
  'Path=/api',
  'HttpOnly',
  'SameSite=Lax',
  ...(isProduction ? ['Secure'] : []),
].join('; ')

export function setSessionCookie(res, token, isProduction) {
  const parts = [`${SESSION_COOKIE}=${token}`, `Max-Age=${SESSION_TTL_SECONDS}`, 'Path=/api', 'HttpOnly', 'SameSite=Lax']
  if (isProduction) parts.push('Secure')
  res.set('Set-Cookie', parts.join('; '))
}

export function createCsrfToken(secret, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000)
  const payload = encode({ nonce: randomBytes(24).toString('base64url'), iat: issuedAt, exp: issuedAt + 7200 })
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyCsrfToken(token, secret) {
  try {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return false
    const expected = createHmac('sha256', secret).update(payload).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
    const data = decode(payload)
    const now = Math.floor(Date.now() / 1000)
    return typeof data.nonce === 'string' && data.nonce.length > 0 && Number.isInteger(data.iat) && Number.isInteger(data.exp) && data.iat <= now + 60 && data.exp > now && data.exp - data.iat <= 7200
  } catch {
    return false
  }
}

export function setCsrfCookie(res, token, isProduction) {
  const parts = [`${CSRF_COOKIE}=${token}`, 'Max-Age=7200', 'Path=/api', 'SameSite=Lax']
  if (isProduction) parts.push('Secure')
  res.set('Set-Cookie', parts.join('; '))
}

export function readCookie(req, name) {
  const header = req.get('cookie') || ''
  const item = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))
  return item ? item.slice(name.length + 1) : null
}
