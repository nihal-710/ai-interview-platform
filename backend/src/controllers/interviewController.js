import * as interviewService from '../services/interviewService.js'
import { sendSuccess, sendError } from '../utils/response.js'
import { generateInterviewerGesture } from '../services/aiService.js'

// ─────────────────────────────────────────
// POST /api/interview/start
// ─────────────────────────────────────────
export const startSession = async (req, res) => {
  try {
    const { interviewType, targetRole } = req.body
    const userId = req.user.id

    if (!interviewType || !targetRole) {
      return sendError(res, 400, 'Interview type and target role are required.')
    }

    const validTypes = ['BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'CASE_STUDY']
    if (!validTypes.includes(interviewType)) {
      return sendError(res, 400, `Invalid interview type. Must be one of: ${validTypes.join(', ')}`)
    }

    const session = await interviewService.createSession(userId, interviewType, targetRole)

    return sendSuccess(res, 201, 'Interview session started.', { session })

  } catch (error) {
    console.error('[START SESSION ERROR]', error)
    return sendError(res, 500, 'Failed to start interview session.')
  }
}

// ─────────────────────────────────────────
// GET /api/interview/:sessionId
// ─────────────────────────────────────────
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId        = req.user.id

    const session = await interviewService.getSessionById(sessionId, userId)

    if (!session) {
      return sendError(res, 404, 'Session not found.')
    }

    return sendSuccess(res, 200, 'Session fetched.', { session })

  } catch (error) {
    console.error('[GET SESSION ERROR]', error)
    return sendError(res, 500, 'Failed to fetch session.')
  }
}

// ─────────────────────────────────────────
// GET /api/interview/
// ─────────────────────────────────────────
export const getMySessions = async (req, res) => {
  try {
    const sessions = await interviewService.getUserSessions(req.user.id)
    return sendSuccess(res, 200, 'Sessions fetched.', { sessions })

  } catch (error) {
    console.error('[GET SESSIONS ERROR]', error)
    return sendError(res, 500, 'Failed to fetch sessions.')
  }
}

// ─────────────────────────────────────────
// POST /api/interview/:sessionId/respond
// ─────────────────────────────────────────
export const submitResponse = async (req, res) => {
  try {
    const { sessionId }            = req.params
    const { questionId, answer, timeTaken } = req.body
    const userId                   = req.user.id

    if (!questionId || !answer) {
      return sendError(res, 400, 'Question ID and answer are required.')
    }

    const response = await interviewService.submitResponse(
      sessionId, questionId, userId, answer, timeTaken
    )

    if (!response) {
      return sendError(res, 404, 'Session not found or already completed.')
    }

    return sendSuccess(res, 200, 'Response submitted.', { response })

  } catch (error) {
    console.error('[SUBMIT RESPONSE ERROR]', error)
    return sendError(res, 500, 'Failed to submit response.')
  }
}

// ─────────────────────────────────────────
// POST /api/interview/:sessionId/complete
// ─────────────────────────────────────────
export const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId        = req.user.id

    const session = await interviewService.completeSession(sessionId, userId)

    if (!session) {
      return sendError(res, 404, 'Session not found.')
    }

    return sendSuccess(res, 200, 'Interview session completed.', { session })

  } catch (error) {
    console.error('[COMPLETE SESSION ERROR]', error)
    return sendError(res, 500, 'Failed to complete session.')
  }
}

// ─────────────────────────────────────────
// POST /api/interview/:sessionId/gesture
// ─────────────────────────────────────────
export const getInterviewerGesture = async (req, res) => {
  try {
    const { question, answer, candidateName } = req.body

    if (!question || !answer) {
      return sendError(res, 400, 'Question and answer are required.')
    }

    const gesture = await generateInterviewerGesture(
      question,
      answer,
      candidateName || 'there'
    )

    return sendSuccess(res, 200, 'Gesture generated.', { gesture })

  } catch (error) {
    console.error('[GESTURE ERROR]', error)
    return sendError(res, 500, 'Failed to generate gesture.')
  }
}