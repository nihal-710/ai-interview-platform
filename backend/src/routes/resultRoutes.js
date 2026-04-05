import { Router }    from 'express'
import { protect }   from '../middleware/authMiddleware.js'
import {
  generateResult,
  getResult,
  getUserHistory,
  saveBehavioralAnalytics,
} from '../controllers/resultController.js'

const router = Router()

router.use(protect)

router.get('/user/history',             getUserHistory)
router.post('/generate/:sessionId',     generateResult)
router.post('/:sessionId/behavioral',   saveBehavioralAnalytics)
router.get('/:sessionId',              getResult)

export default router