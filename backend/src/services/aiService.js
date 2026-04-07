/**
 * AI SERVICE — Provider Abstraction Layer
 *
 * Currently uses Ollama (local, free)
 * To switch to OpenAI or Claude later:
 *   1. Add new provider function
 *   2. Change ACTIVE_PROVIDER constant
 *   3. Nothing else changes
 */

const OLLAMA_URL   = 'http://localhost:11434/api/generate'
const ACTIVE_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5'

// ─────────────────────────────────────────
// CORE OLLAMA REQUEST
// ─────────────────────────────────────────
export const ollamaRequest = async (prompt, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(OLLAMA_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:  ACTIVE_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1024,
          },
        }),
      })

      if (!res.ok) throw new Error(`Ollama responded with ${res.status}`)

      const data = await res.json()
      return data.response

    } catch (error) {
      console.error(`[AI SERVICE] Attempt ${attempt + 1} failed:`, error.message)
      if (attempt === retries) throw error
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

// ─────────────────────────────────────────
// SAFE JSON PARSER
// Extracts JSON from LLM response safely
// ─────────────────────────────────────────
export const parseJSON = (text) => {
  try {
    // Try direct parse first
    return JSON.parse(text)
  } catch {
    // Extract JSON block from markdown
    const match = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (match) {
      try { return JSON.parse(match[1]) } catch {}
    }

    // Find first { or [ and parse from there
    const start = text.search(/[\[{]/)
    const end   = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'))
    if (start !== -1 && end !== -1) {
      try { return JSON.parse(text.slice(start, end + 1)) } catch {}
    }

    return null
  }
}

// ─────────────────────────────────────────
// PART 1 — GENERATE QUESTIONS
// ─────────────────────────────────────────
export const generateQuestions = async (role, interviewType, difficulty = 'medium') => {
  const prompt = `You are an expert technical interviewer. Generate exactly 5 interview questions.

Role: ${role}
Interview Type: ${interviewType}
Difficulty: ${difficulty}

Rules:
- Questions must be specific to the role and interview type
- Each question must be practical and realistic
- Return ONLY valid JSON, no explanation

Return this exact JSON format:
{
  "questions": [
    {
      "content": "question text here",
      "category": "category name",
      "difficulty": "${difficulty}",
      "orderIndex": 1
    }
  ]
}

Generate 5 questions now:`

  try {
    const response = await ollamaRequest(prompt)
    const parsed   = parseJSON(response)

    if (parsed?.questions && Array.isArray(parsed.questions)) {
      return parsed.questions.slice(0, 5).map((q, i) => ({
        content:    q.content    || `Question ${i + 1} for ${role}`,
        category:   q.category   || interviewType,
        difficulty: q.difficulty || difficulty,
        orderIndex: i + 1,
      }))
    }

    throw new Error('Invalid question format from AI')

  } catch (error) {
    console.error('[AI] Question generation failed, using fallback:', error.message)
    return getFallbackQuestions(role, interviewType, difficulty)
  }
}

// ─────────────────────────────────────────
// PART 2 — EVALUATE ANSWER
// ─────────────────────────────────────────
export const evaluateAnswer = async (question, answer, interviewType) => {
  if (!answer || answer.trim().length < 10) {
    return {
      score:       0,
      feedback:    'No answer provided.',
      strengths:   [],
      improvements: ['Provide a detailed answer to this question.'],
    }
  }

  const prompt = `You are an expert interviewer evaluating a candidate's answer.

Interview Type: ${interviewType}
Question: ${question}
Candidate's Answer: ${answer}

Evaluate the answer and return ONLY valid JSON:
{
  "score": <number 0-100>,
  "feedback": "<one sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Rules:
- score 0-100 based on quality, relevance, and depth
- Be specific and constructive
- Return ONLY the JSON, nothing else`

  try {
    const response = await ollamaRequest(prompt)
    const parsed   = parseJSON(response)

    if (parsed && typeof parsed.score === 'number') {
      return {
        score:        Math.min(100, Math.max(0, Math.round(parsed.score))),
        feedback:     parsed.feedback    || 'Answer evaluated.',
        strengths:    parsed.strengths   || [],
        improvements: parsed.improvements || [],
      }
    }

    throw new Error('Invalid evaluation format from AI')

  } catch (error) {
    console.error('[AI] Answer evaluation failed, using fallback:', error.message)
    return getFallbackEvaluation(answer)
  }
}

// ─────────────────────────────────────────
// PART 3 — GENERATE SESSION SUMMARY
// ─────────────────────────────────────────
export const generateSessionSummary = async (role, interviewType, questionEvaluations) => {
  const avgScore    = Math.round(
    questionEvaluations.reduce((sum, q) => sum + q.score, 0) / questionEvaluations.length
  )
  const answered    = questionEvaluations.filter((q) => q.score > 0).length
  const total       = questionEvaluations.length

  const evalSummary = questionEvaluations
    .map((q, i) => `Q${i + 1}: Score ${q.score}/100 — ${q.feedback}`)
    .join('\n')

  const prompt = `You are an expert career coach summarizing an interview performance.

Role: ${role}
Interview Type: ${interviewType}
Questions Answered: ${answered}/${total}
Average Score: ${avgScore}/100

Per-question results:
${evalSummary}

Generate a concise performance summary and return ONLY valid JSON:
{
  "overallFeedback": "<2-3 sentence overall summary>",
  "communicationScore": <number 0-100>,
  "technicalScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "topImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "nextSteps": "<one actionable recommendation>"
}

Return ONLY the JSON:`

  try {
    const response = await ollamaRequest(prompt)
    const parsed   = parseJSON(response)

    if (parsed?.overallFeedback) {
      return {
        overallFeedback:    parsed.overallFeedback,
        communicationScore: parsed.communicationScore || avgScore,
        technicalScore:     parsed.technicalScore     || avgScore,
        confidenceScore:    parsed.confidenceScore    || avgScore,
        topStrengths:       parsed.topStrengths       || [],
        topImprovements:    parsed.topImprovements    || [],
        nextSteps:          parsed.nextSteps          || 'Keep practising regularly.',
      }
    }

    throw new Error('Invalid summary format')

  } catch (error) {
    console.error('[AI] Summary generation failed, using fallback:', error.message)
    return getFallbackSummary(avgScore, answered, total)
  }
}

// ─────────────────────────────────────────
// FALLBACK FUNCTIONS
// Used when Ollama is unavailable
// ─────────────────────────────────────────
const getFallbackQuestions = (role, interviewType, difficulty) => {
  const bank = {
    BEHAVIORAL: [
      'Tell me about yourself and your professional background.',
      'Describe a time you faced a significant challenge. How did you handle it?',
      'Tell me about a time you worked with a difficult team member.',
      'Describe a situation where you had to meet a tight deadline.',
      'What is your greatest professional achievement so far?',
    ],
    TECHNICAL: [
      `Explain the core technical skills required for a ${role} role.`,
      'What is the difference between an array and a linked list?',
      'Explain RESTful API design principles.',
      'How do you approach debugging a production issue?',
      'What is your experience with databases and query optimization?',
    ],
    SYSTEM_DESIGN: [
      'Design a URL shortening service. Walk me through your approach.',
      'How would you design a scalable notification system?',
      'Explain the trade-offs between SQL and NoSQL databases.',
      'How would you design a rate limiting system?',
      'Walk me through designing a caching layer for a web application.',
    ],
    CASE_STUDY: [
      'User engagement dropped 20% last month. How would you investigate this?',
      'How would you prioritise features with a limited engineering budget?',
      'How would you measure the success of a newly launched feature?',
      'Walk me through launching a new product in a competitive market.',
      'A competitor released a similar feature. How do you respond?',
    ],
  }

  const questions = bank[interviewType] || bank.BEHAVIORAL
  return questions.map((content, i) => ({
    content,
    category:   interviewType,
    difficulty,
    orderIndex: i + 1,
  }))
}

const getFallbackEvaluation = (answer) => {
  const words = answer?.trim().split(/\s+/).length || 0
  const score = Math.min(100, Math.round((words / 200) * 100))
  return {
    score,
    feedback:     'Answer evaluated using basic scoring (AI unavailable).',
    strengths:    words > 100 ? ['Good answer length'] : [],
    improvements: words < 50  ? ['Provide more detail in your answer'] : [],
  }
}

const getFallbackSummary = (avgScore, answered, total) => ({
  overallFeedback:    `You completed ${answered} of ${total} questions with an average score of ${avgScore}%.`,
  communicationScore: avgScore,
  technicalScore:     avgScore,
  confidenceScore:    avgScore,
  topStrengths:       ['Completed the interview session'],
  topImprovements:    ['Practice more to improve your scores'],
  nextSteps:          'Review your answers and practice regularly.',
})

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
export const checkOllamaHealth = async () => {
  try {
    const res = await fetch('http://localhost:11434/api/tags')
    if (!res.ok) return { available: false, models: [] }
    const data = await res.json()
    return {
      available: true,
      models: data.models?.map((m) => m.name) || [],
    }
  } catch {
    return { available: false, models: [] }
  }
}


// ─────────────────────────────────────────
// INTERVIEWER GESTURE
// Short human-like response after each answer
// ─────────────────────────────────────────
export const generateInterviewerGesture = async (question, answer, candidateName = 'there') => {
  // Analyse answer quality before sending to AI
  const words       = answer?.trim().split(/\s+/).filter(Boolean).length || 0
  const lower       = answer?.toLowerCase() || ''

  const isBlank     = words < 3
  const isConfused  = lower.includes("don't know") || lower.includes("not sure") ||
                      lower.includes("no idea")    || lower.includes("i dont know") ||
                      lower.includes("unsure")     || lower.includes("cant answer") ||
                      lower.includes("skip")       || words < 8
  const isShort     = words >= 8  && words < 40
  const isMedium    = words >= 40 && words < 100
  const isDetailed  = words >= 100

  // Build quality context for the prompt
  const qualityContext = isBlank    ? 'The candidate gave NO answer or just a few meaningless words.'
    : isConfused ? 'The candidate explicitly said they do not know the answer or are very unsure.'
    : isShort    ? 'The candidate gave a very short and incomplete answer with little detail.'
    : isMedium   ? 'The candidate gave a decent but brief answer that could use more depth.'
    : isDetailed ? 'The candidate gave a detailed and thoughtful answer.'
    : 'The candidate gave an average answer.'

  // Strict examples mapped to quality
  const examplesByQuality = isBlank || isConfused
    ? `"No worries ${candidateName}, not everyone knows this one. Let's move on."
"That's okay ${candidateName}, we can skip this. Next question."
"Don't worry ${candidateName}, let's try the next one."`
    : isShort
    ? `"Could you expand on that a bit more, ${candidateName}? Interesting start though."
"A brief response ${candidateName}, but let's keep going."
"I'd love to hear more detail next time, ${candidateName}. Moving on."`
    : isMedium
    ? `"Good points ${candidateName}, let's continue."
"Decent answer ${candidateName}, keep it up."
"That works ${candidateName}, moving to the next one."`
    : `"Excellent response ${candidateName}, very well articulated."
"That's a great example ${candidateName}, really strong answer."
"Well handled ${candidateName}, impressive detail."`

  const prompt = `You are a professional interviewer. React naturally to this candidate's answer.

Candidate name: ${candidateName}
Question: ${question}
Answer quality assessment: ${qualityContext}
Candidate's actual answer: "${answer?.slice(0, 200) || 'no answer given'}"

Your response MUST:
- Be 8 to 15 words maximum
- Directly reflect the answer quality described above
- Use the candidate's name once
- Sound natural and human
- NOT be generic like "Thanks for sharing that"

Example responses for this quality level:
${examplesByQuality}

Return ONLY your single sentence response, nothing else. No quotes, no explanation:`

  try {
    const response = await ollamaRequest(prompt)
    const cleaned  = response
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\n.*/s, '')
      .slice(0, 150)

    // Validate it's not too generic — if it is, use quality-based fallback
    const tooGeneric = [
      'thanks for sharing',
      'thank you for sharing',
      'great answer',
      'well done',
    ].some((phrase) => cleaned.toLowerCase().includes(phrase) && (isBlank || isConfused))

    if (tooGeneric || !cleaned) throw new Error('Generic response detected')

    return cleaned

  } catch {
    // Quality-based fallback responses
    if (isBlank || isConfused) {
      const fallbacks = [
        `No worries ${candidateName}, not everyone knows this one. Let's move on.`,
        `That's okay ${candidateName}, let's try the next question.`,
        `Don't worry ${candidateName}, we can move on from this one.`,
        `Totally fine ${candidateName}, let's keep going.`,
      ]
      return fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    if (isShort) {
      const fallbacks = [
        `Brief answer ${candidateName}, but let's continue.`,
        `I'd love more detail next time ${candidateName}. Moving on.`,
        `Okay ${candidateName}, let's keep the momentum going.`,
      ]
      return fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    if (isDetailed) {
      const fallbacks = [
        `Excellent response ${candidateName}, very well articulated.`,
        `That's a strong answer ${candidateName}, great detail.`,
        `Really impressive ${candidateName}, let's continue.`,
      ]
      return fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    return `Good effort ${candidateName}, let's move on.`
  }
}