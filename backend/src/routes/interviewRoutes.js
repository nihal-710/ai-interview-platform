import { Router }   from 'express'
import { protect }  from '../middleware/authMiddleware.js'
import {
  startSession,
  getSession,
  getMySessions,
  submitResponse,
  completeSession,
  getInterviewerGesture,
} from '../controllers/interviewController.js'

const router = Router()

router.use(protect)

router.get('/',                          getMySessions)
router.post('/start',                    startSession)
router.get('/:sessionId',                getSession)
router.post('/:sessionId/respond',       submitResponse)
router.post('/:sessionId/complete',      completeSession)
router.post('/:sessionId/gesture',       getInterviewerGesture)

export default router