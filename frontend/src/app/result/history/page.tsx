'use client'

import { useEffect, useState } from 'react'
import { useRouter }            from 'next/navigation'
import Link                     from 'next/link'
import { getToken }             from '@/lib/authService'

const API = process.env.NEXT_PUBLIC_API_URL

type Session = {
  id:             string
  type:           string
  targetRole:     string
  status:         string
  overallScore:   number | null
  totalQuestions: number
  answeredCount:  number
  createdAt:      string
}

const scoreColor = (score: number | null) =>
  score === null ? 'var(--text-muted)'
  : score >= 80  ? '#00E5B0'
  : score >= 60  ? '#FFD166'
  : '#FF6B6B'

export default function ResultHistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = getToken()
      const res   = await fetch(`${API}/dashboard/history?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setSessions(data.data.sessions)
      else setError('Could not load history.')
    } catch {
      setError('Could not load history.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#FF6B6B' }}>{error}</p>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={fetchHistory}>Retry</button>
      </main>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Dashboard
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Past Results</h1>
      </div>

      {sessions.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</p>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No interviews yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Complete an interview to see your results here.</p>
          <Link href="/interview">
            <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>Start Interview →</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map((s) => (
            <div key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {s.targetRole} — {s.type.replace('_', ' ')}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}{s.answeredCount}/{s.totalQuestions} questions · {s.status}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor(s.overallScore) }}>
                  {s.overallScore !== null ? `${s.overallScore}%` : '—'}
                </span>
                {s.status === 'COMPLETED' && (
                  <Link href={`/result?sessionId=${s.id}`}>
                    <button style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: 'var(--accent)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Review →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}