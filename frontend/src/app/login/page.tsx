'use client'

import { useState }      from 'react'
import { useRouter }     from 'next/navigation'
import Link              from 'next/link'
import { login, saveToken, saveUser } from '@/lib/authService'

export default function LoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await login(email, password)

      if (!res.success || !res.data) {
        setError(res.message || 'Login failed.')
        return
      }

      // Save token to localStorage AND cookie (middleware reads cookie)
      saveToken(res.data.token)
      saveUser(res.data.user)
      document.cookie = `prepai_token=${res.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`

      router.push('/dashboard')

    } catch {
      setError('Could not connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Pick up where you left off.
        </p>

        {/* Error message */}
        {error && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#FF6B6B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PASSWORD</label>
              <Link href="#" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Forgot password?</Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)' }}>Sign up free</Link>
        </p>
      </div>
    </main>
  )
}