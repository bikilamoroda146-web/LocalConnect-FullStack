import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { createSessionToken, hashPassword } from '../../src/services/auth.service.js'
import { testConfig } from '../helpers/testConfig.js'

const config = testConfig()
const safeUser = ({ id = 'user-1', status = 'ACTIVE', role = 'CUSTOMER' } = {}) => ({
  id, name: 'Liya Tesfaye', email: 'liya@example.test', role, status, phone: null, area: 'Waliso', avatarKey: null, providerProfile: null,
})

describe('authentication', () => {
  it('registers an active customer, hashes the password, and sets an HttpOnly cookie', async () => {
    let received
    const prisma = { user: { create: async (args) => { received = args; return safeUser() } } }
    const res = await request(createApp({ config, prisma })).post('/api/v1/auth/register').send({ name: 'Liya Tesfaye', email: 'liya@example.test', password: 'correct horse battery staple', role: 'CUSTOMER' })
    expect(res.status).toBe(201)
    expect(received.data.passwordHash).not.toContain('correct horse battery staple')
    expect(received.data.passwordHash.startsWith('scrypt$')).toBe(true)
    expect(res.body.data.user).toEqual(expect.objectContaining({ email: 'liya@example.test', role: 'CUSTOMER' }))
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly')
  })

  it('does not allow public registration to create an administrator', async () => {
    const prisma = { user: { create: async () => { throw new Error('must not be called') } } }
    const res = await request(createApp({ config, prisma })).post('/api/v1/auth/register').send({ name: 'Attacker', email: 'attacker@example.test', password: 'correct horse battery staple', role: 'ADMIN' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_BODY')
  })

  it('creates a provider profile for a pending provider registration', async () => {
    let received
    const prisma = { user: { create: async (args) => { received = args; return { ...safeUser({ role: 'PROVIDER', status: 'PENDING' }), providerProfile: { id: 'provider-1' } } } } }
    const res = await request(createApp({ config, prisma })).post('/api/v1/auth/register').send({ name: 'Pending Provider', email: 'provider@example.test', password: 'correct horse battery staple', role: 'PROVIDER' })
    expect(res.status).toBe(201)
    expect(received.data.providerProfile.create).toMatchObject({ profession: 'Service Provider', category: 'general', area: 'Not provided', years: 0, skills: [], verified: false })
  })

  it('rejects duplicate registration without exposing database details', async () => {
    const prisma = { user: { create: async () => { const error = new Error('duplicate'); error.code = 'P2002'; throw error } } }
    const res = await request(createApp({ config, prisma })).post('/api/v1/auth/register').send({ name: 'Another User', email: 'liya@example.test', password: 'correct horse battery staple' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: { code: 'ACCOUNT_EXISTS', message: 'An account with that email already exists.' } })
  })

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    const passwordHash = await hashPassword('correct horse battery staple')
    const prisma = { user: { findUnique: async () => ({ ...safeUser(), passwordHash }) } }
    const app = createApp({ config, prisma })
    const valid = await request(app).post('/api/v1/auth/login').send({ email: 'liya@example.test', password: 'correct horse battery staple' })
    expect(valid.status).toBe(200)
    expect(valid.headers['set-cookie'][0]).toContain('HttpOnly')
    expect(JSON.stringify(valid.body)).not.toContain('passwordHash')
    const invalid = await request(app).post('/api/v1/auth/login').send({ email: 'liya@example.test', password: 'wrong password' })
    expect(invalid.status).toBe(401)
    expect(invalid.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('rejects inactive accounts', async () => {
    const passwordHash = await hashPassword('correct horse battery staple')
    const prisma = { user: { findUnique: async () => ({ ...safeUser({ status: 'SUSPENDED' }), passwordHash }) } }
    const res = await request(createApp({ config, prisma })).post('/api/v1/auth/login').send({ email: 'liya@example.test', password: 'correct horse battery staple' })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE')
  })

  it('requires a valid cookie for /me and reloads the user from the database', async () => {
    const token = createSessionToken('user-1', config.authSessionSecret)
    const prisma = { user: { findUnique: async () => safeUser() } }
    const app = createApp({ config, prisma })
    const missing = await request(app).get('/api/v1/auth/me')
    expect(missing.status).toBe(401)
    const valid = await request(app).get('/api/v1/auth/me').set('Cookie', `localconnect_session=${token}`)
    expect(valid.status).toBe(200)
    expect(valid.body.data.user.id).toBe('user-1')
    expect(JSON.stringify(valid.body)).not.toContain('passwordHash')
  })
})
