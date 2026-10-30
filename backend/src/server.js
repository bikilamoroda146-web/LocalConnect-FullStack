import './config/assertNodeVersion.js' // must stay first
import { loadEnv, EnvValidationError } from './config/env.js'
import { API_PREFIX } from './config/constants.js'
import { createApp } from './app.js'
import { isDatabaseUp } from './services/health.service.js'
import { logger } from './utils/logger.js'

let config
try {
  config = loadEnv()
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error('\nThe backend cannot start because the configuration is invalid:\n')
    err.problems.forEach((p) => console.error(`  - ${p}`))
    console.error('\nCopy backend/.env.example to backend/.env and fill in the values. See backend/README.md.\n')
    process.exit(1)
  }
  throw err
}

let createPrismaClient
try {
  ;({ createPrismaClient } = await import('./lib/prisma.js'))
} catch (err) {
  if (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'ERR_UNKNOWN_FILE_EXTENSION') {
    console.error('\nThe Prisma client has not been generated yet. Run:  npm run db:generate\n')
    process.exit(1)
  }
  throw err
}

const prisma = createPrismaClient(config.databaseUrl)
const app = createApp({ config, prisma })

const server = app.listen(config.port, config.host, async () => {
  logger.info(`LocalConnect API listening on http://${config.host}:${config.port}${API_PREFIX} (${config.nodeEnv})`)
  if (await isDatabaseUp(prisma, 5000)) {
    logger.info(`PostgreSQL connection OK (database "${config.databaseName}")`)
  } else {
    logger.warn('Cannot reach PostgreSQL. The server is running, but /health will report the database as "down".')
    logger.warn('Check that PostgreSQL is running and DATABASE_URL in backend/.env is correct (run: npm run db:check).')
  }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') logger.error(`Port ${config.port} is already in use. Stop the other program or change PORT in .env.`)
  else logger.error(`Server error: ${err.message}`)
  process.exit(1)
})

// Shut down cleanly (Ctrl+C, or a host stopping the process).
let shuttingDown = false
async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info(`${signal} received, shutting down...`)
  server.close(async () => {
    await prisma.$disconnect().catch(() => {})
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref() // force-exit if something hangs
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => logger.error('Unhandled promise rejection', reason instanceof Error ? reason.message : String(reason)))
