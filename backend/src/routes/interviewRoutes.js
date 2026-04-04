import { Router }          from 'express'
import { protect }         from '../middleware/authMiddleware.js'
import {
  startSession,
  getSession,
  getMySessions,
  submitResponse,
  completeSession,
} from '../controllers/interviewController.js'

const router = Router()

// All interview routes require authentication
router.use(protect)

router.get('/',                        getMySessions)
router.post('/start',                  startSession)
router.get('/:sessionId',              getSession)
router.post('/:sessionId/respond',     submitResponse)
router.post('/:sessionId/complete',    completeSession)

export default router