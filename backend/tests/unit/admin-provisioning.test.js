import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { provisionProductionAdmin, PRODUCTION_DATABASE_NAME, PRODUCTION_CONFIRMATION } from '../../src/services/admin-provisioning.service.js'
import { verifyPassword } from '../../src/services/auth.service.js'

const config = {
  isProduction: true,
  databaseName: PRODUCTION_DATABASE_NAME,
  databaseHost: 'test.neon.tech',
  productionDatabaseHost: 'test.neon.tech',
}
const input = { name: 'Production Administrator', email: 'admin@example.com', password: `Test-${randomBytes(24).toString('base64url')}` }
const confirmation = PRODUCTION_CONFIRMATION

function prismaWith({ currentDatabase = PRODUCTION_DATABASE_NAME, admin = null, emailUser = null } = {}) {
  const created = []
  const lockCalls = []
  const user = {
    findFirst: async () => admin,
    findUnique: async () => emailUser,
    create: async ({ data }) => { created.push(data); return { id: 'admin-1', ...data } },
  }
  return {
    user,
    created,
    lockCalls,
    $queryRaw: async () => [{ database_name: currentDatabase }],
    $transaction: async (callback) => callback({ user, $queryRaw: async (query) => { lockCalls.push(query) } }),
  }
}

describe('production administrator provisioning', () => {
  it('creates one active administrator with a scrypt password hash after verifying the target database', async () => {
    // Catches a provisioning path that writes without checking the connected database or hashes incorrectly.
    const prisma = prismaWith()
    const result = await provisionProductionAdmin({ prisma, config, input, confirmation })

    expect(result).toEqual({ created: true })
    expect(prisma.created).toHaveLength(1)
    expect(prisma.created[0]).toMatchObject({ name: input.name, email: input.email, role: 'ADMIN', status: 'ACTIVE' })
    expect(prisma.created[0].passwordHash).not.toContain(input.password)
    expect(await verifyPassword(input.password, prisma.created[0].passwordHash)).toBe(true)
    expect(prisma.lockCalls).toHaveLength(1)
    expect(prisma.lockCalls[0][0]).toContain('SELECT 1::int AS lock_acquired FROM (SELECT pg_advisory_xact_lock(2147483646, 1701)) AS advisory_lock')
    expect(prisma.lockCalls[0][0]).not.toContain('hashtextextended')
  })

  it('reports an advisory-lock adapter failure without hiding its safe category', async () => {
    const prisma = prismaWith()
    prisma.$transaction = async (callback) => callback({
      user: prisma.user,
      $queryRaw: async () => {
        throw Object.assign(new Error('private adapter detail'), {
          code: 'P2010',
          meta: { driverAdapterError: { cause: { kind: 'UnsupportedNativeDataType', originalCode: 'P2010' } } },
        })
      },
    })

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
      operation: 'acquire-advisory-lock',
      causeCategory: 'UnsupportedNativeDataType',
      causeCode: 'P2010',
      message: 'A database operation failed. No success was confirmed.',
    })
    expect(prisma.created).toHaveLength(0)
  })

  it('refuses when the actual connected database is not localconnect_app', async () => {
    // Catches a configuration-only check that could connect to a differently named database.
    const prisma = prismaWith({ currentDatabase: 'neondb' })

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toThrow(/connected database/i)
    expect(prisma.created).toHaveLength(0)
  })

  it('reports only a safe operation and database code when the connection check fails', async () => {
    const prisma = prismaWith()
    prisma.$queryRaw = async () => {
      throw Object.assign(new Error('contains a secret connection detail'), {
        code: 'P2010',
        meta: { code: 'ECONNREFUSED', message: 'contains another secret detail' },
      })
    }

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
      operation: 'verify-connected-database',
      causeCode: 'ECONNREFUSED',
    })
  })

  it('reports the failed database operation without exposing the underlying error message', async () => {
    const prisma = prismaWith()
    prisma.user.findFirst = async () => { throw Object.assign(new Error('private database detail'), { code: '42P01' }) }

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
      operation: 'check-existing-administrator',
      causeCode: '42P01',
      message: 'A database operation failed. No success was confirmed.',
    })
  })

  it('reports the safe code and category from a Prisma driver-adapter error', async () => {
    const prisma = prismaWith()
    prisma.$queryRaw = async () => {
      throw Object.assign(new Error('private Prisma message'), {
        code: 'P2010',
        meta: {
          driverAdapterError: {
            cause: {
              kind: 'postgres',
              originalCode: '3D000',
              originalMessage: 'private database message',
            },
          },
        },
      })
    }

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toMatchObject({
      operation: 'verify-connected-database',
      causeCategory: 'postgres',
      causeCode: '3D000',
      message: 'A database operation failed. No success was confirmed.',
    })
  })

  it('follows a non-enumerable Error.cause to extract a safe PostgreSQL code and category', async () => {
    const prisma = prismaWith()
    prisma.$queryRaw = async () => {
      const postgresError = new Error('private PostgreSQL message')
      postgresError.code = '08006'
      postgresError.kind = 'postgres'
      throw Object.assign(new Error('private Prisma message', { cause: postgresError }), { code: 'P2010' })
    }

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toMatchObject({
      operation: 'verify-connected-database',
      causeCategory: 'postgres',
      causeCode: '08006',
      causeType: 'Error',
      causeProperties: expect.stringContaining('cause'),
    })
  })

  it('reports safe error shape metadata for an unknown wrapped error', async () => {
    const prisma = prismaWith()
    prisma.$queryRaw = async () => {
      throw Object.assign(new Error('private connection detail'), {
        cause: { name: 'DriverAdapterError', kind: 'GenericJs', message: 'private nested detail' },
      })
    }

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.toMatchObject({
      operation: 'verify-connected-database',
      causeCategory: 'GenericJs',
      causeCode: 'UNKNOWN',
      causeType: 'Error|DriverAdapterError',
    })
    await expect(provisionProductionAdmin({ prisma, config, input, confirmation })).rejects.not.toMatchObject({
      causeProperties: expect.stringContaining('private'),
    })
  })

  it('handles missing and circular causes without exposing arbitrary properties', async () => {
    const missingCausePrisma = prismaWith()
    missingCausePrisma.$queryRaw = async () => { throw new Error('private missing-cause message') }

    await expect(provisionProductionAdmin({ prisma: missingCausePrisma, config, input, confirmation })).rejects.toMatchObject({
      causeCategory: 'UNKNOWN',
      causeCode: 'UNKNOWN',
      causeType: 'Error',
    })

    const circularPrisma = prismaWith()
    circularPrisma.$queryRaw = async () => {
      const first = new Error('private first message')
      const second = new Error('private second message')
      second.code = '57P01'
      second.kind = 'postgres'
      first.cause = second
      second.cause = first
      throw first
    }

    await expect(provisionProductionAdmin({ prisma: circularPrisma, config, input, confirmation })).rejects.toMatchObject({
      causeCategory: 'postgres',
      causeCode: '57P01',
      causeType: 'Error',
    })
  })

  it('requires the exact production confirmation', async () => {
    // Catches an accidental or weak confirmation gate before a production write.
    const prisma = prismaWith()

    await expect(provisionProductionAdmin({ prisma, config, input, confirmation: 'yes' })).rejects.toThrow(/confirmation/i)
    expect(prisma.created).toHaveLength(0)
  })

  it('refuses to modify an existing administrator or existing email account', async () => {
    // Catches an implementation that resets credentials, changes roles, or silently reuses an email.
    const existingAdmin = prismaWith({ admin: { id: 'existing-admin', email: 'old-admin@example.com' } })
    await expect(provisionProductionAdmin({ prisma: existingAdmin, config, input, confirmation })).rejects.toThrow(/administrator already exists/i)
    expect(existingAdmin.created).toHaveLength(0)

    const existingEmail = prismaWith({ emailUser: { id: 'existing-user', role: 'CUSTOMER' } })
    await expect(provisionProductionAdmin({ prisma: existingEmail, config, input, confirmation })).rejects.toThrow(/email/i)
    expect(existingEmail.created).toHaveLength(0)
  })

  it('reuses the account validation rules and refuses invalid input without a database write', async () => {
    // Catches a provisioning command that accepts malformed identities or weak passwords outside the app rules.
    const prisma = prismaWith()

    await expect(provisionProductionAdmin({ prisma, config, input: { ...input, email: 'not-an-email' }, confirmation })).rejects.toThrow(/invalid/i)
    await expect(provisionProductionAdmin({ prisma, config, input: { ...input, password: 'x'.repeat(7) }, confirmation })).rejects.toThrow(/invalid/i)
    expect(prisma.created).toHaveLength(0)
  })
})
