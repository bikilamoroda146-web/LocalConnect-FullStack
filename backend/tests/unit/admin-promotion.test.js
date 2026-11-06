import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/services/auth.service.js'
import {
  promoteProductionAdmin,
  PRODUCTION_CONFIRMATION,
  PRODUCTION_DATABASE_NAME,
} from '../../src/services/admin-promotion.service.js'

const config = {
  isProduction: true,
  databaseName: PRODUCTION_DATABASE_NAME,
  databaseHost: 'test.neon.tech',
  productionDatabaseHost: 'test.neon.tech',
}
const email = 'bikilamoroda146@gmail.com'
const confirmation = PRODUCTION_CONFIRMATION

async function accountFixture(overrides = {}) {
  const password = randomBytes(24).toString('base64url')
  const passwordHash = await hashPassword(password)
  return {
    password,
    account: {
      id: 'existing-customer-id',
      name: 'Existing Customer',
      email,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      providerProfile: {
        id: 'profile-id',
        profession: 'Repair specialist',
        category: 'Home services',
        area: 'Kadikoy',
        years: 8,
        bio: 'Existing profile data',
        skills: ['repair'],
        verified: false,
      },
      ...overrides,
    },
  }
}

function prismaFor({ account = null, initialAccount = account, transactionAccount = account, admin = null, currentDatabase = PRODUCTION_DATABASE_NAME, databaseError, transactionError, updateError } = {}) {
  const updates = []
  const lockQueries = []
  const events = []
  const initialUser = {
    findFirst: async () => admin,
    findUnique: async () => {
      events.push('initial-account-read')
      return initialAccount
    },
    update: async (args) => {
      updates.push(args)
      if (updateError) throw updateError
      return { ...account, ...args.data }
    },
  }
  const transactionUser = {
    findFirst: async () => admin,
    findUnique: async () => {
      events.push('transaction-account-read')
      if (transactionError) throw transactionError
      return transactionAccount
    },
    update: initialUser.update,
  }

  return {
    updates,
    lockQueries,
    events,
    user: initialUser,
    $queryRaw: async () => {
      if (databaseError) throw databaseError
      return [{ database_name: currentDatabase }]
    },
    $transaction: async (callback) => callback({
      user: transactionUser,
      $queryRaw: async (query) => {
        events.push('advisory-lock')
        lockQueries.push(query)
        return [{ lock_acquired: 1 }]
      },
    }),
  }
}

async function promotionArgs({ prisma, password, ...overrides }) {
  return {
    prisma,
    config,
    email,
    password,
    confirmation,
    ...overrides,
  }
}

describe('production administrator account promotion', () => {
  it('refuses outside production before reading or updating Prisma', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account })

    await expect(promoteProductionAdmin(await promotionArgs({
      prisma,
      password,
      config: { isProduction: false, databaseName: PRODUCTION_DATABASE_NAME },
    }))).rejects.toMatchObject({ code: 'NON_PRODUCTION' })
    expect(prisma.updates).toHaveLength(0)
  })

it.each([
  [
    'wrong configured database',
    {
      isProduction: true,
      databaseName: 'neondb',
      databaseHost: 'test.neon.tech',
      productionDatabaseHost: 'test.neon.tech',
    },
    'WRONG_CONFIGURED_DATABASE',
  ],
  ['wrong connected database', config, 'WRONG_CONNECTED_DATABASE'],
])('refuses %s without an account update', async (label, testConfig, code) => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account, currentDatabase: code === 'WRONG_CONNECTED_DATABASE' ? 'neondb' : PRODUCTION_DATABASE_NAME })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password, config: testConfig })))
      .rejects.toMatchObject({ code })
    expect(prisma.updates).toHaveLength(0)
  })

  it('requires the exact production confirmation', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password, confirmation: 'CREATE ADMIN' })))
      .rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' })
    expect(prisma.updates).toHaveLength(0)
  })

  it('refuses an email other than the existing production account email', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password, email: 'another@example.com' })))
      .rejects.toMatchObject({ code: 'TARGET_EMAIL_NOT_ALLOWED' })
    expect(prisma.updates).toHaveLength(0)
  })

  it('verifies the existing password and refuses an incorrect password without changing anything', async () => {
    const { account } = await accountFixture()
    const prisma = prismaFor({ account })
    const incorrectPassword = randomBytes(24).toString('base64url')

    expect(await verifyPassword(incorrectPassword, account.passwordHash)).toBe(false)
    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password: incorrectPassword })))
      .rejects.toMatchObject({ code: 'INVALID_PASSWORD' })
    expect(prisma.updates).toHaveLength(0)
  })

  it.each([
    ['missing', {}, 'TARGET_ACCOUNT_NOT_FOUND'],
    ['inactive', { status: 'SUSPENDED' }, 'TARGET_ACCOUNT_NOT_ACTIVE'],
    ['not a customer', { role: 'PROVIDER' }, 'TARGET_ACCOUNT_NOT_CUSTOMER'],
  ])('requires the target account to be %s', async (label, overrides, code) => {
    const { password, account } = await accountFixture(overrides)
    const prisma = prismaFor({ account: label === 'missing' ? null : account })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password })))
      .rejects.toMatchObject({ code })
    expect(prisma.updates).toHaveLength(0)
  })

  it('refuses promotion when another administrator exists', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account, admin: { id: 'existing-admin-id' } })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password })))
      .rejects.toMatchObject({ code: 'ADMIN_EXISTS' })
    expect(prisma.updates).toHaveLength(0)
  })

  it('acquires the existing advisory lock and updates only the role', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password })))
      .resolves.toMatchObject({ promoted: true })
    expect(prisma.lockQueries).toHaveLength(1)
    expect(prisma.lockQueries[0][0]).toContain('pg_advisory_xact_lock(2147483646, 1701)')
    expect(prisma.updates).toEqual([{
      where: { id: account.id },
      data: { role: 'ADMIN' },
    }])
  })

  it('re-fetches the account inside the transaction after acquiring the advisory lock', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account })

    await promoteProductionAdmin(await promotionArgs({ prisma, password }))

    expect(prisma.events).toEqual([
      'initial-account-read',
      'advisory-lock',
      'transaction-account-read',
    ])
  })

  it.each([
    ['ID', { id: 'different-customer-id' }],
    ['passwordHash', { passwordHash: `scrypt-test-${randomBytes(16).toString('hex')}` }],
    ['role', { role: 'PROVIDER' }],
    ['status', { status: 'SUSPENDED' }],
  ])('refuses promotion when %s changes before the transaction update', async (field, changes) => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account, transactionAccount: { ...account, ...changes } })

    await expect(promoteProductionAdmin(await promotionArgs({ prisma, password }))).rejects.toThrow()
    expect(prisma.updates).toHaveLength(0)
  })

  it('preserves the existing account identity, credentials, status, and profile', async () => {
    const { password, account } = await accountFixture()
    const prisma = prismaFor({ account })

    await promoteProductionAdmin(await promotionArgs({ prisma, password }))

    const updated = { ...account, ...prisma.updates[0].data }
    expect(updated).toEqual({ ...account, role: 'ADMIN' })
    expect(updated.id).toBe(account.id)
    expect(updated.name).toBe(account.name)
    expect(updated.email).toBe(account.email)
    expect(updated.passwordHash).toBe(account.passwordHash)
    expect(updated.status).toBe(account.status)
    expect(updated.providerProfile).toEqual(account.providerProfile)
  })

  it('sanitizes database errors and never exposes secrets', async () => {
    const { password, account } = await accountFixture()
    const secret = randomBytes(24).toString('base64url')
    const prisma = prismaFor({
      account,
      databaseError: Object.assign(new Error(`database password ${secret}`), { code: 'P2010' }),
    })

    const error = await promoteProductionAdmin(await promotionArgs({ prisma, password })).catch((caught) => caught)

    expect(error).toMatchObject({ code: 'DATABASE_ERROR' })
    expect(error.message).not.toContain(secret)
    expect(error.message).not.toContain(password)
    expect(prisma.updates).toHaveLength(0)
  })

  it('sanitizes errors thrown during the transaction and never exposes passwords or connection details', async () => {
    const { password, account } = await accountFixture()
    const connectionSecret = randomBytes(24).toString('base64url')
    const prisma = prismaFor({
      account,
      transactionError: Object.assign(new Error(`postgres connection ${connectionSecret}`), { code: 'P2010' }),
    })

    const error = await promoteProductionAdmin(await promotionArgs({ prisma, password })).catch((caught) => caught)

    expect(error).toMatchObject({ code: 'DATABASE_ERROR' })
    expect(error.message).not.toContain(password)
    expect(error.message).not.toContain(connectionSecret)
    expect(error.message).not.toContain('postgres connection')
    expect(prisma.updates).toHaveLength(0)
  })
})
