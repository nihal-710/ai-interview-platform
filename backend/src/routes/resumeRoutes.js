import { Router }        from 'express'
import { protect }       from '../middleware/authMiddleware.js'
import { uploadResume as multerUpload } from '../config/multer.js'
import {
  uploadResume,
  getLatestResume,
  getResumeHistory,
} from '../controllers/resumeController.js'

const router = Router()

router.use(protect)

router.post('/upload',  multerUpload.single('resume'), uploadResume)
router.get('/latest',   getLatestResume)
router.get('/history',  getResumeHistory)

export default router