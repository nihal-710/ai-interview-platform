import { sendSuccess, sendError } from '../utils/response.js'
import { prisma }                 from '../config/prisma.js'
import { checkOllamaHealth }      from '../services/aiService.js'

export const getHealth = (req, res) => {
  sendSuccess(res, 200, 'Server is healthy', {
    status:    'ok',
    env:       process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
  })
}

export const getReadiness = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const ai = await checkOllamaHealth()

    sendSuccess(res, 200, 'Server is ready', {
      status:   'ready',
      services: {
        database:  'connected',
        aiService: ai.available ? `connected — models: ${ai.models.join(', ')}` : 'unavailable (fallback active)',
      },
    })
  } catch (error) {
    sendError(res, 503, 'Database not reachable', { database: error.message })
  }
}