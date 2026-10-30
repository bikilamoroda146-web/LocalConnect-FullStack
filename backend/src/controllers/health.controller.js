import { isDatabaseUp } from '../services/health.service.js'

export function getHealth(prisma) {
  return async (req, res) => {
    const databaseUp = await isDatabaseUp(prisma)
    res.set('Cache-Control', 'no-store')
    res.status(databaseUp ? 200 : 503).json({
      data: {
        status: databaseUp ? 'ok' : 'degraded',
        database: databaseUp ? 'up' : 'down',
        timestamp: new Date().toISOString(),
      },
    })
  }
}
