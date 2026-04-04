/**
 * SCORING SERVICE — Placeholder v1
 *
 * Scoring strategy:
 *   completionScore   → did the user answer all questions?
 *   answerLengthScore → are answers detailed enough?
 *   keywordScore      → do answers contain relevant keywords?
 *   overallScore      → weighted average of above three
 *
 * To plug in AI later:
 *   Replace scoreWithPlaceholder() with scoreWithAI()
 *   Keep the return shape identical — nothing else changes
 */

// Keywords that indicate a strong answer by interview type
const KEYWORDS = {
  BEHAVIORAL: [
    'situation', 'task', 'action', 'result', 'team', 'challenge',
    'achieved', 'improved', 'led', 'managed', 'collaborated', 'delivered',
    'learned', 'problem', 'solution', 'impact', 'stakeholder',
  ],
  TECHNICAL: [
    'algorithm', 'complexity', 'optimise', 'optimize', 'database', 'api',
    'function', 'class', 'performance', 'scalable', 'efficient', 'trade-off',
    'implement', 'architecture', 'pattern', 'test', 'debug',
  ],
  SYSTEM_DESIGN: [
    'scalability', 'availability', 'reliability', 'load balancer', 'cache',
    'database', 'microservice', 'api gateway', 'queue', 'partition',
    'replication', 'consistency', 'latency', 'throughput', 'cdn',
  ],
  CASE_STUDY: [
    'metric', 'kpi', 'revenue', 'growth', 'user', 'market', 'strategy',
    'prioritise', 'prioritize', 'data', 'analyse', 'analyze', 'hypothesis',
    'experiment', 'stakeholder', 'tradeoff', 'impact',
  ],
}

// ─────────────────────────────────────────
// SCORE INDIVIDUAL ANSWER
// ─────────────────────────────────────────
const scoreAnswer = (answer, interviewType) => {
  if (!answer || answer.trim().length === 0) {
    return { score: 0, lengthScore: 0, keywordScore: 0 }
  }

  const words    = answer.trim().split(/\s+/).length
  const lower    = answer.toLowerCase()
  const keywords = KEYWORDS[interviewType] || KEYWORDS.BEHAVIORAL

  // Length scoring — sweet spot is 100-300 words
  let lengthScore = 0
  if (words >= 300)      lengthScore = 100
  else if (words >= 150) lengthScore = 90
  else if (words >= 100) lengthScore = 75
  else if (words >= 50)  lengthScore = 55
  else if (words >= 20)  lengthScore = 35
  else                   lengthScore = 15

  // Keyword scoring — how many relevant keywords appear?
  const matched      = keywords.filter((kw) => lower.includes(kw)).length
  const keywordScore = Math.min(100, Math.round((matched / 5) * 100))

  // Combined answer score (60% length, 40% keywords)
  const score = Math.round(lengthScore * 0.6 + keywordScore * 0.4)

  return { score, lengthScore, keywordScore }
}

// ─────────────────────────────────────────
// GENERATE STRENGTHS + IMPROVEMENTS
// ─────────────────────────────────────────
const generateFeedback = (overallScore, completionRate, avgLength, interviewType) => {
  const strengths    = []
  const improvements = []

  // Completion feedback
  if (completionRate === 1)       strengths.push('Completed all questions — shows persistence and commitment.')
  else if (completionRate >= 0.8) strengths.push('Answered most questions — good overall engagement.')
  else                            improvements.push('Try to answer all questions — leaving blanks significantly impacts your score.')

  // Score-based feedback
  if (overallScore >= 80) strengths.push('Strong, detailed answers that demonstrate solid knowledge.')
  else if (overallScore >= 60) strengths.push('Decent responses with room for more depth.')
  else improvements.push('Focus on providing more comprehensive and structured answers.')

  // Length feedback
  if (avgLength >= 150)      strengths.push('Good answer length — you are communicating with appropriate detail.')
  else if (avgLength >= 80)  improvements.push('Expand your answers further — aim for 150+ words per question.')
  else                       improvements.push('Answers are too brief. Interviewers expect detailed responses with examples.')

  // Type-specific feedback
  if (interviewType === 'BEHAVIORAL') {
    improvements.push('Structure answers using the STAR method: Situation, Task, Action, Result.')
    strengths.push('Behavioral questions are about your past experience — keep using real examples.')
  }
  if (interviewType === 'TECHNICAL') {
    improvements.push('Always explain your reasoning and discuss trade-offs in technical answers.')
  }
  if (interviewType === 'SYSTEM_DESIGN') {
    improvements.push('Cover scalability, availability, and performance trade-offs in every design answer.')
  }
  if (interviewType === 'CASE_STUDY') {
    improvements.push('Always define metrics first before diving into solutions in case questions.')
  }

  return {
    strengths:    strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  }
}

// ─────────────────────────────────────────
// MAIN SCORING FUNCTION
// This is the function resultService calls
// Replace body with AI call in Phase 3
// ─────────────────────────────────────────
export const scoreSession = (session) => {
  const { questions, type } = session

  // Score each question individually
  const questionScores = questions.map((q) => {
    const answer = q.response?.answer || ''
    const scored = scoreAnswer(answer, type)

    return {
      questionId:   q.id,
      orderIndex:   q.orderIndex,
      content:      q.content,
      category:     q.category,
      answer:       answer || null,
      answered:     !!q.response,
      ...scored,
    }
  })

  // Aggregate scores
  const answered         = questionScores.filter((q) => q.answered)
  const completionRate   = answered.length / questions.length
  const completionScore  = Math.round(completionRate * 100)

  const avgLengthScore   = answered.length > 0
    ? Math.round(answered.reduce((sum, q) => sum + q.lengthScore,  0) / answered.length)
    : 0

  const avgKeywordScore  = answered.length > 0
    ? Math.round(answered.reduce((sum, q) => sum + q.keywordScore, 0) / answered.length)
    : 0

  const avgAnswerLength  = answered.length > 0
    ? Math.round(answered.reduce((sum, q) => sum + (q.answer?.split(/\s+/).length || 0), 0) / answered.length)
    : 0

  // Overall score — weighted
  const overallScore = Math.round(
    completionScore  * 0.3 +
    avgLengthScore   * 0.4 +
    avgKeywordScore  * 0.3
  )

  // Generate feedback
  const { strengths, improvements } = generateFeedback(
    overallScore, completionRate, avgAnswerLength, type
  )

  // Session summary
  const sessionSummary = `You completed ${answered.length} out of ${questions.length} questions ` +
    `with an overall score of ${overallScore}%. ` +
    `Your answers averaged ${avgAnswerLength} words per question. ` +
    `AI-powered detailed feedback will be available in the next platform update.`

  return {
    overallScore,
    completionScore,
    answerLengthScore: avgLengthScore,
    keywordScore:      avgKeywordScore,
    questionScores,
    strengthAreas:     strengths,
    improvementAreas:  improvements,
    sessionSummary,
    totalQuestions:    questions.length,
    answeredQuestions: answered.length,
    scoringVersion:    'v1-placeholder',
  }
}