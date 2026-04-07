'use client'

import { useState, useRef }  from 'react'
import Link                   from 'next/link'
import { getToken }           from '@/lib/authService'

const API = process.env.NEXT_PUBLIC_API_URL

const ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'AI Engineer',
  'Product Manager',
  'DevOps Engineer',
]

type ResumeResult = {
  id:              string
  fileName:        string
  targetRole:      string
  resumeScore:     number
  matchedSkills:   string[]
  missingSkills:   string[]
  focusAreas:      string[]
  recommendations: string[]
  uploadedAt:      string
}

const scoreColor = (score: number) =>
  score >= 80 ? '#00E5B0' : score >= 60 ? '#FFD166' : '#FF6B6B'

const scoreLabel = (score: number) =>
  score >= 80 ? 'Excellent match'
  : score >= 60 ? 'Good match'
  : score >= 40 ? 'Moderate match'
  : 'Needs improvement'

export default function ResumePage() {
  const [file,       setFile]       = useState<File | null>(null)
  const [role,       setRole]       = useState('Software Engineer')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<ResumeResult | null>(null)
  const [error,      setError]      = useState('')
  const [dragOver,   setDragOver]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File | null) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }
    setError('')
    setFile(f)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      const token    = getToken()
      const formData = new FormData()
      formData.append('resume',     file)
      formData.append('targetRole', role)

      const res  = await fetch(`${API}/resume/upload`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body:    formData,
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Upload failed.')
        return
      }

      setResult(data.data.resume)

    } catch {
      setError('Could not connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2rem', maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <span className="tag">RESUME ANALYSER</span>
      </div>

      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Resume <span style={{ color: 'var(--accent)' }}>Analysis</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Upload your resume and get AI-powered feedback for your target role.
        </p>
      </div>

      {/* Upload card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Role selector */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
            Target Role
          </label>
          <select
            className="field"
            style={{ maxWidth: '320px' }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files[0] || null)
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border:        `2px dashed ${dragOver ? 'var(--accent)' : file ? '#00E5B0' : 'var(--border)'}`,
            borderRadius:  '12px',
            padding:       '2.5rem',
            textAlign:     'center',
            cursor:        'pointer',
            background:    dragOver ? 'rgba(108,99,255,0.05)' : 'var(--bg-surface)',
            transition:    'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {file ? '✅' : '📄'}
          </p>
          {file ? (
            <>
              <p style={{ fontWeight: 600, color: '#00E5B0', marginBottom: '0.25rem' }}>{file.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(0)} KB · Click to change
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Drop your resume here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                PDF only · Max 5MB · Click to browse
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#FF6B6B', fontSize: '0.875rem', padding: '0.75rem', background: 'rgba(255,107,107,0.08)', borderRadius: '8px' }}>
            {error}
          </p>
        )}

        {/* Upload button */}
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || loading}
          style={{ opacity: !file || loading ? 0.6 : 1 }}
        >
          {loading ? '🤖 AI is analysing your resume...' : 'Analyse Resume →'}
        </button>

        {loading && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            This may take 15–30 seconds. Ollama is reading your resume...
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Score hero */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Score ring */}
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={scoreColor(result.resumeScore)}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - result.resumeScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(result.resumeScore) }}>
                  {result.resumeScore}
                </span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {result.targetRole}
              </p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {scoreLabel(result.resumeScore)}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {result.fileName} · {new Date(result.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Skills grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Matched skills */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#00E5B0', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '1rem' }}>
                ✓ MATCHED SKILLS ({result.matchedSkills.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.matchedSkills.map((skill) => (
                  <span key={skill} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(0,229,176,0.1)', color: '#00E5B0', border: '1px solid rgba(0,229,176,0.25)' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing skills */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#FF6B6B', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '1rem' }}>
                ✗ MISSING SKILLS ({result.missingSkills.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.missingSkills.map((skill) => (
                  <span key={skill} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.25)' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Focus areas + Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#FFD166', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '1rem' }}>
                🎯 FOCUS AREAS
              </p>
              {result.focusAreas.map((area, i) => (
                <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#FFD166', flexShrink: 0 }}>→</span>
                  {area}
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '1rem' }}>
                💡 RECOMMENDATIONS
              </p>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{i + 1}.</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/interview">
              <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                Practice Interview →
              </button>
            </Link>
            <button
              onClick={() => { setFile(null); setResult(null) }}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', padding: '0.75rem 2rem', cursor: 'pointer' }}
            >
              Upload Another Resume
            </button>
          </div>
        </>
      )}
    </div>
  )
}