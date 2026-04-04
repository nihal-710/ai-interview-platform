'use client'

import { useEffect, useState }   from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link                      from 'next/link'
import { getToken }              from '@/lib/authService'

const API = process.env.NEXT_PUBLIC_API_URL

type QuestionScore = {
  questionId:   string
  orderIndex:   number
  content:      string
  category:     string
  answer:       string | null
  answered:     boolean
  score:        number
  lengthScore:  number
  keywordScore: number
}

type Result = {
  overallScore:      number
  completionScore:   number
  answerLengthScore: number
  keywordScore:      number
  questionScores:    QuestionScore[]
  strengthAreas:     string[]
  improvementAreas:  string[]
  sessionSummary:    string
  totalQuestions:    number
  answeredQuestions: number
  scoringVersion:    string
  session: {
    type:       string
    targetRole: string
    createdAt:  string
  }
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? '#00E5B0' : score >= 60 ? '#FFD166' : '#FF6B6B'
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border)' }}>
        <div style={{ height: '6px', borderRadius: '999px', background: color, width: `${score}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function ResultPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const sessionId    = searchParams.get('sessionId')

  const [result,  setResult]  = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided.')
      setLoading(false)
      return
    }

    const fetchResult = async () => {
      try {
        const token = getToken()

        const res = await fetch(`${API}/results/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        const data = await res.json()

        if (!data.success) {
          setError(data.message || 'Could not load result.')
          return
        }

        setResult(data.data.result)

      } catch {
        setError('Could not connect to server.')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [sessionId])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading your results...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#FF6B6B' }}>{error}</p>
        <Link href="/dashboard">
          <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            Back to Dashboard
          </button>
        </Link>
      </main>
    )
  }

  if (!result) return null

  const scoreColor = result.overallScore >= 80 ? '#00E5B0' : result.overallScore >= 60 ? '#FFD166' : '#FF6B6B'

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <span className="tag">SESSION RESULT</span>
      </div>

      {/* Score hero */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Score ring */}
        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor} strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - result.overallScore / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: scoreColor }}>{result.overallScore}</span>
          </div>
        </div>

        {/* Meta */}
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {result.session?.type?.replace('_', ' ')} · {result.session?.targetRole}
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {result.overallScore >= 80 ? 'Excellent work!' : result.overallScore >= 60 ? 'Good effort!' : 'Keep practising!'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Answered {result.answeredQuestions} of {result.totalQuestions} questions
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
            {new Date(result.session?.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Score Breakdown</h2>
        <ScoreBar label="Completion"    score={result.completionScore}   />
        <ScoreBar label="Answer Depth"  score={result.answerLengthScore} />
        <ScoreBar label="Keyword Usage" score={result.keywordScore}      />
      </div>

      {/* Question breakdown */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Question Breakdown</h2>
        {(result.questionScores as QuestionScore[]).map((q, i) => (
          <div key={q.questionId} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, marginRight: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Q{i + 1} · {q.category}
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{q.content}</p>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: q.answered ? (q.score >= 70 ? '#00E5B0' : '#FFD166') : '#FF6B6B', flexShrink: 0 }}>
                {q.answered ? `${q.score}%` : 'Skipped'}
              </span>
            </div>
            {q.answer && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                {q.answer.length > 200 ? q.answer.slice(0, 200) + '...' : q.answer}
              </p>
            )}
            {!q.answered && (
              <p style={{ fontSize: '0.8rem', color: '#FF6B6B', marginTop: '0.25rem' }}>No answer submitted</p>
            )}
          </div>
        ))}
      </div>

      {/* AI Feedback */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontWeight: 700 }}>Feedback</h2>

        <p style={{ fontSize: '0.75rem', color: '#00E5B0', fontWeight: 600, letterSpacing: '0.08em' }}>STRENGTHS</p>
        {result.strengthAreas.map((s) => (
          <div key={s} style={{ background: 'rgba(0,229,176,0.06)', border: '1px solid rgba(0,229,176,0.2)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.875rem' }}>
            ✓ {s}
          </div>
        ))}

        <p style={{ fontSize: '0.75rem', color: '#FF6B6B', fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.5rem' }}>AREAS TO IMPROVE</p>
        {result.improvementAreas.map((s) => (
          <div key={s} style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.875rem' }}>
            ↗ {s}
          </div>
        ))}

        <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>SUMMARY</p>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>{result.sessionSummary}</p>
        </div>

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Scoring: {result.scoringVersion} · AI-powered scoring coming soon
        </p>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/interview">
          <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            Practice Again →
          </button>
        </Link>
        <Link href="/dashboard">
          <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', padding: '0.75rem 2rem', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}