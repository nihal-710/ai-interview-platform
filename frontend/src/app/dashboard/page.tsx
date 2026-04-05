'use client'

import { useEffect, useState }       from 'react'
import { useRouter }                  from 'next/navigation'
import Link                           from 'next/link'
import { getToken, getUser, logout }  from '@/lib/authService'

const API = process.env.NEXT_PUBLIC_API_URL

type Summary = {
  totalSessions:      number
  completedSessions:  number
  averageScore:       number
  bestScore:          number
  currentStreak:      number
  totalTimeMinutes:   number
  favoriteType:       string | null
}

type Session = {
  id:             string
  type:           string
  targetRole:     string
  status:         string
  overallScore:   number | null
  totalQuestions: number
  answeredCount:  number
  createdAt:      string
  strengths:      string[]
  improvements:   string[]
}

type TrendPoint = {
  index: number
  score: number
  date:  string
  type:  string
}

type SkillItem = { text: string; count: number }

type Skills = {
  topStrengths:    SkillItem[]
  topImprovements: SkillItem[]
  typeAverages:    { type: string; avgScore: number; count: number }[]
}

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div style={{
      background:   accent ? 'rgba(108,99,255,0.1)' : 'var(--bg-card)',
      border:       `1px solid ${accent ? 'rgba(108,99,255,0.35)' : 'var(--border)'}`,
      borderRadius: '16px',
      padding:      '1.25rem',
    }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.75rem', color: '#00E5B0', marginTop: '0.25rem' }}>{sub}</p>}
    </div>
  )
}

function MiniTrendChart({ trend }: { trend: TrendPoint[] }) {
  if (trend.length < 2) {
    return (
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Complete more interviews to see your trend
        </p>
      </div>
    )
  }

  const W    = 600
  const H    = 120
  const pad  = 20
  const min  = Math.max(0,   Math.min(...trend.map((t) => t.score)) - 10)
  const max  = Math.min(100, Math.max(...trend.map((t) => t.score)) + 10)
  const range = max - min || 1

  const pts = trend.map((t, i) => ({
    x:     pad + (i / (trend.length - 1)) * (W - pad * 2),
    y:     H - pad - ((t.score - min) / range) * (H - pad * 2),
    score: t.score,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '120px' }}>
      <path d={fillD} fill="rgba(108,99,255,0.08)" />
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--accent)" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
            {p.score}
          </text>
        </g>
      ))}
    </svg>
  )
}

const scoreColor = (score: number | null) =>
  score === null ? 'var(--text-muted)'
  : score >= 80  ? '#00E5B0'
  : score >= 60  ? '#FFD166'
  : '#FF6B6B'

export default function DashboardPage() {
  const router = useRouter()
  const user   = getUser()

  const [summary,  setSummary]  = useState<Summary | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [trend,    setTrend]    = useState<TrendPoint[]>([])
  const [skills,   setSkills]   = useState<Skills | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const token   = getToken()
      const headers = { 'Authorization': `Bearer ${token}` }

      const [sumRes, histRes, trendRes, skillRes] = await Promise.all([
        fetch(`${API}/dashboard/summary`,        { headers }),
        fetch(`${API}/dashboard/history?limit=5`, { headers }),
        fetch(`${API}/dashboard/trend`,           { headers }),
        fetch(`${API}/dashboard/skills`,          { headers }),
      ])

      const [sumData, histData, trendData, skillData] = await Promise.all([
        sumRes.json(), histRes.json(), trendRes.json(), skillRes.json(),
      ])

      if (sumData.success)   setSummary(sumData.data)
      if (histData.success)  setSessions(histData.data.sessions)
      if (trendData.success) setTrend(trendData.data.trend)
      if (skillData.success) setSkills(skillData.data)

    } catch {
      setError('Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#FF6B6B' }}>{error}</p>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={fetchAll}>
          Retry
        </button>
      </div>
    )
  }

  const candidateName = user?.name?.split(' ')[0] || 'there'

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{ width: '240px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>PrepAI</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { label: 'Dashboard',       href: '/dashboard',      active: true  },
            { label: 'Start Interview', href: '/interview',      active: false },
            { label: 'Past Results',    href: '/result/history', active: false },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{
              padding: '0.6rem 0.75rem', borderRadius: '10px',
              fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
              background: item.active ? 'rgba(108,99,255,0.15)' : 'transparent',
              color:      item.active ? 'var(--accent)' : 'var(--text-muted)',
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          {user && (
            <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Welcome back, {candidateName} ✦
            </p>
          </div>
          <Link href="/interview">
            <button className="btn-primary" style={{ width: 'auto', padding: '0.65rem 1.5rem', fontSize: '0.875rem' }}>
              New Interview →
            </button>
          </Link>
        </div>

        {/* Empty state */}
        {summary && summary.totalSessions === 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</p>
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No interviews yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Start your first AI-powered interview to see your analytics here.
            </p>
            <Link href="/interview">
              <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                Start First Interview →
              </button>
            </Link>
          </div>
        )}

        {/* Stats grid */}
        {summary && summary.totalSessions > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <StatCard label="Sessions"   value={String(summary.completedSessions)} sub={`${summary.totalSessions} total`} />
            <StatCard label="Avg Score"  value={`${summary.averageScore}%`}         sub="across all sessions" accent />
            <StatCard label="Best Score" value={`${summary.bestScore}%`}            sub="personal best" />
            <StatCard label="Streak"     value={`${summary.currentStreak}d`}        sub={`${summary.totalTimeMinutes} min total`} />
          </div>
        )}

        {/* Performance trend */}
        {trend.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Performance Trend</h2>
            <MiniTrendChart trend={trend} />
          </div>
        )}

        {/* Recent sessions + Skills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>

          {/* Recent sessions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700 }}>Recent Sessions</h2>
              <Link href="/result/history" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>

            {sessions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No sessions yet.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {s.targetRole} — {s.type.replace('_', ' ')}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{s.answeredCount}/{s.totalQuestions} questions
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: scoreColor(s.overallScore) }}>
                      {s.overallScore !== null ? `${s.overallScore}%` : '—'}
                    </span>
                    {s.status === 'COMPLETED' && (
                      <Link href={`/result?sessionId=${s.id}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>
                        Review →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Skills panel */}
          {skills && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontWeight: 700 }}>Skills Snapshot</h2>

              {skills.topStrengths.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#00E5B0', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    TOP STRENGTHS
                  </p>
                  {skills.topStrengths.slice(0, 3).map((s) => (
                    <div key={s.text} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, marginRight: '0.5rem' }}>✓ {s.text.length > 40 ? s.text.slice(0, 40) + '...' : s.text}</span>
                      <span style={{ color: '#00E5B0', fontWeight: 600, flexShrink: 0 }}>×{s.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {skills.topImprovements.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#FF6B6B', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    AREAS TO IMPROVE
                  </p>
                  {skills.topImprovements.slice(0, 3).map((s) => (
                    <div key={s.text} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, marginRight: '0.5rem' }}>↗ {s.text.length > 40 ? s.text.slice(0, 40) + '...' : s.text}</span>
                      <span style={{ color: '#FF6B6B', fontWeight: 600, flexShrink: 0 }}>×{s.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {skills.typeAverages.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    BY INTERVIEW TYPE
                  </p>
                  {skills.typeAverages.map((t) => (
                    <div key={t.type} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.type.replace('_', ' ')}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor(t.avgScore) }}>{t.avgScore}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '999px' }}>
                        <div style={{ height: '4px', background: scoreColor(t.avgScore), borderRadius: '999px', width: `${t.avgScore}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}