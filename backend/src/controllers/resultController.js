import * as resultService from '../services/resultService.js'
import { sendSuccess, sendError } from '../utils/response.js'

// ─────────────────────────────────────────
// POST /api/results/generate/:sessionId
// ─────────────────────────────────────────
export const generateResult = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId        = req.user.id

    const result = await resultService.generateResult(sessionId, userId)

    if (!result) {
      return sendError(res, 404, 'Session not found or does not belong to you.')
    }

    return sendSuccess(res, 201, 'Result generated successfully.', { result })

  } catch (error) {
    console.error('[GENERATE RESULT ERROR]', error)
    return sendError(res, 500, 'Failed to generate result.')
  }
}

// ─────────────────────────────────────────
// GET /api/results/:sessionId
// ─────────────────────────────────────────
export const getResult = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId        = req.user.id

    const result = await resultService.getResultBySession(sessionId, userId)

    if (!result) {
      return sendError(res, 404, 'Result not found. Generate it first.')
    }

    return sendSuccess(res, 200, 'Result fetched.', { result })

  } catch (error) {
    console.error('[GET RESULT ERROR]', error)
    return sendError(res, 500, 'Failed to fetch result.')
  }
}

// ─────────────────────────────────────────
// GET /api/results/user/history
// ─────────────────────────────────────────
export const getUserHistory = async (req, res) => {
  try {
    const results = await resultService.getUserResultHistory(req.user.id)
    return sendSuccess(res, 200, 'Result history fetched.', { results })

  } catch (error) {
    console.error('[GET HISTORY ERROR]', error)
    return sendError(res, 500, 'Failed to fetch result history.')
  }
}