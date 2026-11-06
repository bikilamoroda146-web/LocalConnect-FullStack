import readline from 'node:readline'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from '../src/config/env.js'
import { createPrismaClient } from '../src/lib/prisma.js'
import { AdminPromotionError, PRODUCTION_CONFIRMATION, promoteProductionAdmin } from '../src/services/admin-promotion.service.js'
import { askHidden } from './provision-admin-production.js'

const APPROVED_EMAIL = 'bikilamoroda146@gmail.com'

function askLine(question, input = process.stdin, output = process.stdout) {
  const rl = readline.createInterface({ input, output })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function run() {
  const config = loadEnv()
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new AdminPromotionError('This command must be run from an interactive terminal.', 'INTERACTIVE_TERMINAL_REQUIRED')
  }

  console.log(`Promoting ${APPROVED_EMAIL} in ${config.databaseName}.`)
  const password = await askHidden('Existing account password: ')
  console.log(`Type ${PRODUCTION_CONFIRMATION} to continue.`)
  const confirmation = await askLine('Confirmation: ')

  const prisma = createPrismaClient(config.databaseUrl)
  try {
    await promoteProductionAdmin({
      prisma,
      config,
      email: APPROVED_EMAIL,
      password,
      confirmation,
    })
    console.log('Production administrator promoted successfully.')
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    if (error instanceof AdminPromotionError) {
      console.error(`Administrator promotion aborted: ${error.message}`)
    } else {
      console.error('Administrator promotion aborted. No success was confirmed.')
    }
    process.exitCode = 1
  })
}

export { askLine, run }
