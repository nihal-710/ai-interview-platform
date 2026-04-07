import path                              from 'path'
import fs                                from 'fs'
import { prisma }                        from '../config/prisma.js'
import { extractTextFromPDF }            from '../services/resumeParserService.js'
import { analyseResume }                 from '../services/resumeAnalysisService.js'
import { sendSuccess, sendError }        from '../utils/response.js'

// ─────────────────────────────────────────
// POST /api/resume/upload
// ─────────────────────────────────────────
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No PDF file uploaded.')
    }

    const { targetRole = 'Software Engineer' } = req.body
    const userId   = req.user.id
    const filePath = req.file.path
    const fileName = req.file.originalname

    console.log(`[RESUME] Extracting text from ${fileName}...`)

    // Extract text from PDF
    let extractedText
    try {
      extractedText = await extractTextFromPDF(filePath)
    } catch (err) {
      // Clean up file on extraction failure
      fs.unlinkSync(filePath)
      return sendError(res, 422, `Could not read PDF: ${err.message}`)
    }

    console.log(`[RESUME] Analysing with AI for role: ${targetRole}...`)

    // Analyse with AI
    const analysis = await analyseResume(extractedText, targetRole)

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName,
        filePath,
        extractedText,
        targetRole,
        resumeScore:     analysis.resumeScore,
        matchedSkills:   analysis.matchedSkills,
        missingSkills:   analysis.missingSkills,
        focusAreas:      analysis.focusAreas,
        recommendations: analysis.recommendations,
      },
    })

    return sendSuccess(res, 201, 'Resume analysed successfully.', { resume })

  } catch (error) {
    console.error('[RESUME UPLOAD ERROR]', error)
    return sendError(res, 500, 'Failed to process resume.')
  }
}

// ─────────────────────────────────────────
// GET /api/resume/latest
// ─────────────────────────────────────────
export const getLatestResume = async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where:   { userId: req.user.id },
      orderBy: { uploadedAt: 'desc' },
    })

    if (!resume) {
      return sendError(res, 404, 'No resume found. Upload your resume first.')
    }

    return sendSuccess(res, 200, 'Latest resume fetched.', { resume })

  } catch (error) {
    console.error('[RESUME LATEST ERROR]', error)
    return sendError(res, 500, 'Failed to fetch resume.')
  }
}

// ─────────────────────────────────────────
// GET /api/resume/history
// ─────────────────────────────────────────
export const getResumeHistory = async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where:   { userId: req.user.id },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id:          true,
        fileName:    true,
        targetRole:  true,
        resumeScore: true,
        uploadedAt:  true,
        matchedSkills: true,
        missingSkills: true,
      },
    })

    return sendSuccess(res, 200, 'Resume history fetched.', { resumes })

  } catch (error) {
    console.error('[RESUME HISTORY ERROR]', error)
    return sendError(res, 500, 'Failed to fetch resume history.')
  }
}