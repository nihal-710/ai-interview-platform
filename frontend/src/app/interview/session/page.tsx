'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams }                from 'next/navigation'
import { getToken, getUser }                         from '@/lib/authService'
import { useSpeechRecognition }                      from '@/hooks/useSpeechRecognition'
import { useVideoRecorder }                          from '@/hooks/useVideoRecorder'
import MicButton                                     from '@/components/MicButton'
import WebcamPreview                                 from '@/components/WebcamPreview'

type Question = {
  id:         string
  content:    string
  orderIndex: number
  category:   string
  difficulty: string
  response:   { answer: string } | null
}

type Session = {
  id:             string
  type:           string
  targetRole:     string
  status:         string
  totalQuestions: number
  answeredCount:  number
  questions:      Question[]
}

const API = process.env.NEXT_PUBLIC_API_URL

export default function InterviewSessionPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [session,       setSession]       = useState<Session | null>(null)
  const [currentIdx,    setCurrentIdx]    = useState(0)
  const [answer,        setAnswer]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState('')
  const [timer,         setTimer]         = useState(0)
  const [startTime,     setStartTime]     = useState(Date.now())
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [isMinimized,   setIsMinimized]   = useState(false)
  const [sessionDone,   setSessionDone]   = useState(false)

  // Interviewer gesture states
  const [gesture,        setGesture]        = useState<string | null>(null)
  const [showGesture,    setShowGesture]    = useState(false)
  const [gestureLoading, setGestureLoading] = useState(false)
  const gestureTimerRef  = useRef<NodeJS.Timeout | null>(null)

  const interviewType = searchParams.get('type') || 'BEHAVIORAL'
  const targetRole    = searchParams.get('role') || 'Software Engineer'
  const mode          = searchParams.get('mode') || 'text'
  const isVideoMode   = mode === 'video'

  // Get logged in user name
  const user          = getUser()
  const candidateName = user?.name?.split(' ')[0] || 'there'

  // Speech recognition
  const {
    transcript,
    interimText,
    isListening,
    isSupported:  speechSupported,
    error:        speechError,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
  } = useSpeechRecognition()

  // Video recorder
  const {
    isRecording,
    isSupported:  videoSupported,
    videoUrl,
    error:        videoError,
    streamRef,
    startCamera,
    startRecording,
    stopRecording,
    downloadVideo,
    releaseCamera,
  } = useVideoRecorder()

  // Sync speech to textarea
  useEffect(() => {
    if (transcript) setAnswer(transcript)
  }, [transcript])

  // Reset on question change
  useEffect(() => {
    clearTranscript()
    setAnswer('')
    setGesture(null)
    setShowGesture(false)
  }, [currentIdx])

  // Auto-start camera + mic in video mode
  useEffect(() => {
    if (isVideoMode && videoSupported && !loading) {
      const initVideo = async () => {
        await startCamera()
        setCameraEnabled(true)
        startRecording()
      }
      initVideo()

      if (speechSupported) startListening()
    }
  }, [isVideoMode, videoSupported, loading])

  // Start session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        const token = getToken()
        const res   = await fetch(`${API}/interview/start`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ interviewType, targetRole }),
        })
        const data = await res.json()
        if (!data.success) { setError(data.message); return }
        setSession(data.data.session)
        setStartTime(Date.now())
      } catch {
        setError('Could not start session. Make sure backend is running.')
      } finally {
        setLoading(false)
      }
    }
    startSession()
  }, [interviewType, targetRole])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseCamera()
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current)
    }
  }, [])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Fetch interviewer gesture after answer submission
  const fetchGesture = async (question: string, answer: string) => {
    setGestureLoading(true)
    try {
      const token = getToken()
      const res   = await fetch(`${API}/interview/${session?.id}/gesture`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question, answer, candidateName }),
      })
      const data = await res.json()
      if (data.success) {
        setGesture(data.data.gesture)
        setShowGesture(true)

        // Auto-hide gesture after 4 seconds
        gestureTimerRef.current = setTimeout(() => {
          setShowGesture(false)
        }, 4000)
      }
    } catch {
      // Silently fail — gesture is non-critical
    } finally {
      setGestureLoading(false)
    }
  }

  // Toggle camera manually (text mode)
  const handleToggleCamera = async () => {
    if (cameraEnabled) {
      stopRecording()
      releaseCamera()
      setCameraEnabled(false)
    } else {
      await startCamera()
      setCameraEnabled(true)
      startRecording()
    }
  }

  const handleSubmitAnswer = async () => {
    if (!session || !answer.trim()) return
    if (isListening) stopListening()
    setSubmitting(true)

    const currentQuestion = session.questions[currentIdx]
    const timeTaken       = Math.floor((Date.now() - startTime) / 1000)

    try {
      const token = getToken()

      // Submit answer
      await fetch(`${API}/interview/${session.id}/respond`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer:     answer.trim(),
          timeTaken,
        }),
      })

      // Fetch interviewer gesture in parallel
      fetchGesture(currentQuestion.content, answer.trim())

      // Wait briefly so gesture shows before moving
      await new Promise((r) => setTimeout(r, 2200))

      if (currentIdx < session.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1)
        setStartTime(Date.now())
        // Resume mic in video mode
        if (isVideoMode && speechSupported) startListening()
      } else {
        await handleComplete()
      }

    } catch {
      setError('Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = useCallback(async () => {
    if (!session) return
    if (isRecording) stopRecording()
    if (isListening) stopListening()

    try {
      const token = getToken()
      const res   = await fetch(`${API}/interview/${session.id}/complete`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setSessionDone(true)
    } catch {
      setError('Failed to complete session.')
    }
  }, [session, isRecording, isListening])

  // ── Loading ──
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>AI is generating your questions...</p>
      </main>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#FF6B6B' }}>{error}</p>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => router.push('/interview')}>
          Go Back
        </button>
      </main>
    )
  }

  // ── Session complete ──
  if (sessionDone) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Great job, {candidateName}!
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>AI is evaluating your answers...</p>
        </div>

        {videoUrl && session && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Your recording is ready</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Download your interview recording to review your performance.
            </p>
            <button
              onClick={() => downloadVideo(session.id)}
              style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 700, width: '100%', marginBottom: '0.75rem' }}
            >
              ⬇ Download Recording
            </button>
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 2rem' }}
          onClick={() => router.push(`/result?sessionId=${session?.id}`)}
        >
          View AI Results →
        </button>
      </main>
    )
  }

  if (!session) return null

  const currentQuestion = session.questions[currentIdx]
  const progress        = (currentIdx / session.questions.length) * 100
  const wordCount       = answer.trim().split(/\s+/).filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Webcam preview */}
      {cameraEnabled && streamRef.current && (
        <WebcamPreview
          stream={streamRef.current}
          isRecording={isRecording}
          isMinimized={isMinimized}
          onToggle={() => setIsMinimized((prev) => !prev)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="tag">{session.type.replace('_', ' ')}</span>
            {isVideoMode && (
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(0,229,176,0.1)', color: '#00E5B0', border: '1px solid rgba(0,229,176,0.2)' }}>
                🎥 VIDEO MODE
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            {session.targetRole}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Manual camera toggle — text mode only */}
          {!isVideoMode && videoSupported && (
            <button
              onClick={handleToggleCamera}
              title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: `1px solid ${cameraEnabled ? '#FF6B6B' : 'var(--border)'}`,
                background: cameraEnabled ? 'rgba(255,107,107,0.15)' : 'var(--bg-surface)',
                cursor: 'pointer', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {cameraEnabled ? '📵' : '📷'}
            </button>
          )}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
              {formatTime(timer)}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Question {currentIdx + 1} of {session.questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '999px' }}>
        <div style={{ height: '4px', background: 'var(--accent)', borderRadius: '999px', width: `${progress}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Interviewer gesture bubble */}
      {showGesture && gesture && (
        <div style={{
          display:      'flex',
          alignItems:   'flex-start',
          gap:          '0.75rem',
          padding:      '1rem 1.25rem',
          background:   'rgba(108,99,255,0.08)',
          border:       '1px solid rgba(108,99,255,0.25)',
          borderRadius: '14px',
          animation:    'fadeIn 0.3s ease',
        }}>
          {/* Interviewer avatar */}
          <div style={{
            width:          '36px',
            height:         '36px',
            borderRadius:   '50%',
            background:     'var(--accent)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '1rem',
            flexShrink:     0,
          }}>
            🤵
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              INTERVIEWER
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
              "{gesture}"
            </p>
          </div>
        </div>
      )}

      {/* Gesture loading */}
      {gestureLoading && !showGesture && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
            🤵
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 1s ease ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* Video error */}
      {videoError && (
        <p style={{ fontSize: '0.8rem', color: '#FF6B6B', padding: '0.5rem 0.75rem', background: 'rgba(255,107,107,0.08)', borderRadius: '8px' }}>
          Camera: {videoError}
        </p>
      )}

      {/* Question card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {currentQuestion.category}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: currentQuestion.difficulty === 'hard' ? '#FF6B6B' : currentQuestion.difficulty === 'easy' ? '#00E5B0' : '#FFD166' }}>
            {currentQuestion.difficulty?.toUpperCase()}
          </span>
        </div>
        <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.65 }}>
          {currentQuestion.content}
        </p>
      </div>

      {/* Answer area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your Answer
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isListening && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#FF6B6B', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B6B', animation: 'pulse-ring 1s ease infinite', display: 'inline-block' }} />
                {isVideoMode ? 'Listening...' : 'Recording...'}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wordCount} words</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            className="field"
            value={answer + (interimText ? ' ' + interimText : '')}
            onChange={(e) => {
              const val = e.target.value
              setAnswer(val)
              setTranscript(val)
            }}
            placeholder={
              isVideoMode
                ? 'Speak your answer — it will appear here automatically...'
                : speechSupported
                ? 'Type your answer or click 🎤 to speak...'
                : 'Type your answer here...'
            }
            rows={8}
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, paddingRight: '3.5rem' }}
          />
          <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
            <MicButton
              isListening={isListening}
              isSupported={speechSupported}
              onStart={startListening}
              onStop={stopListening}
            />
          </div>
        </div>

        {speechError && (
          <p style={{ fontSize: '0.8rem', color: '#FF6B6B', padding: '0.5rem 0.75rem', background: 'rgba(255,107,107,0.08)', borderRadius: '8px' }}>
            {speechError}
          </p>
        )}

        {interimText && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Hearing: "{interimText}"
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isVideoMode
              ? 'Video mode — speak naturally. Edit text if needed before submitting.'
              : 'Aim for 100–250 words · Edit spoken text before submitting'}
          </p>
          {answer && (
            <button
              onClick={() => { clearTranscript(); setAnswer('') }}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Save & Exit
        </button>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 2rem', opacity: submitting || !answer.trim() ? 0.6 : 1 }}
          onClick={handleSubmitAnswer}
          disabled={submitting || !answer.trim()}
        >
          {submitting
            ? 'Processing...'
            : currentIdx < session.questions.length - 1
            ? 'Next Question →'
            : 'Finish Interview →'}
        </button>
      </div>
    </div>
  )
}