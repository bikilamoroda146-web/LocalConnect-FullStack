import path from 'node:path'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class MockAdminProvisioningError extends Error {
    constructor(message, code) {
      super(message)
      this.code = code
    }
  }

  return {
    AdminProvisioningError: MockAdminProvisioningError,
    createInterface: vi.fn(),
    createPrismaClient: vi.fn(),
    loadEnv: vi.fn(),
    provisionProductionAdmin: vi.fn(),
    prisma: { $disconnect: vi.fn() },
    answers: [],
  }
})

vi.mock('node:readline', () => ({
  default: { createInterface: mocks.createInterface },
}))

vi.mock('../../src/config/env.js', () => ({
  loadEnv: mocks.loadEnv,
}))

vi.mock('../../src/lib/prisma.js', () => ({
  createPrismaClient: mocks.createPrismaClient,
}))

vi.mock('../../src/services/admin-provisioning.service.js', () => ({
  AdminProvisioningError: mocks.AdminProvisioningError,
  provisionProductionAdmin: mocks.provisionProductionAdmin,
}))

const config = {
  isProduction: true,
  databaseName: 'localconnect_app',
  databaseUrl: 'postgresql://not-used.example.invalid/localconnect_app',
}
const password = `test-password-${Date.now()}`
const confirmation = 'CREATE ADMIN IN localconnect_app'

let originalArgv1
let stdinDescriptor
let stdoutDescriptor
let inputMethods
let logSpy
let errorSpy
let stdoutWriteSpy

function setInteractive(value) {
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value })
  Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value })
}

function queueLineAnswers(...answers) {
  mocks.answers.push(...answers)
  mocks.createInterface.mockImplementation(() => ({
    question: (_prompt, callback) => callback(mocks.answers.shift()),
    close: vi.fn(),
  }))
}

function enableHiddenInput() {
  inputMethods = {
    setRawMode: process.stdin.setRawMode,
    resume: process.stdin.resume,
    pause: process.stdin.pause,
  }
  process.stdin.setRawMode = vi.fn()
  process.stdin.resume = vi.fn(() => {
    process.stdin.emit('data', password)
    process.stdin.emit('data', '\r')
  })
  process.stdin.pause = vi.fn()
}

beforeEach(() => {
  originalArgv1 = process.argv[1]
  stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY')
  setInteractive(true)
  enableHiddenInput()
  mocks.answers.length = 0
  mocks.loadEnv.mockReturnValue(config)
  mocks.createPrismaClient.mockReturnValue(mocks.prisma)
  mocks.prisma.$disconnect.mockResolvedValue(undefined)
  mocks.provisionProductionAdmin.mockResolvedValue({ created: true })
  queueLineAnswers('Production Administrator', 'admin@example.com', confirmation)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})

afterEach(() => {
  logSpy.mockRestore()
  errorSpy.mockRestore()
  stdoutWriteSpy.mockRestore()
  if (inputMethods) {
    process.stdin.setRawMode = inputMethods.setRawMode
    process.stdin.resume = inputMethods.resume
    process.stdin.pause = inputMethods.pause
  }
  if (stdinDescriptor) Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor)
  else delete process.stdin.isTTY
  if (stdoutDescriptor) Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor)
  else delete process.stdout.isTTY
  process.argv[1] = originalArgv1
  process.exitCode = undefined
  vi.clearAllMocks()
})

async function executeCli(moduleSuffix) {
  process.argv[1] = path.resolve('scripts/provision-admin-production.js')
  const imports = {
    'hidden-input-case': () => import('../../scripts/provision-admin-production.js?hidden-input-case'),
    'success-case': () => import('../../scripts/provision-admin-production.js?success-case'),
    'failure-case': () => import('../../scripts/provision-admin-production.js?failure-case'),
  }
  await imports[moduleSuffix]()
  await new Promise((resolve) => setImmediate(resolve))
}

describe('production administrator provisioning CLI lifecycle', () => {
  it('does not execute when imported', async () => {
    await import('../../scripts/provision-admin-production.js')

    expect(mocks.loadEnv).not.toHaveBeenCalled()
    expect(mocks.createPrismaClient).not.toHaveBeenCalled()
    expect(mocks.provisionProductionAdmin).not.toHaveBeenCalled()
  })

  it('uses hidden password input and passes the exact confirmation to provisioning', async () => {
    await executeCli('hidden-input-case')

    expect(process.stdin.setRawMode).toHaveBeenCalledWith(true)
    expect(process.stdin.setRawMode).toHaveBeenCalledWith(false)
    expect(mocks.provisionProductionAdmin).toHaveBeenCalledWith({
      prisma: mocks.prisma,
      config,
      input: { name: 'Production Administrator', email: 'admin@example.com', password },
      confirmation,
    })
    expect(stdoutWriteSpy.mock.calls.flat().join(' ')).not.toContain(password)
  })

  it('disconnects Prisma after successful provisioning', async () => {
    await executeCli('success-case')

    expect(mocks.prisma.$disconnect).toHaveBeenCalledTimes(1)
  })

  it('disconnects Prisma when provisioning fails', async () => {
    const failure = new Error('private provisioning failure')
    mocks.provisionProductionAdmin.mockRejectedValue(failure)
    await executeCli('failure-case')

    expect(mocks.prisma.$disconnect).toHaveBeenCalledTimes(1)
  })

  it('sanitizes direct-execution errors without exposing passwords or connection strings', async () => {
    const connectionString = 'postgresql://secret-user:secret-password@db.example.invalid/localconnect_app'
    mocks.provisionProductionAdmin.mockRejectedValue(new Error(`${password} ${connectionString}`))
    process.argv[1] = path.resolve('scripts/provision-admin-production.js')

    await import('../../scripts/provision-admin-production.js?safe-error-case')
    await new Promise((resolve) => setImmediate(resolve))

    expect(errorSpy).toHaveBeenCalledWith('Administrator provisioning aborted. No success was confirmed.')
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(password)
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(connectionString)
  })
})
