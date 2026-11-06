import { PrismaPg } from '@prisma/adapter-pg'
// The Prisma client is generated into backend/generated/ by `npm run db:generate`.
// (Prisma 7 requires a "driver adapter"; here the standard PostgreSQL driver `pg`.)
import { PrismaClient } from '../../generated/prisma/client.ts'

export function createPrismaClient(databaseUrl) {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 30000, // fail in 5s instead of hanging if PostgreSQL is unreachable
  })
  return new PrismaClient({ adapter })
}
