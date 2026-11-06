import { describe, expect, it } from 'vitest'
import { assertDevelopmentDatabase } from '../../scripts/setup-admin-dev.js'

describe('development administrator setup guard', () => {
  it('rejects the production database even when NODE_ENV is development', () => {
    expect(() => assertDevelopmentDatabase({
      isProduction: false,
      databaseName: 'localconnect_app',
      databaseHost: 'production.example',
      productionDatabaseHost: 'production.example',
    })).toThrow(/production/i)
  })

  it('rejects production mode', () => {
    expect(() => assertDevelopmentDatabase({
      isProduction: true,
      databaseName: 'localconnect_dev',
      databaseHost: 'development.example',
      productionDatabaseHost: 'production.example',
    })).toThrow(/production/i)
  })

  it('allows a separate development database', () => {
    expect(() => assertDevelopmentDatabase({
      isProduction: false,
      databaseName: 'localconnect_dev',
      databaseHost: 'development.example',
      productionDatabaseHost: 'production.example',
    })).not.toThrow()
  })
})