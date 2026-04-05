import { Router }  from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getSummary,
  getHistory,
  getTrend,
  getSkills,
} from '../controllers/dashboardController.js'

const router = Router()

router.use(protect)

router.get('/summary', getSummary)
router.get('/history', getHistory)
router.get('/trend',   getTrend)
router.get('/skills',  getSkills)

export default router