// Usage: npm run db:check
// Tests the connection to PostgreSQL using DATABASE_URL from backend/.env and explains common problems.
// It only READS (SELECT) and never changes data.
import '../src/config/assertNodeVersion.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv, EnvValidationError } from '../src/config/env.js'

function safeDiagnosticToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_:-]+$/.test(value) ? value : undefined
}

export function findDatabaseDiagnostic(error) {
  const codes = []
  const categories = []
  const types = new Set()
  const queue = [error]
  const seen = new Set()

  for (let depth = 0; queue.length && depth < 12; depth += 1) {
    const current = queue.shift()
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)

    const type = safeDiagnosticToken(current.name) ?? safeDiagnosticToken(current.constructor?.name)
    if (type && type !== 'Object') types.add(type)

    for (const candidate of [current.originalCode, current.code]) {
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

  return {
    code: codes.find((code) => !/^P\d{4}$/.test(code)) ?? codes[0] ?? 'UNKNOWN',
    category: categories[0] ?? 'UNKNOWN',
    type: [...types].join('|') || 'UNKNOWN',
  }
}

const hints = {
  DatabaseNotReachable: 'The database host or port could not be reached.',
  AuthenticationFailed: 'PostgreSQL rejected the supplied authentication.',
  DatabaseDoesNotExist: 'The configured database does not exist.',
  TlsConnectionError: 'TLS negotiation failed.',
  ECONNREFUSED: 'The database host or port refused the connection.',
  ENOTFOUND: 'The database host name could not be resolved.',
  ETIMEDOUT: 'The database connection timed out.',
  '28P01': 'PostgreSQL rejected the supplied authentication.',
  '28000': 'PostgreSQL rejected the supplied authentication.',
  '3D000': 'The configured database does not exist.',
  '42501': 'The database user lacks the required permission.',
}

export async function runCheck({ load = loadEnv, createClient } = {}) {
  let config
  try {
    config = load()
  } catch (err) {
    if (err instanceof EnvValidationError) {
      console.error('\nConfiguration problem:\n')
      err.problems.forEach((problem) => console.error(`  - ${problem}`))
      console.error('\nCreate backend/.env from backend/.env.example first (see README).\n')
      return 1
    }
    throw err
  }

  let createPrismaClient = createClient
  if (!createPrismaClient) {
    try {
      ;({ createPrismaClient } = await import('../src/lib/prisma.js'))
    } catch {
      console.error('\nThe Prisma client has not been generated yet. Run:  npm run db:generate\n')
      return 1
    }
  }

  console.log('DEBUG: Creating Prisma client')

const prisma = createPrismaClient(config.databaseUrl)

console.log('DEBUG: Prisma client initialized')
  
  try {
    console.log('DEBUG: Starting database query')

const [info] = await prisma.$queryRaw`
  SELECT current_database() AS db,
         current_user AS usr,
         version() AS version
`

console.log('DEBUG: Database query completed')
    console.log('\nPostgreSQL connection OK')
    console.log(`  database : ${info.db}`)
    console.log(`  user     : ${info.usr}`)
    console.log(`  server   : ${String(info.version).split(',')[0]}\n`)
    return 0
  } catch (err) {
    const diagnostic = findDatabaseDiagnostic(err)
    console.error('\nCould not connect to PostgreSQL.')
    console.error(`  database : ${config.databaseName}`)
    console.error(`  category : ${diagnostic.category}`)
    console.error(`  code     : ${diagnostic.code}`)
    console.error(`  error    : ${diagnostic.type}`)
    console.error(`  hint     : ${hints[diagnostic.category] ?? hints[diagnostic.code] ?? 'Check the PostgreSQL connection settings.'}\n`)
    return 1
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCheck()
}
