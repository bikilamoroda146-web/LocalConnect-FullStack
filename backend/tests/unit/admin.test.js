import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { createCsrfToken, createSessionToken, hashPassword } from '../../src/services/auth.service.js'
import { testConfig } from '../helpers/testConfig.js'

const config = testConfig()
const admin = { id: 'admin-1', name: 'Admin', email: 'admin@example.test', role: 'ADMIN', status: 'ACTIVE', phone: null, area: null, avatarKey: null, providerProfile: null }
const providerUser = { id: 'provider-user-1', name: 'Provider', email: 'provider@example.test', role: 'PROVIDER', status: 'PENDING', phone: null, area: 'Addis Ababa', avatarKey: null, providerProfile: { id: 'provider-1', profession: 'Plumber', category: 'home-repairs', area: 'Addis Ababa', years: 4, bio: 'Bio', skills: [], verified: false } }
const provider = { id: 'provider-1', userId: 'provider-user-1', profession: 'Plumber', category: 'home-repairs', area: 'Addis Ababa', years: 4, bio: 'Bio', skills: [], verified: false, user: { id: providerUser.id, name: providerUser.name, email: providerUser.email, status: 'PENDING', createdAt: new Date().toISOString() } }

function cookiesFor(userId) {
  return [`localconnect_session=${createSessionToken(userId, config.authSessionSecret)}`, `localconnect_csrf=${createCsrfToken(config.authSessionSecret)}`]
}

function fakePrisma() {
  let status = 'PENDING'
  let verified = false
  return {
    user: {
      findUnique: async ({ where }) => where.id === admin.id ? admin : where.id === 'customer-1' ? { ...admin, id: 'customer-1', role: 'CUSTOMER' } : { ...providerUser, status, providerProfile: { ...providerUser.providerProfile, verified } },
      findMany: async () => status === 'PENDING' ? [{ id: providerUser.id, name: providerUser.name, email: providerUser.email, status, createdAt: provider.user.createdAt, providerProfile: { ...provider } }] : [],
    },
    providerProfile: {
      findMany: async () => status === 'PENDING' ? [{ ...provider, user: { ...provider.user, status } }] : [],
      findUnique: async () => ({ id: provider.id, userId: provider.userId, user: { role: 'PROVIDER', status } }),
      update: async ({ data }) => { verified = data.verified; return { ...provider, verified, user: { ...provider.user, status } } },
    },
    $transaction: async (callback) => callback({
      user: { update: async ({ data }) => { status = data.status } },
      providerProfile: { update: async ({ data }) => { verified = data.verified; return { ...provider, verified, user: { ...provider.user, status } } } },
    }),
  }
}

describe('administrator provider review', () => {
  it('allows an active administrator to log in', async () => {
    const passwordHash = await hashPassword('correct horse battery staple')
    const prisma = fakePrisma()
    prisma.user.findUnique = async ({ where }) => where.email ? { ...admin, passwordHash } : admin
    const res = await request(createApp({ config, prisma })).post('/api/v1/auth/login').send({ email: admin.email, password: 'correct horse battery staple' })
    expect(res.status).toBe(200)
    expect(res.body.data.user).toMatchObject({ email: admin.email, role: 'ADMIN' })
  })

  it('rejects unauthenticated and non-administrator access', async () => {
    const prisma = fakePrisma()
    const app = createApp({ config, prisma })
    expect((await request(app).get('/api/v1/admin/providers/pending')).status).toBe(401)
    const userToken = createSessionToken('customer-1', config.authSessionSecret)
    const res = await request(app).get('/api/v1/admin/providers/pending').set('Cookie', `localconnect_session=${userToken}`)
    expect(res.status).toBe(403)
  })

  it('lists and approves a pending provider, then permits provider login', async () => {
    const prisma = fakePrisma()
    const app = createApp({ config, prisma })
    const cookies = cookiesFor(admin.id)
    const pending = await request(app).get('/api/v1/admin/providers/pending').set('Cookie', cookies)
    expect(pending.status).toBe(200)
    expect(pending.body.data[0]).toMatchObject({ id: 'provider-1', user: { status: 'PENDING' } })
    const csrf = cookies[1].slice('localconnect_csrf='.length)
    const approved = await request(app).post('/api/v1/admin/providers/provider-1/approve').set('Cookie', cookies).set('X-CSRF-Token', csrf)
    expect(approved.status).toBe(200)
    expect(approved.body.data).toMatchObject({ id: 'provider-1', verified: true, user: { status: 'ACTIVE' } })

    const passwordHash = await hashPassword('correct horse battery staple')
    prisma.user.findUnique = async ({ where }) => where.email ? { ...providerUser, status: 'ACTIVE', passwordHash, providerProfile: { ...providerUser.providerProfile, verified: true } } : admin
    const login = await request(app).post('/api/v1/auth/login').send({ email: providerUser.email, password: 'correct horse battery staple' })
    expect(login.status).toBe(200)
    expect(login.body.data.user.status).toBe('ACTIVE')
  })

  it('requires CSRF protection for provider rejection', async () => {
    const res = await request(createApp({ config, prisma: fakePrisma() })).post('/api/v1/admin/providers/provider-1/reject').set('Cookie', cookiesFor(admin.id))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('CSRF_INVALID')
  })
})
