import { loadEnv } from '../src/config/env.js'
import { createPrismaClient } from '../src/lib/prisma.js'

const EXPECTED_DATABASE = 'localconnect_dev'
const SAMPLE_EMAIL = 'seed.provider@localconnect.dev'
const SAMPLE_SERVICE_TITLE = 'Development Sample Home Repair'

// This is a derived development-only placeholder, not a usable application password.
// Authentication is not implemented in this milestone.
const SAMPLE_PASSWORD_HASH = 'scrypt$N=16384,r=8,p=1$localconnect-dev-seed-salt$76fc7166a98cdddca29b1eed896eb3af0a56a7b9c2348e2637a17c0c9f6cfa3a6054363ff5a24419535ec682ae04977ac927981d8f9fbb6dc31c0a79dcb875de'

async function verifyDevelopmentDatabase(prisma, config) {
  if (config.isProduction) throw new Error('Refusing to seed: NODE_ENV is production.')
  if (config.databaseName !== EXPECTED_DATABASE) {
    throw new Error(`Refusing to seed: configured database is not ${EXPECTED_DATABASE}.`)
  }

  const rows = await prisma.$queryRaw`SELECT current_database() AS database_name`
  const actualDatabase = rows[0]?.database_name
  if (actualDatabase !== EXPECTED_DATABASE) {
    throw new Error(`Refusing to seed: connected database is not ${EXPECTED_DATABASE}.`)
  }
}

async function seed() {
  const config = loadEnv()
  const prisma = createPrismaClient(config.databaseUrl)

  try {
    await verifyDevelopmentDatabase(prisma, config)

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: SAMPLE_EMAIL },
        include: { providerProfile: { include: { services: true } } },
      })

      if (existing) {
        const matchingService = existing.providerProfile?.services.find((service) => service.title === SAMPLE_SERVICE_TITLE)
        const isComplete = existing.role === 'PROVIDER' &&
          existing.status === 'ACTIVE' &&
          existing.providerProfile &&
          matchingService?.published === true

        if (isComplete) return { created: false, serviceId: matchingService.id }
        throw new Error('Refusing to seed: the sample email already belongs to a different or incomplete record.')
      }

      const user = await tx.user.create({
        data: {
          name: 'LocalConnect Development Provider',
          email: SAMPLE_EMAIL,
          passwordHash: SAMPLE_PASSWORD_HASH,
          role: 'PROVIDER',
          status: 'ACTIVE',
          area: 'Development Area',
        },
      })

      const provider = await tx.providerProfile.create({
        data: {
          userId: user.id,
          profession: 'Home Repair Specialist',
          category: 'home-repairs',
          area: 'Development Area',
          years: 5,
          bio: 'Sample provider used for local development only.',
          skills: ['General repairs', 'Maintenance'],
          verified: false,
        },
      })

      const service = await tx.service.create({
        data: {
          providerId: provider.id,
          title: SAMPLE_SERVICE_TITLE,
          category: 'home-repairs',
          area: 'Development Area',
          description: 'Sample published service used to verify the public services API.',
          price: '125.50',
          priceUnit: 'per visit',
          includes: ['Initial inspection', 'Basic maintenance advice'],
          imageKey: null,
          published: true,
        },
      })

      return { created: true, serviceId: service.id }
    })

    console.log(result.created
      ? 'Development seed created one provider and one published service.'
      : 'Development seed already exists; no records were changed.')
    console.log(`Service ID: ${result.serviceId}`)
  } finally {
    await prisma.$disconnect()
  }
}

seed().catch((error) => {
  console.error(`Development seed aborted: ${error.message}`)
  process.exitCode = 1
})
