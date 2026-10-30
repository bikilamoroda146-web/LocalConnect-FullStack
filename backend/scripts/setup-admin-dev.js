import { loadEnv } from '../src/config/env.js'
import { createPrismaClient } from '../src/lib/prisma.js'
import { hashPassword } from '../src/services/auth.service.js'

async function setup() {
  const config = loadEnv()
  if (config.isProduction) throw new Error('Refusing to create an administrator in production.')
  if (!config.devAdminEmail || !config.devAdminPassword || !config.devAdminName) {
    throw new Error('Set DEV_ADMIN_NAME, DEV_ADMIN_EMAIL, and DEV_ADMIN_PASSWORD in backend/.env first.')
  }
  const prisma = createPrismaClient(config.databaseUrl)
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, email: true } })
    if (existingAdmin) {
      console.log(`Administrator already exists (${existingAdmin.email}); no records changed.`)
      return
    }
    const existingEmail = await prisma.user.findUnique({ where: { email: config.devAdminEmail }, select: { id: true } })
    if (existingEmail) throw new Error('DEV_ADMIN_EMAIL already belongs to a non-administrator account; no records changed.')
    await prisma.user.create({ data: { name: config.devAdminName, email: config.devAdminEmail, passwordHash: await hashPassword(config.devAdminPassword), role: 'ADMIN', status: 'ACTIVE' } })
    console.log(`Development administrator created for ${config.devAdminEmail}.`)
  } finally { await prisma.$disconnect() }
}

setup().catch((error) => { console.error(`Development administrator setup aborted: ${error.message}`); process.exitCode = 1 })
