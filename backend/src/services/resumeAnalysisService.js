import Groq from 'groq-sdk'
import { parseJSON } from './aiService.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const ROLE_SKILLS = {
  'Software Engineer':    ['JavaScript', 'TypeScript', 'Node.js', 'React', 'SQL', 'Git', 'REST APIs', 'Problem Solving', 'Data Structures'],
  'Frontend Developer':   ['React', 'TypeScript', 'CSS', 'HTML', 'Next.js', 'Tailwind', 'Figma', 'Performance Optimization'],
  'Backend Developer':    ['Node.js', 'Express', 'PostgreSQL', 'REST APIs', 'Authentication', 'Docker', 'System Design'],
  'Full Stack Developer': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Git', 'CI/CD'],
  'Data Scientist':       ['Python', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow', 'Data Visualization', 'Pandas'],
  'AI Engineer':          ['Python', 'LLMs', 'Machine Learning', 'PyTorch', 'NLP', 'MLOps', 'API Integration'],
  'Product Manager':      ['Product Strategy', 'Roadmapping', 'Agile', 'User Research', 'Data Analysis', 'Stakeholder Management'],
  'DevOps Engineer':      ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS', 'Terraform', 'Monitoring'],
}

export const analyseResume = async (resumeText, targetRole) => {
  const expectedSkills = ROLE_SKILLS[targetRole] || ROLE_SKILLS['Software Engineer']

  if (!resumeText || resumeText.trim().length < 50) {
    console.error('[RESUME ANALYSIS] Resume text too short or empty:', resumeText?.length)
    return getFallbackAnalysis(resumeText || '', targetRole, expectedSkills)
  }

  const prompt = `You are an expert technical recruiter and career coach.
Analyse this resume for the role of ${targetRole}.

Expected skills for this role: ${expectedSkills.join(', ')}

Resume content:
${resumeText.slice(0, 3000)}

Analyse the resume and return ONLY valid JSON in this exact format:
{
  "resumeScore": <number 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "focusAreas": ["area1", "area2", "area3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Scoring guide:
- 80-100: Excellent match, strong candidate
- 60-79: Good match, minor gaps
- 40-59: Moderate match, needs improvement
- 0-39: Significant gaps for this role

Rules:
- matchedSkills: skills found in resume that match the role (max 8)
- missingSkills: important skills missing from resume (max 6)
- focusAreas: specific areas to strengthen for this role (max 4)
- recommendations: actionable improvement steps (max 4)
- Return ONLY the JSON, no explanation`

  try {
    const completion = await groq.chat.completions.create({
      model:    process.env.GROQ_MODEL || 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content || ''
    console.log('[RESUME ANALYSIS] Groq raw response:', response.slice(0, 200))

    const parsed = parseJSON(response)

    if (!parsed || typeof parsed.resumeScore !== 'number') {
      console.error('[RESUME ANALYSIS] Invalid parsed response:', parsed)
      throw new Error('Invalid AI response format')
    }

    return {
      resumeScore:     Math.min(100, Math.max(0, Math.round(parsed.resumeScore))),
      matchedSkills:   Array.isArray(parsed.matchedSkills)   ? parsed.matchedSkills.slice(0, 8)   : [],
      missingSkills:   Array.isArray(parsed.missingSkills)   ? parsed.missingSkills.slice(0, 6)   : [],
      focusAreas:      Array.isArray(parsed.focusAreas)      ? parsed.focusAreas.slice(0, 4)      : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : [],
    }

  } catch (error) {
    console.error('[RESUME ANALYSIS] Groq failed, using fallback:', error.message)
    return getFallbackAnalysis(resumeText, targetRole, expectedSkills)
  }
}

const getFallbackAnalysis = (text, role, expectedSkills) => {
  const lower   = text.toLowerCase()
  const matched = expectedSkills.filter((s) => lower.includes(s.toLowerCase()))
  const missing = expectedSkills.filter((s) => !lower.includes(s.toLowerCase()))
  const score   = expectedSkills.length > 0
    ? Math.round((matched.length / expectedSkills.length) * 100)
    : 0

  return {
    resumeScore:     Math.min(score, 85),
    matchedSkills:   matched.slice(0, 8),
    missingSkills:   missing.slice(0, 6),
    focusAreas:      [`Strengthen your ${role} fundamentals`, 'Add more quantifiable achievements', 'Highlight relevant projects'],
    recommendations: ['Add missing technical skills', 'Quantify your impact with numbers', 'Tailor resume to the specific role', 'Add relevant projects or open source contributions'],
  }
}