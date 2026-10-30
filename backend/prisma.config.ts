import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma CLI settings (used by `prisma generate`, `prisma migrate`, ...).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
