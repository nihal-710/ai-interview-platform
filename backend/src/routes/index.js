import { Router }      from 'express'
import healthRoutes    from './healthRoutes.js'
import authRoutes      from './authRoutes.js'
import interviewRoutes from './interviewRoutes.js'

const router = Router()

router.use('/health',    healthRoutes)
router.use('/auth',      authRoutes)
router.use('/interview', interviewRoutes)

export default router