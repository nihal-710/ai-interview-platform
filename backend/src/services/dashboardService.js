import { prisma } from '../config/prisma.js'

// ─────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────
export const getDashboardSummary = async (userId) => {
  const [sessions, results] = await Promise.all([
    prisma.interviewSession.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      include: { result: true },
    }),
    prisma.result.findMany({
      where: { userId },
    }),
  ])

  const completed  = sessions.filter((s) => s.status === 'COMPLETED')
  const scores     = results.map((r) => r.overallScore).filter(Boolean)
  const avgScore   = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0
  const bestScore  = scores.length > 0 ? Math.max(...scores) : 0
  const totalTime  = completed.reduce((sum, s) => sum + (s.durationSecs || 0), 0)

  // Streak — consecutive days with at least one session
  const streak = calculateStreak(sessions)

  // Most practiced type
  const typeCounts = completed.reduce((acc, s) => {
  acc[s.type] = (acc[s.type] || 0) + 1
  return acc
}, {})
  const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return {
    totalSessions:    sessions.length,
    completedSessions: completed.length,
    averageScore:     avgScore,
    bestScore,
    currentStreak:    streak,
    totalTimeMinutes: Math.round(totalTime / 60),
    favoriteType,
  }
}

// ─────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────
export const getSessionHistory = async (userId, limit = 10) => {
  const sessions = await prisma.interviewSession.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    include: {
      result: {
        select: {
          overallScore:      true,
          strengthAreas:     true,
          improvementAreas:  true,
          scoringVersion:    true,
        },
      },
      questions: {
        select: { id: true },
      },
    },
  })

  return sessions.map((s) => ({
    id:           s.id,
    type:         s.type,
    targetRole:   s.targetRole,
    status:       s.status,
    overallScore: s.result?.overallScore ?? null,
    totalQuestions: s.questions.length,
    answeredCount:  s.answeredCount,
    createdAt:    s.createdAt,
    completedAt:  s.completedAt,
    strengths:    s.result?.strengthAreas   ?? [],
    improvements: s.result?.improvementAreas ?? [],
  }))
}

// ─────────────────────────────────────────
// PERFORMANCE TREND
// ─────────────────────────────────────────
export const getPerformanceTrend = async (userId) => {
  const results = await prisma.result.findMany({
    where:   { userId },
    orderBy: { createdAt: 'asc' },
    take:    20,
    include: {
      session: {
        select: {
          type:       true,
          targetRole: true,
        },
      },
    },
  })

  return results.map((r, index) => ({
    index:        index + 1,
    score:        r.overallScore,
    completion:   r.completionScore,
    date:         r.createdAt,
    type:         r.session?.type,
    role:         r.session?.targetRole,
  }))
}

// ─────────────────────────────────────────
// SKILLS ANALYSIS
// ─────────────────────────────────────────
export const getSkillsAnalysis = async (userId) => {
  const results = await prisma.result.findMany({
    where: { userId },
    select: {
      strengthAreas:    true,
      improvementAreas: true,
      overallScore:     true,
      session: {
        select: { type: true },
      },
    },
  })

  // Aggregate all strengths and improvements
  const strengthCounts    = {}
  const improvementCounts = {}

  results.forEach((r) => {
    r.strengthAreas.forEach((s) => {
      strengthCounts[s] = (strengthCounts[s] || 0) + 1
    })
    r.improvementAreas.forEach((i) => {
      improvementCounts[i] = (improvementCounts[i] || 0) + 1
    })
  })

  // Score by interview type
  const typeScores = {}
  results.forEach((r) => {
    const type = r.session?.type || 'UNKNOWN'
    if (!typeScores[type]) typeScores[type] = []
    typeScores[type].push(r.overallScore)
  })

  const typeAverages = Object.entries(typeScores).map(([type, scores]) => ({
    type,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count:    scores.length,
  }))

  return {
    topStrengths:    Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count })),
    topImprovements: Object.entries(improvementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count })),
    typeAverages,
  }
}

// ─────────────────────────────────────────
// STREAK CALCULATOR
// ─────────────────────────────────────────
const calculateStreak = (sessions) => {
  if (sessions.length === 0) return 0

  const dates = [...new Set(
    sessions.map((s) => new Date(s.createdAt).toDateString())
  )].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())

  let streak  = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const date of dates) {
    const diff = Math.round((current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 1) {
      streak++
      current = date
    } else {
      break
    }
  }

  return streak
}