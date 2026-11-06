
import { z } from 'zod'

// Pure function: takes a plain object of settings, returns a validated config
// or throws EnvValidationError. Pure = easy to unit test and never touches the real environment.

export class EnvValidationError extends Error {
  constructor(problems) {
    super('Invalid environment configuration')
    this.name = 'EnvValidationError'
    this.problems = problems // Never contains secret values.
  }
}

const DEFAULT_DEV_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'

function toOrigin(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (url.pathname !== '/' || url.search || url.hash) return null

  return url.origin
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  HOST: z.string().min(1, 'must not be empty').default('127.0.0.1'),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z
    .string({ error: 'is required' })
    .min(1, 'is required')
    .refine(
      (value) => /^postgres(ql)?:\/\//.test(value),
      'must start with postgresql://',
    ),

  // Expected Neon production database hostname.
  PRODUCTION_DATABASE_HOST: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => !/[/:@?#\s]/.test(value),
      'must contain only a hostname',
    )
    .optional(),

  AUTH_SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),

  CORS_ORIGINS: z.string().optional(),

  DEV_ADMIN_EMAIL: z.string().trim().toLowerCase().email().optional(),

  DEV_ADMIN_PASSWORD: z.string().min(8).max(200).optional(),

  DEV_ADMIN_NAME: z.string().trim().min(2).max(120).optional(),
})

export function parseEnv(raw) {
  const problems = []
  const result = schema.safeParse(raw)

  if (!result.success) {
    for (const issue of result.error.issues) {
      problems.push(
        `${issue.path.join('.') || 'environment'}: ${issue.message}`,
      )
    }

    throw new EnvValidationError(problems)
  }

  const cfg = result.data

  // Extract database name and hostname without exposing credentials.
  let databaseName = ''
  let databaseHost = ''

  try {
    const databaseUrl = new URL(cfg.DATABASE_URL)

    databaseName = decodeURIComponent(
      databaseUrl.pathname.replace(/^\//, ''),
    )

    databaseHost = databaseUrl.hostname.toLowerCase()
  } catch {
    problems.push(
      'DATABASE_URL: is not a valid URL. If the password contains special characters such as @ : / # ?, they must be percent-encoded.',
    )
  }

  if (!problems.length && !databaseName) {
    problems.push(
      'DATABASE_URL: must end with the database name, e.g. .../localconnect_dev',
    )
  }

  // Safety net: tests may wipe data, so they may only ever run
  // against a database named *_test.
  if (
    !problems.length &&
    cfg.NODE_ENV === 'test' &&
    !databaseName.endsWith('_test')
  ) {
    problems.push(
      'DATABASE_URL: in test mode the database name must end with "_test" (protects your real data).',
    )
  }

  // CORS origins: a default exists for local development only.
  let corsRaw = cfg.CORS_ORIGINS

  if (corsRaw === undefined || corsRaw.trim() === '') {
    if (cfg.NODE_ENV === 'production') {
      problems.push(
        'CORS_ORIGINS: is required in production (the exact frontend URL).',
      )
    }

    corsRaw = DEFAULT_DEV_ORIGINS
  }

  const corsOrigins = []

  for (const item of corsRaw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const origin = toOrigin(item)

    if (!origin) {
      problems.push(
        `CORS_ORIGINS: "${item}" is not a valid origin (use e.g. http://localhost:5173, no path).`,
      )
    } else if (!corsOrigins.includes(origin)) {
      corsOrigins.push(origin)
    }
  }

  if (problems.length) {
    throw new EnvValidationError(problems)
  }

  return Object.freeze({
    nodeEnv: cfg.NODE_ENV,
    isProduction: cfg.NODE_ENV === 'production',
    isTest: cfg.NODE_ENV === 'test',

    host: cfg.HOST,
    port: cfg.PORT,

    databaseUrl: cfg.DATABASE_URL,
    databaseName,
    databaseHost,

    productionDatabaseHost:
      cfg.PRODUCTION_DATABASE_HOST?.toLowerCase(),

    authSessionSecret: cfg.AUTH_SESSION_SECRET,

    corsOrigins: Object.freeze(corsOrigins),

    devAdminEmail: cfg.DEV_ADMIN_EMAIL,
    devAdminPassword: cfg.DEV_ADMIN_PASSWORD,
    devAdminName: cfg.DEV_ADMIN_NAME,
  })
}
