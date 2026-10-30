import { describe, it, expect } from 'vitest'
import { parseEnv, EnvValidationError } from '../../src/config/parseEnv.js'

const valid = { DATABASE_URL: 'postgresql://u:p@localhost:5432/localconnect_dev', AUTH_SESSION_SECRET: 'test-only-secret-that-is-at-least-32-characters' }
const problemsOf = (raw) => {
  try {
    parseEnv(raw)
  } catch (e) {
    expect(e).toBeInstanceOf(EnvValidationError)
    return e.problems.join(' | ')
  }
  throw new Error('expected parseEnv to throw')
}

describe('parseEnv', () => {
  it('applies safe development defaults', () => {
    const cfg = parseEnv(valid)
    expect(cfg.nodeEnv).toBe('development')
    expect(cfg.host).toBe('127.0.0.1')
    expect(cfg.port).toBe(4000)
    expect(cfg.databaseName).toBe('localconnect_dev')
    expect(cfg.corsOrigins).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173'])
  })

  it('requires DATABASE_URL', () => {
    expect(problemsOf({})).toContain('DATABASE_URL')
  })

  it('rejects a DATABASE_URL that is not a PostgreSQL URL', () => {
    expect(problemsOf({ DATABASE_URL: 'mysql://u:p@localhost/db' })).toContain('postgresql://')
  })

  it('rejects an invalid PORT', () => {
    expect(problemsOf({ ...valid, PORT: '99999' })).toContain('PORT')
    expect(problemsOf({ ...valid, PORT: 'abc' })).toContain('PORT')
  })

  it('accepts a numeric PORT given as text', () => {
    expect(parseEnv({ ...valid, PORT: '5050' }).port).toBe(5050)
  })

  it('normalises and de-duplicates CORS origins', () => {
    const cfg = parseEnv({ ...valid, CORS_ORIGINS: 'http://Localhost:5173/, http://localhost:5173 ,https://app.example.com' })
    expect(cfg.corsOrigins).toEqual(['http://localhost:5173', 'https://app.example.com'])
  })

  it('rejects CORS origins with a path or wrong scheme', () => {
    expect(problemsOf({ ...valid, CORS_ORIGINS: 'http://localhost:5173/app' })).toContain('CORS_ORIGINS')
    expect(problemsOf({ ...valid, CORS_ORIGINS: 'ftp://example.com' })).toContain('CORS_ORIGINS')
  })

  it('requires CORS_ORIGINS in production', () => {
    expect(problemsOf({ ...valid, NODE_ENV: 'production' })).toContain('CORS_ORIGINS')
    expect(parseEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGINS: 'https://app.example.com' }).isProduction).toBe(true)
  })

  it('refuses test mode unless the database name ends with _test', () => {
    expect(problemsOf({ ...valid, NODE_ENV: 'test' })).toContain('_test')
    expect(parseEnv({ DATABASE_URL: 'postgresql://u:p@localhost:5432/localconnect_test', NODE_ENV: 'test', AUTH_SESSION_SECRET: valid.AUTH_SESSION_SECRET }).isTest).toBe(true)
  })

  it('explains an unparsable DATABASE_URL without echoing it', () => {
    const text = problemsOf({ DATABASE_URL: 'postgresql://u:TopSecret@localhost:notaport/db', AUTH_SESSION_SECRET: valid.AUTH_SESSION_SECRET })
    expect(text).toContain('not a valid URL')
    expect(text).not.toContain('TopSecret')
  })

  it('never includes the DATABASE_URL value in error output', () => {
    const text = problemsOf({ DATABASE_URL: 'mysql://admin:SuperSecret@localhost/db', AUTH_SESSION_SECRET: valid.AUTH_SESSION_SECRET })
    expect(text).not.toContain('SuperSecret')
  })
})
