// REAL PostgreSQL tests. Run with:  npm run test:db
// Needs backend/.env.test pointing at a database whose name ends with "_test".
// If PostgreSQL is not reachable these tests FAIL (they never silently skip).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { loadEnv } from '../../src/config/env.js'
import { createPrismaClient } from '../../src/lib/prisma.js'
import { createApp } from '../../src/app.js'
import { parseEnv } from '../../src/config/parseEnv.js'

let config
let prisma

beforeAll(() => {
  config = loadEnv() // throws a clear error if .env.test is missing or points at a non-_test database
  prisma = createPrismaClient(config.databaseUrl)
})
afterAll(async () => {
  await prisma?.$disconnect()
})

describe('PostgreSQL integration', () => {
  it('runs in test mode against a *_test database', () => {
    expect(config.isTest).toBe(true)
    expect(config.databaseName.endsWith('_test')).toBe(true)
  })

  it('can run a query against PostgreSQL', async () => {
    const rows = await prisma.$queryRaw`SELECT current_database() AS db, 1 AS one`
    expect(rows[0].one).toBe(1)
    expect(rows[0].db).toBe(config.databaseName)
  })

  it('GET /api/v1/health reports the database as up', async () => {
    const res = await request(createApp({ config, prisma })).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' })
  })

  it('GET /api/v1/health reports "down" (503) when the database is unreachable', async () => {
    // Port 1 is closed, so this connection is refused immediately.
    const unreachable = createPrismaClient('postgresql://nobody:nopass@127.0.0.1:1/nowhere_test')
    try {
      const cfg = parseEnv({ NODE_ENV: 'test', DATABASE_URL: 'postgresql://nobody:nopass@127.0.0.1:1/nowhere_test' })
      const res = await request(createApp({ config: cfg, prisma: unreachable })).get('/api/v1/health')
      expect(res.status).toBe(503)
      expect(res.body.data.database).toBe('down')
    } finally {
      await unreachable.$disconnect().catch(() => {})
    }
  })
})
