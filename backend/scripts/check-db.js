// Usage: npm run db:check
// Tests the connection to PostgreSQL using DATABASE_URL from backend/.env and explains common problems.
// It only READS (SELECT) and never changes data.
import '../src/config/assertNodeVersion.js'
import { loadEnv, EnvValidationError } from '../src/config/env.js'

let config
try {
  config = loadEnv()
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error('\nConfiguration problem:\n')
    err.problems.forEach((p) => console.error(`  - ${p}`))
    console.error('\nCreate backend/.env from backend/.env.example first (see README).\n')
    process.exit(1)
  }
  throw err
}

let createPrismaClient
try {
  ;({ createPrismaClient } = await import('../src/lib/prisma.js'))
} catch {
  console.error('\nThe Prisma client has not been generated yet. Run:  npm run db:generate\n')
  process.exit(1)
}

// Prisma wraps the real PostgreSQL problem. The useful part is in meta.driverAdapterError.cause
// (a PostgreSQL code like 28P01, or a "kind" like DatabaseNotReachable). Fall back to plain Node error codes.
function findCode(err) {
  const cause = err?.meta?.driverAdapterError?.cause
  if (cause?.originalCode) return String(cause.originalCode)
  if (cause?.kind) return String(cause.kind)
  for (let e = err, i = 0; e && i < 5; e = e.cause, i++) if (e.code && !/^P\d{4}$/.test(String(e.code))) return String(e.code)
  return ''
}

const hints = {
  DatabaseNotReachable: 'Nothing is listening on that host/port. Is PostgreSQL running? Is the port in DATABASE_URL correct (default 5432)?',
  AuthenticationFailed: 'PostgreSQL rejected the user name or password in DATABASE_URL.',
  DatabaseDoesNotExist: `The database "${config.databaseName}" does not exist yet. Create it first (see README, "Create the databases").`,
  ECONNREFUSED: 'Nothing is listening on that host/port. Is PostgreSQL running? Is the port in DATABASE_URL correct (default 5432)?',
  ENOTFOUND: 'The host name in DATABASE_URL could not be found. For a local database use "localhost".',
  ETIMEDOUT: 'The connection timed out. Is PostgreSQL running and reachable?',
  '28P01': 'PostgreSQL rejected the user name or password in DATABASE_URL.',
  '28000': 'PostgreSQL rejected the user name or password in DATABASE_URL.',
  '3D000': `The database "${config.databaseName}" does not exist yet. Create it first (see README, "Create the databases").`,
  '42501': 'The database user does not have permission to use this database.',
}

const prisma = createPrismaClient(config.databaseUrl)
try {
  const [info] = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS usr, version() AS version`
  console.log('\nPostgreSQL connection OK')
  console.log(`  database : ${info.db}`)
  console.log(`  user     : ${info.usr}`)
  console.log(`  server   : ${String(info.version).split(',')[0]}\n`)
} catch (err) {
  const code = findCode(err)
  console.error('\nCould not connect to PostgreSQL.')
  console.error(`  database : ${config.databaseName}`)
  if (code) console.error(`  code     : ${code}`)
  console.error(`  hint     : ${hints[code] ?? 'Check that PostgreSQL is running and that DATABASE_URL in backend/.env is correct.'}\n`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect().catch(() => {})
}
