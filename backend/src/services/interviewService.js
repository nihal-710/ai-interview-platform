import { prisma }            from '../config/prisma.js'
import { generateResult }    from './resultService.js'
import { generateQuestions } from './aiService.js'

// ─────────────────────────────────────────
// CREATE SESSION — now uses AI questions
// ─────────────────────────────────────────
export const createSession = async (userId, interviewType, targetRole, difficulty = 'medium') => {
  console.log(`[INTERVIEW] Generating AI questions for ${targetRole} — ${interviewType}`)

  // Generate questions via AI (falls back to static if Ollama down)
  const aiQuestions = await generateQuestions(targetRole, interviewType, difficulty)

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      type:           interviewType,
      targetRole,
      status:         'IN_PROGRESS',
      totalQuestions: aiQuestions.length,
      questions: {
        create: aiQuestions.map((q) => ({
          content:    q.content,
          orderIndex: q.orderIndex,
          category:   q.category,
          difficulty: q.difficulty,
        })),
      },
    },
    include: {
      questions: { orderBy: { orderIndex: 'asc' } },
    },
  })

  return session
}

// ─────────────────────────────────────────
// GET SESSION BY ID
// ─────────────────────────────────────────
export const getSessionById = async (sessionId, userId) => {
  return prisma.interviewSession.findFirst({
    where:   { id: sessionId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        include: { response: true },
      },
      feedback: true,
    },
  })
}

// ─────────────────────────────────────────
// GET ALL SESSIONS FOR USER
// ─────────────────────────────────────────
export const getUserSessions = async (userId) => {
  return prisma.interviewSession.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      questions: { select: { id: true } },
      feedback:  true,
    },
  })
}

// ─────────────────────────────────────────
// SUBMIT RESPONSE
// ─────────────────────────────────────────
export const submitResponse = async (sessionId, questionId, userId, answer, timeTaken) => {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId, status: 'IN_PROGRESS' },
  })
  if (!session) return null

  const response = await prisma.response.upsert({
    where:  { questionId },
    update: { answer, timeTaken, updatedAt: new Date() },
    create: { questionId, answer, timeTaken },
  })

  const answeredCount = await prisma.response.count({
    where: { question: { sessionId } },
  })

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data:  { answeredCount },
  })

  return response
}

// ─────────────────────────────────────────
// COMPLETE SESSION
// ─────────────────────────────────────────
export const completeSession = async (sessionId, userId) => {
  const session = await prisma.interviewSession.findFirst({
    where:   { id: sessionId, userId },
    include: { questions: { include: { response: true } } },
  })
  if (!session) return null

  const answered = session.questions.filter((q) => q.response).length
  const score    = Math.round((answered / session.questions.length) * 100)

  await prisma.feedback.upsert({
    where:  { sessionId },
    update: {},
    create: {
      sessionId,
      strengths:    ['Completed the interview session'],
      improvements: ['Review your answers and practice regularly'],
      summary:      `Completed ${answered}/${session.questions.length} questions.`,
    },
  })

  const completed = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status:       'COMPLETED',
      overallScore: score,
      completedAt:  new Date(),
    },
    include: {
      questions: { include: { response: true } },
      feedback:  true,
    },
  })

  // Auto-generate AI result
  await generateResult(sessionId, userId)

  return completed
}