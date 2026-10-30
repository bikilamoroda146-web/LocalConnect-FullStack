import { logger } from '../utils/logger.js'

// Last middleware. Turns any error into the standard JSON shape:
//   { "error": { "code": "...", "message": "..." } }
// Unexpected errors are logged on the server but the client only sees a generic message
// (no stack traces, no database details).
export function errorHandler({ isProduction }) {
  // Express recognises error handlers by their four parameters; keep `next` even though it is unused.
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (res.headersSent) return next(err)

    // Errors we raised on purpose.
    if (err.name === 'AppError') {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } })
    }
    // Problems with the request body, raised by Express's JSON parser.
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } })
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' } })
    }

    logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`, isProduction ? undefined : err.stack)
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' } })
  }
}
