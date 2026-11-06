// Verifies the production admin advisory-lock query without touching application records.
import '../src/config/assertNodeVersion.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from '../src/config/env.js'
import { createPrismaClient } from '../src/lib/prisma.js'

const TARGET_DATABASE = 'localconnect_app'
const ROLLBACK = new Error('Rollback lock verification transaction')

export async function runAdminLockCheck({ load = loadEnv, createClient = createPrismaClient } = {}) {
  const config = load()
  if (config.databaseName !== TARGET_DATABASE) {
    throw new Error('Configured database is not localconnect_app.')
  }

  const prisma = createClient(config.databaseUrl)
  try {
    const [database] = await prisma.$queryRaw`SELECT current_database() AS database_name`
    if (database?.database_name !== TARGET_DATABASE) {
      throw new Error('Connected database is not localconnect_app.')
    }

    let lockAcquired
    try {
      await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`SELECT 1::int AS lock_acquired FROM (SELECT pg_advisory_xact_lock(2147483646, 1701)) AS advisory_lock`
        lockAcquired = rows[0]?.lock_acquired
        if (!Number.isInteger(lockAcquired)) {
          throw new Error('Advisory-lock query did not return an integer lock_acquired value.')
        }
        // Throwing from the interactive transaction callback rolls it back and releases the xact lock.
        throw ROLLBACK
      })
    } catch (error) {
      if (error !== ROLLBACK) throw error
    }

    console.log('Admin advisory-lock query succeeded on localconnect_app; lock_acquired is an integer; transaction rolled back.')
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAdminLockCheck().catch(() => {
    console.error('Admin advisory-lock verification failed. No application records were changed.')
    process.exitCode = 1
  })
}
