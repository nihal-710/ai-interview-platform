'use client'

import { useEffect, useState } from 'react'
import { useRouter }            from 'next/navigation'
import Link                     from 'next/link'
import { getToken }             from '@/lib/authService'

const API = process.env.NEXT_PUBLIC_API_URL

type SessionItem = {
  id:           string
  type:         string
  targetRole:   string
  status:       string
  overallScore: number | null
  answeredCount: number
  totalQuestions: number
  createdAt:    string
  strengths:    string[]
  improvements: string[]
}

const scoreColor = (score: number | null) =>
  score === null ? 'var(--text-muted)'
  : score >= 80  ? '#00E5B0'
  : score >= 60  ? '#FFD166'
  : '#FF6B6B'

export default function ResultHistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = getToken()
        const res   = await fetch(`${API}/dashboard/history?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) setSessions(data.data.sessions)
        else setError(data.message)
      } catch {
        setError('Could not load history.')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <span className="tag">PAST RESULTS</span>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Your Interview History</h1>

      {error && (
        <p style={{ color: '#FF6B6B' }}>{error}</p>
      )}

      {sessions.length === 0 && !error && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</p>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No interviews yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Complete your first interview to see your history here.</p>
          <Link href="/interview">
            <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
              Start Interview →
            </button>
          </Link>
        </div>
      )}

      {sessions.map((s) => (
        <div key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                {s.targetRole} — {s.type.replace('_', ' ')}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' · '}{s.answeredCount}/{s.totalQuestions} questions answered
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(s.overallScore) }}>
                {s.overallScore !== null ? `${s.overallScore}%` : '—'}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {s.status}
              </p>
            </div>
          </div>

          {s.strengths.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#00E5B0', marginBottom: '0.5rem' }}>
              ✓ {s.strengths[0]}
            </p>
          )}
          {s.improvements.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#FFD166', marginBottom: '1rem' }}>
              ↗ {s.improvements[0]}
            </p>
          )}

          {s.status === 'COMPLETED' && (
            <Link href={`/result?sessionId=${s.id}`}>
              <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                View Full Result →
              </button>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}