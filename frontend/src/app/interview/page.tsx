'use client'

import { useState } from 'react'
import Link         from 'next/link'
import { useRouter } from 'next/navigation'

type InterviewMode = 'text' | 'video'

type InterviewType = {
  tag:      string
  title:    string
  desc:     string
  duration: string
  color:    string
}

const types: InterviewType[] = [
  { tag: 'BEHAVIORAL',    title: 'Behavioral Interview',  desc: 'STAR-method questions about your experience, leadership, and teamwork.',    duration: '20–30 min', color: '#6C63FF' },
  { tag: 'TECHNICAL',     title: 'Technical Interview',   desc: 'Data structures, algorithms, and system-level problem solving.',             duration: '45–60 min', color: '#00E5B0' },
  { tag: 'SYSTEM_DESIGN', title: 'System Design',         desc: 'Design scalable systems: APIs, databases, microservices architecture.',       duration: '45 min',    color: '#FFD166' },
  { tag: 'CASE_STUDY',    title: 'Case Study',            desc: 'Business and product case questions, metrics, and strategic thinking.',       duration: '30–40 min', color: '#FF6B6B' },
]

export default function InterviewPage() {
  const router               = useRouter()
  const [mode, setMode]      = useState<InterviewMode>('text')
  const [role, setRole]      = useState('Software Engineer')
  const [selected, setSelected] = useState<string | null>(null)

  const handleStart = (tag: string) => {
    setSelected(tag)
    const type = tag.replace(' ', '_')
    router.push(`/interview/session?type=${type}&role=${encodeURIComponent(role)}&mode=${mode}`)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2rem', maxWidth: '960px', margin: '0 auto' }}>

      <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← Dashboard
      </Link>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1.5rem 0 0.5rem' }}>
        Choose your <span style={{ color: 'var(--accent)' }}>interview type.</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Pick a format and mode. AI will tailor questions to your role.
      </p>

      {/* Role selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Role
        </label>
        <select
          className="field"
          style={{ width: 'auto', maxWidth: '280px' }}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option>Software Engineer</option>
          <option>Product Manager</option>
          <option>Data Scientist</option>
          <option>UX Designer</option>
          <option>DevOps Engineer</option>
          <option>Business Analyst</option>
        </select>
      </div>

      {/* Interview mode selector */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Interview Mode
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

          {/* Text mode */}
          <button
            onClick={() => setMode('text')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1.25rem',
              borderRadius: '14px',
              border: `2px solid ${mode === 'text' ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === 'text' ? 'rgba(108,99,255,0.08)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Text Interview
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Type or speak your answers. Camera optional.
            </p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['⌨️ Type', '🎤 Voice', '📷 Optional cam'].map((f) => (
                <span key={f} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(108,99,255,0.12)', color: '#a09fff', border: '1px solid rgba(108,99,255,0.2)' }}>
                  {f}
                </span>
              ))}
            </div>
          </button>

          {/* Video mode */}
          <button
            onClick={() => setMode('video')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1.25rem',
              borderRadius: '14px',
              border: `2px solid ${mode === 'video' ? '#00E5B0' : 'var(--border)'}`,
              background: mode === 'video' ? 'rgba(0,229,176,0.06)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎥</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Video Interview
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Camera and mic start automatically. Just like a real interview.
            </p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['🎥 Auto camera', '🎤 Auto mic', '⬇️ Download after'].map((f) => (
                <span key={f} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(0,229,176,0.1)', color: '#00E5B0', border: '1px solid rgba(0,229,176,0.2)' }}>
                  {f}
                </span>
              ))}
            </div>
          </button>

        </div>
      </div>

      {/* Interview type grid */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
        Interview Type
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {types.map((t) => (
          <div
            key={t.tag}
            style={{
              background:   'var(--bg-card)',
              border:       `1px solid ${selected === t.tag ? t.color : 'var(--border)'}`,
              borderRadius: '16px',
              padding:      '1.5rem',
              display:      'flex',
              flexDirection: 'column',
              gap:          '0.75rem',
              transition:   'border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '999px', background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}40` }}>
                {t.tag}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.duration}</span>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.desc}</p>

            <button
              className="btn-primary"
              style={{ marginTop: '0.5rem', background: t.color }}
              onClick={() => handleStart(t.tag)}
            >
              {mode === 'video' ? '🎥 Start Video Interview →' : '💬 Start Interview →'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}