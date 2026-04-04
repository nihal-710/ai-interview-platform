import Link from 'next/link'

export default function InterviewPage() {
  const types = [
    { tag: 'BEHAVIORAL',    title: 'Behavioral Interview', desc: 'STAR-method questions about your experience, leadership, and teamwork.',    duration: '20–30 min', color: '#6C63FF' },
    { tag: 'TECHNICAL',     title: 'Technical Interview',  desc: 'Data structures, algorithms, and system-level problem solving.',             duration: '45–60 min', color: '#00E5B0' },
    { tag: 'SYSTEM DESIGN', title: 'System Design',        desc: 'Design scalable systems: APIs, databases, microservices architecture.',       duration: '45 min',    color: '#FFD166' },
    { tag: 'CASE STUDY',    title: 'Case Study',           desc: 'Business and product case questions, metrics, and strategic thinking.',       duration: '30–40 min', color: '#FF6B6B' },
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>

      <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← Dashboard
      </Link>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1.5rem 0 0.5rem' }}>
        Choose your <span style={{ color: 'var(--accent)' }}>interview type.</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Pick a format. The AI will tailor questions to your selected role.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {types.map((t) => (
          <div
            key={t.tag}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '999px', background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}40` }}>
                {t.tag}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.duration}</span>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.desc}</p>

            {/* Updated — now links to session page */}
            <Link
              href={`/interview/session?type=${t.tag.replace(' ', '_')}&role=Software Engineer`}
              style={{ display: 'block' }}
            >
              <button className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                Start →
              </button>
            </Link>

          </div>
        ))}
      </div>
    </div>
  )
}