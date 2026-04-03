import Link from 'next/link'

export default function ResultPage() {
  const score = 82

  const breakdown = [
    { label: 'Communication Clarity',       score: 88 },
    { label: 'Structured Thinking (STAR)',   score: 79 },
    { label: 'Relevance to Question',        score: 85 },
    { label: 'Depth of Examples',            score: 72 },
    { label: 'Conciseness',                  score: 68 },
  ]

  const strengths = [
    'Your answers were clear and well-articulated with a logical narrative flow throughout.',
    'Strong use of quantifiable outcomes in your leadership example.',
  ]

  const improvements = [
    'Your answer to Q4 was slightly long. Practice trimming stories to under 2 minutes.',
    'Avoid filler words like "basically" and "kind of" — they reduce perceived confidence.',
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2rem', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← Dashboard
      </Link>

      {/* Score hero */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent)', minWidth: '80px', textAlign: 'center' }}>
          {score}
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SOFTWARE ENGINEER — BEHAVIORAL</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Great performance!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            You scored in the <strong style={{ color: 'white' }}>top 22%</strong> of candidates for this role.
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontWeight: 700 }}>Score Breakdown</h2>
        {breakdown.map((item) => {
          const color = item.score >= 80 ? '#00E5B0' : item.score >= 60 ? '#FFD166' : '#FF6B6B'
          return (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{item.score}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border)' }}>
                <div style={{ height: '6px', borderRadius: '999px', background: color, width: `${item.score}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontWeight: 700 }}>AI Feedback</h2>

        <p style={{ fontSize: '0.75rem', color: '#00E5B0', fontWeight: 600, letterSpacing: '0.08em' }}>STRENGTHS</p>
        {strengths.map((s) => (
          <div key={s} style={{ background: 'rgba(0,229,176,0.06)', border: '1px solid rgba(0,229,176,0.2)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.875rem' }}>
            ✓ {s}
          </div>
        ))}

        <p style={{ fontSize: '0.75rem', color: '#FF6B6B', fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.5rem' }}>AREAS TO IMPROVE</p>
        {improvements.map((s) => (
          <div key={s} style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.875rem' }}>
            ↗ {s}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/interview">
          <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>Practice Again →</button>
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