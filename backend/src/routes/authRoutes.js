import { Router }            from 'express'
import { register, login, getMe } from '../controllers/authController.js'
import { protect }           from '../middleware/authMiddleware.js'

const router = Router()

// Public routes
router.post('/register', register)
router.post('/login',    login)

// Protected route — requires valid JWT
router.get('/me', protect, getMe)

export default router