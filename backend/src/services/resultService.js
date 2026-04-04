import { prisma }       from '../config/prisma.js'
import { scoreSession } from './scoringService.js'

// ─────────────────────────────────────────
// GENERATE RESULT
// ─────────────────────────────────────────
export const generateResult = async (sessionId, userId) => {
  // 1. Fetch full session with questions and responses
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        include: { response: true },
      },
    },
  })

  if (!session) return null

  // 2. Run scoring engine
  const scored = scoreSession(session)

  // 3. Save result to DB (upsert — safe to regenerate)
  const result = await prisma.result.upsert({
    where:  { sessionId },
    update: {
      overallScore:      scored.overallScore,
      completionScore:   scored.completionScore,
      answerLengthScore: scored.answerLengthScore,
      keywordScore:      scored.keywordScore,
      questionScores:    scored.questionScores,
      strengthAreas:     scored.strengthAreas,
      improvementAreas:  scored.improvementAreas,
      sessionSummary:    scored.sessionSummary,
      totalQuestions:    scored.totalQuestions,
      answeredQuestions: scored.answeredQuestions,
      scoringVersion:    scored.scoringVersion,
      updatedAt:         new Date(),
    },
    create: {
      sessionId,
      userId,
      overallScore:      scored.overallScore,
      completionScore:   scored.completionScore,
      answerLengthScore: scored.answerLengthScore,
      keywordScore:      scored.keywordScore,
      questionScores:    scored.questionScores,
      strengthAreas:     scored.strengthAreas,
      improvementAreas:  scored.improvementAreas,
      sessionSummary:    scored.sessionSummary,
      totalQuestions:    scored.totalQuestions,
      answeredQuestions: scored.answeredQuestions,
      scoringVersion:    scored.scoringVersion,
    },
  })

  // 4. Update session overall score
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data:  { overallScore: scored.overallScore },
  })

  return result
}

// ─────────────────────────────────────────
// GET RESULT BY SESSION
// ─────────────────────────────────────────
export const getResultBySession = async (sessionId, userId) => {
  const result = await prisma.result.findFirst({
    where: {
      sessionId,
      userId,
    },
    include: {
      session: {
        select: {
          type:        true,
          targetRole:  true,
          status:      true,
          createdAt:   true,
          completedAt: true,
        },
      },
    },
  })

  return result
}

// ─────────────────────────────────────────
// GET USER RESULT HISTORY
// ─────────────────────────────────────────
export const getUserResultHistory = async (userId) => {
  return prisma.result.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      session: {
        select: {
          type:       true,
          targetRole: true,
          status:     true,
          createdAt:  true,
        },
      },
    },
  })
}