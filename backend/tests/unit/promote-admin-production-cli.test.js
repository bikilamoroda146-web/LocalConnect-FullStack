import path from 'node:path'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class MockAdminPromotionError extends Error {
    constructor(message, code) {
      super(message)
      this.code = code
    }
  }

  return {
    AdminPromotionError: MockAdminPromotionError,
    askHidden: vi.fn(),
    createInterface: vi.fn(),
    createPrismaClient: vi.fn(),
    loadEnv: vi.fn(),
    promoteProductionAdmin: vi.fn(),
    prisma: { $disconnect: vi.fn() },
    readlineAnswers: [],
  }
})

vi.mock('node:readline', () => ({
  default: { createInterface: mocks.createInterface },
}))

vi.mock('../../scripts/provision-admin-production.js', () => ({
  askHidden: mocks.askHidden,
}))

vi.mock('../../src/config/env.js', () => ({
  loadEnv: mocks.loadEnv,
}))

vi.mock('../../src/lib/prisma.js', () => ({
  createPrismaClient: mocks.createPrismaClient,
}))

vi.mock('../../src/services/admin-promotion.service.js', () => ({
  AdminPromotionError: mocks.AdminPromotionError,
  PRODUCTION_CONFIRMATION: 'CREATE ADMIN IN localconnect_app',
  promoteProductionAdmin: mocks.promoteProductionAdmin,
}))

const config = {
  isProduction: true,
  databaseName: 'localconnect_app',
  databaseUrl: 'postgresql://not-used.example.invalid/localconnect_app',
}
const confirmation = 'CREATE ADMIN IN localconnect_app'

let stdinDescriptor
let stdoutDescriptor
let originalArgv1
let logSpy
let errorSpy

function setInteractive(value) {
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value })
  Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value })
}

function queueConfirmation(answer = confirmation) {
  mocks.readlineAnswers.push(answer)
  mocks.createInterface.mockImplementation(() => ({
    question: (_prompt, callback) => callback(mocks.readlineAnswers.shift()),
    close: vi.fn(),
  }))
}

beforeEach(() => {
  originalArgv1 = process.argv[1]
  stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY')
  setInteractive(true)
  mocks.readlineAnswers.length = 0
  mocks.loadEnv.mockReturnValue(config)
  mocks.createPrismaClient.mockReturnValue(mocks.prisma)
  mocks.prisma.$disconnect.mockResolvedValue(undefined)
  mocks.askHidden.mockResolvedValue(`test-password-${Date.now()}`)
  mocks.promoteProductionAdmin.mockResolvedValue({ promoted: true })
  queueConfirmation()
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  logSpy.mockRestore()
  errorSpy.mockRestore()
  if (stdinDescriptor) Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor)
  else delete process.stdin.isTTY
  if (stdoutDescriptor) Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor)
  else delete process.stdout.isTTY
  process.argv[1] = originalArgv1
  process.exitCode = undefined
  vi.clearAllMocks()
})

describe('production administrator promotion CLI', () => {
  it('does not execute when imported', async () => {
    await import('../../scripts/promote-admin-production.js')

    expect(mocks.loadEnv).not.toHaveBeenCalled()
    expect(mocks.createPrismaClient).not.toHaveBeenCalled()
    expect(mocks.promoteProductionAdmin).not.toHaveBeenCalled()
  })

  it('uses the fixed approved email, exact confirmation, and hidden password input', async () => {
    const password = `test-password-${Date.now()}`
    mocks.askHidden.mockResolvedValue(password)
    const { run } = await import('../../scripts/promote-admin-production.js')

    await run()

    expect(mocks.askHidden).toHaveBeenCalledWith('Existing account password: ')
    expect(mocks.promoteProductionAdmin).toHaveBeenCalledWith({
      prisma: mocks.prisma,
      config,
      email: 'bikilamoroda146@gmail.com',
      password,
      confirmation,
    })
    expect(logSpy.mock.calls.flat().join(' ')).not.toContain(password)
  })

  it('disconnects Prisma after successful promotion', async () => {
    const { run } = await import('../../scripts/promote-admin-production.js')

    await run()

    expect(mocks.prisma.$disconnect).toHaveBeenCalledTimes(1)
  })

  it('disconnects Prisma when promotion fails', async () => {
    const failure = new Error('private promotion failure')
    mocks.promoteProductionAdmin.mockRejectedValue(failure)
    const { run } = await import('../../scripts/promote-admin-production.js')

    await expect(run()).rejects.toBe(failure)
    expect(mocks.prisma.$disconnect).toHaveBeenCalledTimes(1)
  })

  it('does not expose passwords or connection strings in direct-execution errors', async () => {
    const password = `test-password-${Date.now()}`
    const connectionString = 'postgresql://secret-user:secret-password@db.example.invalid/localconnect_app'
    mocks.askHidden.mockResolvedValue(password)
    mocks.promoteProductionAdmin.mockRejectedValue(new Error(`${password} ${connectionString}`))
    process.argv[1] = path.resolve('scripts/promote-admin-production.js')

    await import('../../scripts/promote-admin-production.js?safe-error-case')
    await new Promise((resolve) => setImmediate(resolve))

    expect(errorSpy).toHaveBeenCalledWith('Administrator promotion aborted. No success was confirmed.')
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(password)
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(connectionString)
  })

  it('refuses non-interactive execution before creating Prisma', async () => {
    setInteractive(false)
    const { run } = await import('../../scripts/promote-admin-production.js')

    await expect(run()).rejects.toMatchObject({ code: 'INTERACTIVE_TERMINAL_REQUIRED' })
    expect(mocks.createPrismaClient).not.toHaveBeenCalled()
    expect(mocks.promoteProductionAdmin).not.toHaveBeenCalled()
  })
})
