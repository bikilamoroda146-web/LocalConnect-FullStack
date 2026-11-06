import { describe, expect, it } from 'vitest'
import { findDatabaseDiagnostic } from '../../scripts/check-db.js'

describe('database check diagnostics', () => {
  it('extracts the PostgreSQL code and category from Prisma adapter errors', () => {
    const postgresError = new Error('private PostgreSQL message')
    postgresError.originalCode = '08006'
    postgresError.kind = 'postgres'
    const prismaError = new Error('private Prisma message', { cause: postgresError })
    prismaError.code = 'P2010'
    prismaError.meta = { driverAdapterError: { cause: postgresError } }

    expect(findDatabaseDiagnostic(prismaError)).toMatchObject({ code: '08006', category: 'postgres', type: 'Error' })
  })

  it('extracts mapped connection categories when no PostgreSQL code exists', () => {
    const error = new Error('private connection message')
    error.meta = { driverAdapterError: { cause: { kind: 'TlsConnectionError' } } }

    expect(findDatabaseDiagnostic(error)).toMatchObject({ code: 'UNKNOWN', category: 'TlsConnectionError' })
  })

  it('falls back safely for missing, circular, and unknown errors', () => {
    expect(findDatabaseDiagnostic(new Error('private message'))).toMatchObject({
      code: 'UNKNOWN',
      category: 'UNKNOWN',
      type: 'Error',
    })

    const first = new Error('private first')
    const second = new Error('private second')
    second.code = '57P01'
    second.kind = 'postgres'
    first.cause = second
    second.cause = first
    expect(findDatabaseDiagnostic(first)).toMatchObject({ code: '57P01', category: 'postgres' })

    expect(findDatabaseDiagnostic({ privateValue: 'must not be printed' })).toMatchObject({
      code: 'UNKNOWN',
      category: 'UNKNOWN',
      type: 'UNKNOWN',
    })
  })
})
