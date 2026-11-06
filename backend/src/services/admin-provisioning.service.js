import { assertProductionDatabaseHost } from './production-database.guard.js'
import { registerSchema } from '../validators/auth.js'
import { hashPassword } from './auth.service.js'

export const PRODUCTION_DATABASE_NAME = 'localconnect_app'
export const PRODUCTION_CONFIRMATION = 'CREATE ADMIN IN localconnect_app'

export class AdminProvisioningError extends Error {
  constructor(message, code = 'ADMIN_PROVISIONING_FAILED', diagnostics = {}) {
    super(message)
    this.name = 'AdminProvisioningError'
    this.code = code
    this.operation = diagnostics.operation
    this.causeCode = diagnostics.causeCode
    this.causeCategory = diagnostics.causeCategory
    this.causeType = diagnostics.causeType
    this.causeProperties = diagnostics.causeProperties
  }
}

function safeDiagnosticToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_:-]+$/.test(value) ? value : undefined
}

const SAFE_ERROR_PROPERTIES = new Set([
  'name',
  'code',
  'meta',
  'cause',
  'driverAdapterError',
  'kind',
  'originalCode',
  'originalMessage',
  'message',
])

function databaseDiagnostics(error) {
  const types = new Set()
  const properties = new Set()
  const codes = []
  const categories = []
  const queue = [error]
  const seen = new Set()

  for (let depth = 0; queue.length && depth < 12; depth += 1) {
    const current = queue.shift()
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)

    const type = safeDiagnosticToken(current.name) ?? safeDiagnosticToken(current.constructor?.name)
    if (type) types.add(type)
    for (const property of SAFE_ERROR_PROPERTIES) if (property in current) properties.add(property)

    for (const candidate of [current.code, current.originalCode]) {
      const token = safeDiagnosticToken(candidate)
      if (token) codes.push(token)
    }
    if (typeof current.kind === 'string') {
      const token = safeDiagnosticToken(current.kind)
      if (token) categories.push(token)
    }

    for (const property of ['cause', 'meta', 'driverAdapterError', 'kind']) {
      const nested = current[property]
      if (nested && typeof nested === 'object') queue.push(nested)
    }
  }

  const causeCode = codes.find((code) => !/^P\d{4}$/.test(code)) ?? codes[0] ?? 'UNKNOWN'
  const causeCategory = categories[0] ?? 'UNKNOWN'

  return {
    causeCode,
    causeCategory,
    causeType: [...types].join('|') || 'UNKNOWN',
    causeProperties: [...properties].join(',') || 'UNKNOWN',
  }
}

function databaseFailure(operation, error) {
  if (error instanceof AdminProvisioningError) return error
  if (error?.code === 'P2002') {
    return new AdminProvisioningError(
      'The administrator email already belongs to an account; no records changed.',
      'EMAIL_EXISTS',
      { operation, causeCode: 'P2002', causeCategory: 'UniqueConstraintViolation' },
    )
  }
  return new AdminProvisioningError(
    'A database operation failed. No success was confirmed.',
    'DATABASE_ERROR',
    { operation, ...databaseDiagnostics(error) },
  )
}

async function databaseStep(operation, callback) {
  try {
    return await callback()
  } catch (error) {
    throw databaseFailure(operation, error)
  }
}

function validateInput(input) {
  const parsed = registerSchema.safeParse({ ...input, role: 'CUSTOMER' })
  if (!parsed.success) throw new AdminProvisioningError('Administrator details are invalid.', 'INVALID_ADMIN_DETAILS')
  return parsed.data
}

export async function provisionProductionAdmin({ prisma, config, input, confirmation }) {
  if (!config?.isProduction) {
    throw new AdminProvisioningError(
      'Refusing to provision an administrator outside production.',
      'NON_PRODUCTION',
    )
  }

  // Always verify the expected production hostname first.
  assertProductionDatabaseHost(config, AdminProvisioningError)

  if (config.databaseName !== PRODUCTION_DATABASE_NAME) {
    throw new AdminProvisioningError(
      `Refusing to provision: configured database is not ${PRODUCTION_DATABASE_NAME}.`,
      'WRONG_CONFIGURED_DATABASE',
    )
  }
  if (confirmation !== PRODUCTION_CONFIRMATION) {
    throw new AdminProvisioningError(`Refusing to provision: exact confirmation required; type ${PRODUCTION_CONFIRMATION}.`, 'CONFIRMATION_REQUIRED')
  }

  const details = validateInput(input)
  const rows = await databaseStep('verify-connected-database', () => prisma.$queryRaw`SELECT current_database() AS database_name`)
  if (rows[0]?.database_name !== PRODUCTION_DATABASE_NAME) {
    throw new AdminProvisioningError(`Refusing to provision: connected database is not ${PRODUCTION_DATABASE_NAME}.`, 'WRONG_CONNECTED_DATABASE')
  }

  try {
    await prisma.$transaction(async (tx) => {
      await databaseStep(
        'acquire-advisory-lock',
        () => tx.$queryRaw`SELECT 1::int AS lock_acquired FROM (SELECT pg_advisory_xact_lock(2147483646, 1701)) AS advisory_lock`,
      )

      const existingAdmin = await databaseStep('check-existing-administrator', () => tx.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } }))
      if (existingAdmin) throw new AdminProvisioningError('An administrator already exists; no records changed.', 'ADMIN_EXISTS')

      const existingEmail = await databaseStep('check-existing-email', () => tx.user.findUnique({ where: { email: details.email }, select: { id: true } }))
      if (existingEmail) throw new AdminProvisioningError('The administrator email already belongs to an account; no records changed.', 'EMAIL_EXISTS')

      await databaseStep('create-administrator', async () => tx.user.create({
        data: {
          name: details.name,
          email: details.email,
          passwordHash: await hashPassword(details.password),
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      }))
    })
  } catch (error) {
    if (error instanceof AdminProvisioningError) throw error
    throw databaseFailure('transaction', error)
  }

  return { created: true }
}
