import { describe, expect, it, vi } from 'vitest'
import { runAdminLockCheck } from '../../scripts/check-admin-lock.js'

const config = { databaseName: 'localconnect_app', databaseUrl: 'postgresql://unused.example.invalid/localconnect_app' }

function fakePrisma({ currentDatabase = 'localconnect_app', transactionError } = {}) {
  const lockQueries = []
  const transactionErrors = []
  const prisma = {
    lockQueries,
    transactionErrors,
    $queryRaw: vi.fn(async () => [{ database_name: currentDatabase }]),
    $transaction: vi.fn(async (callback) => {
      try {
        return await callback({
          $queryRaw: async (query) => {
            lockQueries.push(query)
            return [{ lock_acquired: 1 }]
          },
        })
      } catch (error) {
        transactionErrors.push(error)
        throw transactionError ?? error
      }
    }),
    $disconnect: vi.fn(async () => {}),
  }
  return prisma
}

describe('admin advisory-lock verification script', () => {
  it('verifies the lock query, rolls back the transaction, and disconnects Prisma', async () => {
    const prisma = fakePrisma()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      await runAdminLockCheck({ load: () => config, createClient: () => prisma })

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(prisma.lockQueries).toHaveLength(1)
      expect(prisma.lockQueries[0][0]).toContain('pg_advisory_xact_lock(2147483646, 1701)')
      expect(prisma.transactionErrors).toHaveLength(1)
      expect(prisma.transactionErrors[0].message).toBe('Rollback lock verification transaction')
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1)
      expect(log).toHaveBeenCalledWith(expect.stringContaining('transaction rolled back'))
    } finally {
      log.mockRestore()
    }
  })

  it('fails safely for a wrong connected database and still disconnects Prisma', async () => {
    const prisma = fakePrisma({ currentDatabase: 'neondb' })

    await expect(runAdminLockCheck({ load: () => config, createClient: () => prisma }))
      .rejects.toThrow('Connected database is not localconnect_app.')
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1)
  })

  it('propagates a transaction failure without exposing it through a success log', async () => {
    const prisma = fakePrisma({ transactionError: new Error('private connection string') })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      await expect(runAdminLockCheck({ load: () => config, createClient: () => prisma }))
        .rejects.toMatchObject({ message: 'private connection string' })
      expect(log).not.toHaveBeenCalled()
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1)
    } finally {
      log.mockRestore()
    }
  })
})
