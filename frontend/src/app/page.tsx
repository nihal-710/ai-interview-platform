'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Shape of the health response from the backend
type HealthData = {
  status: string
  env: string
  timestamp: string
  uptime: string
}

type ApiResponse = {
  success: boolean
  message: string
  data: HealthData
}

export default function Home() {
  const [health, setHealth]   = useState<HealthData | null>(null)
  const [status, setStatus]   = useState<'loading' | 'ok' | 'error'>('loading')
  const [error,  setError]    = useState<string | null>(null)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)

        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`)
        }

        const json: ApiResponse = await res.json()

        if (json.success) {
          setHealth(json.data)
          setStatus('ok')
        } else {
          throw new Error(json.message)
        }
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    checkBackend()
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '2rem',
    }}>
      <p style={{color:'lime', fontSize:'12px'}}>{process.env.NEXT_PUBLIC_API_URL}</p>

      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Ace every <span style={{ color: 'var(--accent)' }}>interview.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Practice with AI. Get real-time feedback. Land the job.
        </p>
      </div>

      {/* Backend connection status card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          BACKEND STATUS
        </p>

        {/* Loading */}
        {status === 'loading' && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Connecting to backend...
          </p>
        )}

        {/* Success */}
        {status === 'ok' && health && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ color: '#00E5B0', fontWeight: 700 }}>
              ✓ Connected — {health.status}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Env: <span style={{ color: 'white' }}>{health.env}</span>
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Uptime: <span style={{ color: 'white' }}>{health.uptime}</span>
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Checked at: <span style={{ color: 'white' }}>{new Date(health.timestamp).toLocaleTimeString()}</span>
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div>
            <p style={{ color: '#FF6B6B', fontWeight: 700 }}>✗ Could not reach backend</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {error}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Make sure the backend is running on port 5000.
            </p>
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/signup">
          <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            Get Started Free
          </button>
        </Link>
        <Link href="/login">
          <button style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            borderRadius: '10px',
            padding: '0.75rem 2rem',
            cursor: 'pointer',
          }}>
            Sign In
          </button>
        </Link>
      </div>
    </main>
  )
}