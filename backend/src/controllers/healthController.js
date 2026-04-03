import { sendSuccess, sendError } from '../utils/response.js'
import { prisma } from '../config/prisma.js'

/**
 * GET /api/health
 * Basic liveness check
 */
export const getHealth = (req, res) => {
  sendSuccess(res, 200, 'Server is healthy', {
    status:    'ok',
    env:       process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
  })
}

/**
 * GET /api/health/ready
 * Readiness check — now actually pings the database
 */
export const getReadiness = async (req, res) => {
  try {
    // $queryRaw sends a real query to PostgreSQL to confirm connection
    await prisma.$queryRaw`SELECT 1`

    sendSuccess(res, 200, 'Server is ready', {
      status:   'ready',
      services: {
        database:  'connected',
        aiService: 'not connected yet',
      },
    })
  } catch (error) {
    sendError(res, 503, 'Database not reachable', {
      database: error.message,
    })
  }
}