export function assertProductionDatabaseHost(config, ErrorClass) {
  const expectedHost = config?.productionDatabaseHost?.trim().toLowerCase()
  const actualHost = config?.databaseHost?.trim().toLowerCase()

  if (!expectedHost) {
    throw new ErrorClass(
      'Refusing operation: expected production database hostname is not configured.',
      'PRODUCTION_DATABASE_HOST_NOT_CONFIGURED',
    )
  }

  if (!actualHost || actualHost !== expectedHost) {
    throw new ErrorClass(
      'Refusing operation: configured database hostname does not match the expected production hostname.',
      'WRONG_PRODUCTION_DATABASE_HOST',
    )
  }
}