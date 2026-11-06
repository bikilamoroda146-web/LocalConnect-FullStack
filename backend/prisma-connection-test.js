import './src/config/assertNodeVersion.js'
import { loadEnv } from './src/config/env.js'

const config = loadEnv()

const { createPrismaClient } = await import('./src/lib/prisma.js')

const prisma = createPrismaClient(config.databaseUrl)

try {
  console.log('Testing Prisma connection with db:check startup...')

  const result = await prisma.$queryRaw`
    SELECT
      current_database() AS db,
      current_user AS usr,
      version() AS version
  `

  console.log('Connection successful!')
  console.log(result)
} catch (error) {
  console.log('Connection failed.')

  let current = error
  const seen = new Set()

  for (let i = 0; current && i < 8; i++) {
    if (seen.has(current)) break
    seen.add(current)

    console.log(`\nError level ${i + 1}:`)
    console.log('Name:', current.name)
    console.log('Code:', current.code)
    console.log('System call:', current.syscall)
    console.log('Address:', current.address)
    console.log('Port:', current.port)

    current =
      current.cause ??
      current.driverAdapterError ??
      current.originalError
  }
}