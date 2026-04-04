import { prisma }                                          from '../config/prisma.js'
import { scoreSession }                                    from './scoringService.js'
import { evaluateAnswer, generateSessionSummary }          from './aiService.js'

// ─────────────────────────────────────────
// GENERATE RESULT — now uses AI evaluation
// ─────────────────────────────────────────
export const generateResult = async (sessionId, userId) => {
  const session = await prisma.interviewSession.findFirst({
    where:   { id: sessionId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        include: { response: true },
      },
    },
  })
  if (!session) return null

  console.log(`[RESULT] Evaluating ${session.questions.length} answers with AI...`)

  // Evaluate each answer with AI
  const questionEvaluations = await Promise.all(
    session.questions.map(async (q) => {
      const answer = q.response?.answer || ''

      const evaluation = await evaluateAnswer(q.content, answer, session.type)

      // Save AI feedback back to response
      if (q.response) {
        await prisma.response.update({
          where: { id: q.response.id },
          data: {
            score:      evaluation.score,
            aiFeedback: evaluation.feedback,
          },
        })
      }

      return {
        questionId:   q.id,
        orderIndex:   q.orderIndex,
        content:      q.content,
        category:     q.category,
        answer:       answer || null,
        answered:     !!q.response,
        score:        evaluation.score,
        feedback:     evaluation.feedback,
        strengths:    evaluation.strengths,
        improvements: evaluation.improvements,
      }
    })
  )

  // Generate session-level summary with AI
  const aiSummary = await generateSessionSummary(
    session.targetRole,
    session.type,
    questionEvaluations
  )

  // Calculate aggregate scores
  const answered         = questionEvaluations.filter((q) => q.answered)
  const completionScore  = Math.round((answered.length / session.questions.length) * 100)
  const avgAnswerScore   = answered.length > 0
    ? Math.round(answered.reduce((sum, q) => sum + q.score, 0) / answered.length)
    : 0

  // Overall score — weighted average
  const overallScore = Math.round(completionScore * 0.3 + avgAnswerScore * 0.7)

  // Collect all strengths and improvements
  const allStrengths    = [...new Set([
    ...aiSummary.topStrengths,
    ...questionEvaluations.flatMap((q) => q.strengths).slice(0, 2),
  ])].slice(0, 4)

  const allImprovements = [...new Set([
    ...aiSummary.topImprovements,
    ...questionEvaluations.flatMap((q) => q.improvements).slice(0, 2),
  ])].slice(0, 4)

  const sessionSummary = `${aiSummary.overallFeedback} Next step: ${aiSummary.nextSteps}`

  // Save result
  const result = await prisma.result.upsert({
    where:  { sessionId },
    update: {
      overallScore,
      completionScore,
      answerLengthScore: aiSummary.communicationScore,
      keywordScore:      aiSummary.technicalScore,
      questionScores:    questionEvaluations,
      strengthAreas:     allStrengths,
      improvementAreas:  allImprovements,
      sessionSummary,
      totalQuestions:    session.questions.length,
      answeredQuestions: answered.length,
      scoringVersion:    'v2-ollama',
      updatedAt:         new Date(),
    },
    create: {
      sessionId,
      userId,
      overallScore,
      completionScore,
      answerLengthScore: aiSummary.communicationScore,
      keywordScore:      aiSummary.technicalScore,
      questionScores:    questionEvaluations,
      strengthAreas:     allStrengths,
      improvementAreas:  allImprovements,
      sessionSummary,
      totalQuestions:    session.questions.length,
      answeredQuestions: answered.length,
      scoringVersion:    'v2-ollama',
    },
  })

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data:  { overallScore },
  })

  return result
}

// ─────────────────────────────────────────
// GET RESULT BY SESSION
// ─────────────────────────────────────────
export const getResultBySession = async (sessionId, userId) => {
  return prisma.result.findFirst({
    where:   { sessionId, userId },
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