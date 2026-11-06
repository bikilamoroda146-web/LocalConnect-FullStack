import readline from 'node:readline'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from '../src/config/env.js'
import { createPrismaClient } from '../src/lib/prisma.js'
import { AdminProvisioningError, provisionProductionAdmin } from '../src/services/admin-provisioning.service.js'

function askLine(question, input = process.stdin, output = process.stdout) {
  const rl = readline.createInterface({ input, output })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

function askHidden(question, input = process.stdin, output = process.stdout) {
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new AdminProvisioningError('A real interactive terminal is required for the hidden password prompt.', 'INTERACTIVE_TERMINAL_REQUIRED')
  }

  return new Promise((resolve, reject) => {
    let password = ''
    let cleaned = false

    const cleanup = () => {
      if (cleaned) return
      cleaned = true

      let restoreError
      try {
        input.setRawMode(false)
      } catch (error) {
        restoreError = error
      } finally {
        try {
          input.pause()
        } finally {
          input.removeListener('data', onData)
        }
      }

      if (restoreError) throw restoreError
    }

    const rejectAfterCleanup = (error) => {
      try { cleanup() } catch {}
      password = ''
      reject(error)
    }

    const onData = (chunk) => {
      try {
        for (const character of String(chunk)) {
          if (character === '\u0003') {
            cleanup()
            password = ''
            reject(new AdminProvisioningError('Provisioning cancelled.', 'CANCELLED'))
            return
          }
          if (character === '\r' || character === '\n') {
            cleanup()
            output.write('\n')
            const result = password
            password = ''
            resolve(result)
            return
          }
          if (character === '\u007f' || character === '\b') {
            password = password.slice(0, -1)
            continue
          }
          password += character
        }
      } catch (error) {
        rejectAfterCleanup(error)
      }
    }

    try {
      output.write(question)
      input.setRawMode(true)
      input.resume()
      input.on('data', onData)
    } catch (error) {
      rejectAfterCleanup(error)
    }
  })
}

async function run() {
  const config = loadEnv()
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new AdminProvisioningError('This command must be run from an interactive terminal.', 'INTERACTIVE_TERMINAL_REQUIRED')
  }

  const name = await askLine('Administrator name: ')
  const email = await askLine('Administrator email: ')
  const password = await askHidden('Administrator password: ')
  const confirmation = await askLine('Type CREATE ADMIN IN localconnect_app to continue: ')

  const prisma = createPrismaClient(config.databaseUrl)
  try {
    await provisionProductionAdmin({ prisma, config, input: { name, email, password }, confirmation })
    console.log('Production administrator created successfully.')
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    if (error instanceof AdminProvisioningError) {
      const details = [
        error.operation && `operation=${error.operation}`,
        error.causeCategory && `databaseCategory=${error.causeCategory}`,
        error.causeCode && `databaseCode=${error.causeCode}`,
        error.causeType && `databaseErrorType=${error.causeType}`,
        error.causeProperties && `databaseErrorProperties=${error.causeProperties}`,
      ].filter(Boolean)
      console.error(`Administrator provisioning aborted: ${error.message}${details.length ? ` [${details.join(', ')}]` : ''}`)
    } else {
      console.error('Administrator provisioning aborted. No success was confirmed.')
    }
    process.exitCode = 1
  })
}

export { askHidden }
