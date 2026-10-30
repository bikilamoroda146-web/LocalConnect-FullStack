import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { API_PREFIX } from './config/constants.js'
import { apiRoutes } from './routes/index.js'
import { requestLogger } from './middleware/requestLogger.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

// Builds the Express app WITHOUT starting a server, so tests can use it directly.
// `config` comes from parseEnv(); `prisma` is the database client (tests may pass a fake one).
export function createApp({ config, prisma }) {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet()) // standard security headers
  app.use(
    cors({
      // Only the frontend origins listed in CORS_ORIGINS may call the API from a browser.
      // Requests with no Origin header (curl, server-to-server, same-origin via the Vite proxy) are fine.
      origin: (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin)),
      credentials: true, // needed later so the browser can send the session cookie
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '100kb' })) // small body limit; file uploads get their own rules later
  if (!config.isTest) app.use(requestLogger())

  app.use(API_PREFIX, apiRoutes({ config, prisma }))

  app.use(notFound)
  app.use(errorHandler({ isProduction: config.isProduction }))
  return app
}
