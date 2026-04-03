'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { getUser, logout }     from '@/lib/authService'
import type { AuthUser }       from '@/lib/authService'

export default function DashboardPage() {
  const router  = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const stored = getUser()
    if (!stored) {
      router.push('/login')
      return
    }
    setUser(stored)
  }, [router])

  const sessions = [
    { role: 'Software Engineer — Behavioral', date: 'Mar 22, 2026', score: 82, tag: 'BEHAVIORAL' },
    { role: 'Product Manager — Case Study',   date: 'Mar 20, 2026', score: 68, tag: 'CASE STUDY' },
    { role: 'Frontend Engineer — Technical',  date: 'Mar 18, 2026', score: 91, tag: 'TECHNICAL'  },
    { role: 'Data Scientist — System Design', date: 'Mar 15, 2026', score: 55, tag: 'SYSTEM DESIGN' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{ width: '240px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>PrepAI</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { label: 'Dashboard',       href: '/dashboard', active: true  },
            { label: 'Start Interview', href: '/interview', active: false },
            { label: 'Past Results',    href: '/result',    active: false },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500, background: item.active ? 'rgba(108,99,255,0.15)' : 'transparent', color: item.active ? 'var(--accent)' : 'var(--text-muted)', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ marginTop: 'auto' }}>
          {user && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)' }}>
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
      <main style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Good morning, {user?.name ?? '...'} ✦
            </p>
          </div>
          <Link href="/interview">
            <button className="btn-primary" style={{ width: 'auto', padding: '0.65rem 1.5rem' }}>
              New Interview →
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Sessions',  value: '12'  },
            { label: 'Avg Score', value: '74%' },
            { label: 'Questions', value: '86'  },
            { label: 'Streak',    value: '5d'  },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{stat.label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Sessions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Sessions</h2>
          {sessions.map((s) => (
            <div key={s.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{s.role}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.date}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="tag">{s.tag}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.score >= 80 ? '#00E5B0' : s.score >= 60 ? '#FFD166' : '#FF6B6B' }}>
                  {s.score}%
                </span>
                <Link href="/result" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Review →</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}