import { prisma }                  from '../config/prisma.js'
import { getQuestionsForSession }  from '../data/questionBank.js'

// ─────────────────────────────────────────
// CREATE SESSION
// ─────────────────────────────────────────
export const createSession = async (userId, interviewType, targetRole) => {
  // 1. Get questions from bank (AI later)
  const rawQuestions = getQuestionsForSession(interviewType, targetRole, 5)

  // 2. Create session + questions in one transaction
  const session = await prisma.interviewSession.create({
    data: {
      userId,
      type:          interviewType,
      targetRole,
      status:        'IN_PROGRESS',
      totalQuestions: rawQuestions.length,
      questions: {
        create: rawQuestions.map((q) => ({
          content:    q.content,
          orderIndex: q.orderIndex,
          category:   q.category,
          difficulty: q.difficulty,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  return session
}

// ─────────────────────────────────────────
// GET SESSION BY ID
// ─────────────────────────────────────────
export const getSessionById = async (sessionId, userId) => {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        include: { response: true },
      },
      feedback: true,
    },
  })
  return session
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
  // 1. Verify session belongs to user
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId, status: 'IN_PROGRESS' },
  })

  if (!session) return null

  // 2. Upsert response (create or update if re-answering)
  const response = await prisma.response.upsert({
    where:  { questionId },
    update: { answer, timeTaken, updatedAt: new Date() },
    create: { questionId, answer, timeTaken },
  })

  // 3. Update answered count on session
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
  // 1. Verify ownership
  const session = await prisma.interviewSession.findFirst({
    where:   { id: sessionId, userId },
    include: { questions: { include: { response: true } } },
  })

  if (!session) return null

  // 2. Calculate a simple score (answered / total * 100)
  const answered = session.questions.filter((q) => q.response).length
  const score    = Math.round((answered / session.questions.length) * 100)

  // 3. Create placeholder feedback (AI will replace this)
  const feedback = await prisma.feedback.upsert({
    where:  { sessionId },
    update: {},
    create: {
      sessionId,
      strengths:    ['Good effort completing the session', 'Showed willingness to answer all questions'],
      improvements: ['Practice structuring answers using the STAR method', 'Work on providing specific examples'],
      summary:      `You completed ${answered} out of ${session.questions.length} questions with a score of ${score}%. AI-powered detailed feedback coming soon.`,
    },
  })

  // 4. Mark session complete
  const completed = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status:      'COMPLETED',
      overallScore: score,
      completedAt:  new Date(),
    },
    include: { questions: { include: { response: true } }, feedback: true },
  })

  return completed
}