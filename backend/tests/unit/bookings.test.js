import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { createSessionToken } from '../../src/services/auth.service.js'
import { testConfig } from '../helpers/testConfig.js'

const config = testConfig()
const tomorrow = () => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + 2)
  return date.toISOString().slice(0, 10)
}
const user = ({ id = 'customer-1', role = 'CUSTOMER', status = 'ACTIVE', providerProfile = null } = {}) => ({
  id, name: 'Test User', email: 'user@example.test', role, status, phone: null, area: null, avatarKey: null, providerProfile,
})
const tokenFor = (id = 'customer-1') => createSessionToken(id, config.authSessionSecret)
const csrfAndCookie = async (agent) => {
  const res = await agent.get('/api/v1/auth/csrf')
  const token = res.body.data.token
  return { token, cookie: res.headers['set-cookie'][0].split(';')[0] }
}
const makePrisma = ({ authenticated = user(), service = { id: 'service-1', providerId: 'provider-1' }, created, listed = [] } = {}) => {
  const prisma = {
    state: {},
    user: { findUnique: async () => authenticated },
    service: { findFirst: async (args) => { prisma.state.serviceQuery = args; return service } },
    booking: {
      create: async (args) => { prisma.state.createArgs = args; return created ?? { id: 'booking-1', ...args.data } },
      findMany: async (args) => { prisma.state.listArgs = args; return listed },
    },
  }
  return prisma
}

describe('booking API', () => {
  it('requires a valid signed-in user and a CSRF token', async () => {
    const app = createApp({ config, prisma: makePrisma() })
    const noAuth = await request(app).post('/api/v1/bookings').send({ serviceId: 'service-1', date: tomorrow(), time: '10:00' })
    expect(noAuth.status).toBe(401)

    const agent = request.agent(app)
    const cookie = `localconnect_session=${tokenFor()}`
    const noCsrf = await agent.post('/api/v1/bookings').set('Cookie', cookie).send({ serviceId: 'service-1', date: tomorrow(), time: '10:00' })
    expect(noCsrf.status).toBe(403)
    expect(noCsrf.body.error.code).toBe('CSRF_INVALID')
  })

  it('creates a pending booking using only the authenticated customer identity', async () => {
    const prisma = makePrisma()
    const agent = request.agent(createApp({ config, prisma }))
    const csrf = await csrfAndCookie(agent)
    const res = await agent.post('/api/v1/bookings')
      .set('Cookie', `localconnect_session=${tokenFor()}; ${csrf.cookie}`)
      .set('X-CSRF-Token', csrf.token)
      .send({ serviceId: 'service-1', date: tomorrow(), time: '10:30', note: 'Please call first', customerId: 'victim-id', providerId: 'spoofed-provider' })

    expect(res.status).toBe(201)
    expect(prisma.state.serviceQuery.where).toEqual({ id: 'service-1', published: true, provider: { user: { status: 'ACTIVE' } } })
    expect(prisma.state.createArgs.data).toMatchObject({ serviceId: 'service-1', providerId: 'provider-1', customerId: 'customer-1', note: 'Please call first', status: 'PENDING' })
    expect(prisma.state.createArgs.data.customerId).not.toBe('victim-id')
    expect(prisma.state.createArgs.data.date.toISOString().slice(0, 10)).toBe(tomorrow())
    expect(prisma.state.createArgs.data.time.toISOString().slice(11, 16)).toBe('10:30')
  })

  it('rejects invalid calendar dates, invalid times, and non-customer accounts', async () => {
    const agent = request.agent(createApp({ config, prisma: makePrisma() }))
    const csrf = await csrfAndCookie(agent)
    const cookie = `localconnect_session=${tokenFor()}; ${csrf.cookie}`
    const badDate = await agent.post('/api/v1/bookings').set('Cookie', cookie).set('X-CSRF-Token', csrf.token).send({ serviceId: 'service-1', date: '2026-02-31', time: '10:00' })
    expect(badDate.status).toBe(400)
    const badTime = await agent.post('/api/v1/bookings').set('Cookie', cookie).set('X-CSRF-Token', csrf.token).send({ serviceId: 'service-1', date: tomorrow(), time: '25:00' })
    expect(badTime.status).toBe(400)

    const provider = makePrisma({ authenticated: user({ id: 'provider-user', role: 'PROVIDER' }) })
    const providerAgent = request.agent(createApp({ config, prisma: provider }))
    const providerCsrf = await csrfAndCookie(providerAgent)
    const forbidden = await providerAgent.post('/api/v1/bookings').set('Cookie', `localconnect_session=${tokenFor('provider-user')}; ${providerCsrf.cookie}`).set('X-CSRF-Token', providerCsrf.token).send({ serviceId: 'service-1', date: tomorrow(), time: '10:00' })
    expect(forbidden.status).toBe(403)
    expect(forbidden.body.error.code).toBe('FORBIDDEN')
  })

  it('returns 404 when a service is unpublished or its provider is inactive', async () => {
    const prisma = makePrisma({ service: null })
    const agent = request.agent(createApp({ config, prisma }))
    const csrf = await csrfAndCookie(agent)
    const res = await agent.post('/api/v1/bookings').set('Cookie', `localconnect_session=${tokenFor()}; ${csrf.cookie}`).set('X-CSRF-Token', csrf.token).send({ serviceId: 'hidden-service', date: tomorrow(), time: '10:00' })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE')
  })

  it('scopes customer and provider booking reads and preserves the existing admin-wide view', async () => {
    const cases = [
      [user({ id: 'customer-1' }), { customerId: 'customer-1' }],
      [user({ id: 'provider-user', role: 'PROVIDER', providerProfile: { id: 'provider-1' } }), { providerId: 'provider-1' }],
      [user({ id: 'admin-user', role: 'ADMIN' }), {}],
    ]
    for (const [identity, expectedWhere] of cases) {
      const prisma = makePrisma({ authenticated: identity })
      const res = await request(createApp({ config, prisma }))
        .get('/api/v1/bookings')
        .set('Cookie', `localconnect_session=${tokenFor(identity.id)}`)
      expect(res.status).toBe(200)
      expect(prisma.state.listArgs.where).toEqual(expectedWhere)
    }
  })
})
