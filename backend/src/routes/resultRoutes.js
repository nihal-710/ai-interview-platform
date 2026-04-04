import { Router }                              from 'express'
import { protect }                             from '../middleware/authMiddleware.js'
import { generateResult, getResult, getUserHistory } from '../controllers/resultController.js'

const router = Router()

// All result routes require authentication
router.use(protect)

// Order matters — specific routes before dynamic ones
router.get('/user/history',           getUserHistory)
router.post('/generate/:sessionId',   generateResult)
router.get('/:sessionId',             getResult)

export default router