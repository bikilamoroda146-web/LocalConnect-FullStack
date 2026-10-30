import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { createCsrfToken, createSessionToken } from '../../src/services/auth.service.js'
import { testConfig } from '../helpers/testConfig.js'

const row = ({ id = 'service-1', price = '125.50', title = 'Pipe repair', reviews = [{ rating: 4 }, { rating: 5 }] } = {}) => ({
  id,
  providerId: 'provider-1',
  title,
  category: 'plumbing',
  area: 'Waliso',
  description: 'Repair leaking pipes',
  price: { toString: () => price },
  priceUnit: 'per visit',
  includes: ['Inspection'],
  imageKey: 'services/pipe.jpg',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  provider: {
    id: 'provider-1',
    profession: 'Plumber',
    category: 'plumbing',
    area: 'Waliso',
    years: 9,
    bio: 'Public biography',
    skills: ['Pipe fitting'],
    verified: true,
    user: { id: 'user-1', name: 'Hana Bekele', avatarKey: null },
    reviews,
  },
})

const makePrisma = (rows = []) => ({
  $queryRaw: async () => [{ '?column?': 1 }],
  service: { findMany: async () => rows },
})

describe('GET /api/v1/services', () => {
  it('returns the public services response envelope with default pagination', async () => {
    const res = await request(createApp({ config: testConfig(), prisma: makePrisma() }))
      .get('/api/v1/services')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      data: [],
      meta: { page: 1, pageSize: 9, total: 0, totalPages: 0 },
    })
  })

  it('returns calculated ratings and Decimal prices without private user fields', async () => {
    const res = await request(createApp({ config: testConfig(), prisma: makePrisma([row()]) }))
      .get('/api/v1/services?rating=4.5')

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toMatchObject({
      price: '125.50',
      averageRating: 4.5,
      reviewCount: 2,
      provider: { name: 'Hana Bekele', profession: 'Plumber' },
    })
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
  })

  it('rejects invalid query parameters', async () => {
    const res = await request(createApp({ config: testConfig(), prisma: makePrisma() }))
      .get('/api/v1/services?page=0&pageSize=101&min=20&max=10&sort=unknown')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_QUERY')
  })

  it('passes publication, active-account, and supported filters to Prisma', async () => {
    let options
    const prisma = {
      service: { findMany: async (received) => { options = received; return [] } },
    }
    const res = await request(createApp({ config: testConfig(), prisma }))
      .get('/api/v1/services?q=pipe&category=plumbing&location=Waliso&min=10&max=200&page=2&pageSize=3')

    expect(res.status).toBe(200)
    expect(options.where).toMatchObject({
      published: true,
      provider: { verified: true, user: { status: 'ACTIVE' } },
      category: { equals: 'plumbing', mode: 'insensitive' },
      area: { equals: 'Waliso', mode: 'insensitive' },
      price: { gte: 10, lte: 200 },
    })
    expect(options.where.OR).toHaveLength(6)
  })

  it('creates a published service for the authenticated provider profile', async () => {
    let received
    const config = testConfig()
    const providerUser = {
      id: 'provider-user-1', name: 'Hana Bekele', email: 'hana@example.test', role: 'PROVIDER', status: 'ACTIVE', phone: null, area: 'Waliso', avatarKey: null,
      providerProfile: { id: 'provider-1', profession: 'Plumber', category: 'plumbing', area: 'Waliso', years: 9, bio: 'Bio', skills: [], verified: true },
    }
    const created = { ...row({ id: 'new-service' }), published: true }
    const prisma = {
      user: { findUnique: async () => providerUser },
      service: { create: async (args) => { received = args; return created } },
    }
    const cookies = [`localconnect_session=${createSessionToken(providerUser.id, config.authSessionSecret)}`, `localconnect_csrf=${createCsrfToken(config.authSessionSecret)}`]
    const csrf = cookies[1].slice('localconnect_csrf='.length)
    const res = await request(createApp({ config, prisma }))
      .post('/api/v1/services')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrf)
      .send({ providerId: 'another-provider', title: 'Pipe repair', category: 'plumbing', description: 'Repair leaking pipes safely.', price: 125.5, priceUnit: 'per visit', area: 'Waliso', includes: ['Inspection'], published: true })

    expect(res.status).toBe(201)
    expect(received.data.providerId).toBe('provider-1')
    expect(received.data.published).toBe(true)
    expect(res.body.data.service.id).toBe('new-service')
  })

  it('sorts and paginates results after applying the rating filter', async () => {
    const rows = [
      row({ id: 'low', price: '10.00', reviews: [{ rating: 3 }] }),
      row({ id: 'high', price: '20.00', reviews: [{ rating: 5 }] }),
      row({ id: 'middle', price: '15.00', reviews: [{ rating: 4 }] }),
    ]
    const res = await request(createApp({ config: testConfig(), prisma: makePrisma(rows) }))
      .get('/api/v1/services?rating=4&page=1&pageSize=1&sort=price-desc')

    expect(res.status).toBe(200)
    expect(res.body.data.map((service) => service.id)).toEqual(['high'])
    expect(res.body.meta).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 })
  })

  it('returns a safe 500 response when the database query fails', async () => {
    const prisma = { service: { findMany: async () => { throw new Error('database password=hidden') } } }
    const res = await request(createApp({ config: testConfig(), prisma }))
      .get('/api/v1/services')

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(res.body)).not.toContain('hidden')
  })

  it('returns a published service detail with provider and review data', async () => {
    const detail = row({ id: 'detail-1' })
    detail.provider.reviews = [{ id: 'review-1', authorName: 'Aster', rating: 5, text: 'Excellent', createdAt: new Date('2026-01-02T00:00:00.000Z') }]
    const prisma = {
      service: { findFirst: async () => detail },
    }

    const res = await request(createApp({ config: testConfig(), prisma }))
      .get('/api/v1/services/detail-1')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      id: 'detail-1',
      title: 'Pipe repair',
      provider: { name: 'Hana Bekele' },
      reviews: [{ author: 'Aster', rating: 5, text: 'Excellent' }],
    })
  })

  it('returns 404 for a missing or ineligible service detail', async () => {
    const prisma = { service: { findFirst: async () => null } }
    const res = await request(createApp({ config: testConfig(), prisma }))
      .get('/api/v1/services/not-found')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'The requested service was not found.' } })
  })
})
