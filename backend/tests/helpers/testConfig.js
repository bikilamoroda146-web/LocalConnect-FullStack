// A ready-made validated config for tests that need an app but no real environment.
import { parseEnv } from '../../src/config/parseEnv.js'

export const testConfig = (overrides = {}) =>
  parseEnv({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/example_test',
    AUTH_SESSION_SECRET: 'test-only-secret-that-is-at-least-32-characters',
    CORS_ORIGINS: 'http://localhost:5173',
    ...overrides,
  })

// Fake database clients so unit tests never need PostgreSQL.
export const fakePrismaUp = { $queryRaw: async () => [{ '?column?': 1 }] }
export const fakePrismaDown = {
  $queryRaw: async () => {
    throw new Error('connect ECONNREFUSED secret-host:5432 password=hunter2')
  },
}
export const fakePrismaHanging = { $queryRaw: () => new Promise(() => {}) }
