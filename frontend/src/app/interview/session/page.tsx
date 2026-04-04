'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams }        from 'next/navigation'
import { getToken }                          from '@/lib/authService'

type Question = {
  id:         string
  content:    string
  orderIndex: number
  category:   string
  difficulty: string
  response:   { answer: string } | null
}

type Session = {
  id:             string
  type:           string
  targetRole:     string
  status:         string
  totalQuestions: number
  answeredCount:  number
  questions:      Question[]
}

const API = process.env.NEXT_PUBLIC_API_URL

export default function InterviewSessionPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [session,     setSession]     = useState<Session | null>(null)
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [answer,      setAnswer]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [timer,       setTimer]       = useState(0)
  const [startTime,   setStartTime]   = useState(Date.now())

  const interviewType = searchParams.get('type')     || 'BEHAVIORAL'
  const targetRole    = searchParams.get('role')     || 'Software Engineer'

  // Start session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        const token = getToken()
        const res   = await fetch(`${API}/interview/start`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ interviewType, targetRole }),
        })

        const data = await res.json()

        if (!data.success) {
          setError(data.message)
          return
        }

        setSession(data.data.session)
        setStartTime(Date.now())
      } catch {
        setError('Could not start session. Make sure backend is running.')
      } finally {
        setLoading(false)
      }
    }

    startSession()
  }, [interviewType, targetRole])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleSubmitAnswer = async () => {
    if (!session || !answer.trim()) return
    setSubmitting(true)

    const currentQuestion = session.questions[currentIdx]
    const timeTaken       = Math.floor((Date.now() - startTime) / 1000)

    try {
      const token = getToken()
      await fetch(`${API}/interview/${session.id}/respond`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer:     answer.trim(),
          timeTaken,
        }),
      })

      // Move to next question or complete
      if (currentIdx < session.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1)
        setAnswer('')
        setStartTime(Date.now())
      } else {
        await handleComplete()
      }
    } catch {
      setError('Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = useCallback(async () => {
    if (!session) return
    try {
      const token = getToken()
      const res   = await fetch(`${API}/interview/${session.id}/complete`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/result?sessionId=${session.id}`)
      }
    } catch {
      setError('Failed to complete session.')
    }
  }, [session, router])

  // ── Loading state ──
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Starting your interview session...</p>
      </main>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#FF6B6B', marginBottom: '1rem' }}>{error}</p>
          <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => router.push('/interview')}>
            Go Back
          </button>
        </div>
      </main>
    )
  }

  if (!session) return null

  const currentQuestion = session.questions[currentIdx]
  const progress        = ((currentIdx) / session.questions.length) * 100

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="tag">{session.type.replace('_', ' ')}</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {session.targetRole}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            {formatTime(timer)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Question {currentIdx + 1} of {session.questions.length}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '999px' }}>
        <div style={{ height: '4px', background: 'var(--accent)', borderRadius: '999px', width: `${progress}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Question card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {currentQuestion.category}
          </span>
          <span style={{ fontSize: '0.75rem', color: currentQuestion.difficulty === 'hard' ? '#FF6B6B' : currentQuestion.difficulty === 'easy' ? '#00E5B0' : '#FFD166', fontWeight: 600 }}>
            {currentQuestion.difficulty?.toUpperCase()}
          </span>
        </div>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.6 }}>
          {currentQuestion.content}
        </p>
      </div>

      {/* Answer area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Your Answer
        </label>
        <textarea
          className="field"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here. Take your time — think before you write."
          rows={8}
          style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {answer.length} characters · Aim for 150–300 words for behavioral questions
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Save & Exit
        </button>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 2rem', opacity: submitting || !answer.trim() ? 0.6 : 1 }}
          onClick={handleSubmitAnswer}
          disabled={submitting || !answer.trim()}
        >
          {submitting
            ? 'Saving...'
            : currentIdx < session.questions.length - 1
            ? 'Next Question →'
            : 'Finish Interview →'}
        </button>
      </div>
    </div>
  )
}