import { logger } from '../utils/logger.js'

// Logs "METHOD /path 200 12ms". Only the path is logged, never the query string or headers,
// because those can contain tokens or personal data.
export function requestLogger() {
  return (req, res, next) => {
    const start = process.hrtime.bigint()
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6
      logger.info(`${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${ms.toFixed(0)}ms`)
    })
    next()
  }
}
