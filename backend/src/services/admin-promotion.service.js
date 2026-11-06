import { assertProductionDatabaseHost } from './production-database.guard.js'

import { verifyPassword } from './auth.service.js'

export const PRODUCTION_DATABASE_NAME = 'localconnect_app'
export const PRODUCTION_CONFIRMATION = 'CREATE ADMIN IN localconnect_app'
const APPROVED_EMAIL = 'bikilamoroda146@gmail.com'

export class AdminPromotionError extends Error {
  constructor(message, code = 'ADMIN_PROMOTION_FAILED', diagnostics = {}) {
    super(message)
    this.name = 'AdminPromotionError'
    this.code = code
    this.operation = diagnostics.operation
  }
}

function databaseFailure(operation, error) {
  if (error instanceof AdminPromotionError) return error
  return new AdminPromotionError('A database operation failed. No success was confirmed.', 'DATABASE_ERROR', { operation })
}

async function databaseStep(operation, callback) {
  try {
    return await callback()
  } catch (error) {
    throw databaseFailure(operation, error)
  }
}

function fail(message, code) {
  throw new AdminPromotionError(message, code)
}

function normalizedEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function assertUnchanged(initialAccount, currentAccount) {
  if (!currentAccount) fail('The target account changed or no longer exists; no records changed.', 'TARGET_ACCOUNT_CHANGED')

  for (const property of ['id', 'passwordHash', 'role', 'status']) {
    if (currentAccount[property] !== initialAccount[property]) {
      fail('The target account changed during promotion; no records changed.', 'TARGET_ACCOUNT_CHANGED')
    }
  }
}

export async function promoteProductionAdmin({ prisma, config, email, password, confirmation }) {
  if (!config?.isProduction) {
    fail('Refusing to promote an administrator outside production.', 'NON_PRODUCTION')
  }

  // Always verify the expected production hostname first.
  assertProductionDatabaseHost(config, AdminPromotionError)

  if (config.databaseName !== PRODUCTION_DATABASE_NAME) {
    fail(
      `Refusing to promote: configured database is not ${PRODUCTION_DATABASE_NAME}.`,
      'WRONG_CONFIGURED_DATABASE',
    )
  }
  if (confirmation !== PRODUCTION_CONFIRMATION) {
    fail(`Refusing to promote: exact confirmation required; type ${PRODUCTION_CONFIRMATION}.`, 'CONFIRMATION_REQUIRED')
  }
  if (normalizedEmail(email) !== APPROVED_EMAIL) {
    fail('Refusing to promote: the supplied email is not the approved production account.', 'TARGET_EMAIL_NOT_ALLOWED')
  }

  const connectedRows = await databaseStep('verify-connected-database', () => prisma.$queryRaw`SELECT current_database() AS database_name`)
  if (connectedRows[0]?.database_name !== PRODUCTION_DATABASE_NAME) {
    fail(`Refusing to promote: connected database is not ${PRODUCTION_DATABASE_NAME}.`, 'WRONG_CONNECTED_DATABASE')
  }

  const initialAccount = await databaseStep('fetch-target-account', () => prisma.user.findUnique({
    where: { email: APPROVED_EMAIL },
    select: { id: true, name: true, email: true, passwordHash: true, role: true, status: true, providerProfile: true },
  }))
  if (!initialAccount) fail('The target account was not found; no records changed.', 'TARGET_ACCOUNT_NOT_FOUND')
  if (initialAccount.status !== 'ACTIVE') fail('The target account is not active; no records changed.', 'TARGET_ACCOUNT_NOT_ACTIVE')
  if (initialAccount.role !== 'CUSTOMER') fail('The target account is not a customer; no records changed.', 'TARGET_ACCOUNT_NOT_CUSTOMER')
  if (!(await verifyPassword(password, initialAccount.passwordHash))) {
    fail('The supplied password is incorrect; no records changed.', 'INVALID_PASSWORD')
  }

  try {
    await prisma.$transaction(async (tx) => {
      await databaseStep(
        'acquire-advisory-lock',
        () => tx.$queryRaw`SELECT 1::int AS lock_acquired FROM (SELECT pg_advisory_xact_lock(2147483646, 1701)) AS advisory_lock`,
      )

      const existingAdmin = await databaseStep('check-existing-administrator', () => tx.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      }))
      if (existingAdmin) fail('An administrator already exists; no records changed.', 'ADMIN_EXISTS')

      const currentAccount = await databaseStep('recheck-target-account', () => tx.user.findUnique({
        where: { email: APPROVED_EMAIL },
        select: { id: true, passwordHash: true, role: true, status: true },
      }))
      assertUnchanged(initialAccount, currentAccount)

      await databaseStep('promote-target-account', () => tx.user.update({
        where: { id: initialAccount.id },
        data: { role: 'ADMIN' },
      }))
    })
  } catch (error) {
    throw databaseFailure('transaction', error)
  }

  return { promoted: true }
}
