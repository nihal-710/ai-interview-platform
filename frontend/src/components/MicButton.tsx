'use client'

type MicButtonProps = {
  isListening:    boolean
  isSupported:    boolean
  onStart:        () => void
  onStop:         () => void
}

export default function MicButton({
  isListening,
  isSupported,
  onStart,
  onStop,
}: MicButtonProps) {

  if (!isSupported) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          disabled
          title="Speech recognition not supported in this browser"
          style={{
            width: '44px', height: '44px',
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            cursor: 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.4,
          }}
        >
          🎤
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Use Chrome for voice input
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={isListening ? onStop : onStart}
      title={isListening ? 'Stop recording' : 'Start voice input'}
      style={{
        width: '44px', height: '44px',
        borderRadius: '50%',
        border: isListening
          ? '2px solid #FF6B6B'
          : '1px solid var(--border)',
        background: isListening
          ? 'rgba(255,107,107,0.15)'
          : 'var(--bg-surface)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
        transition: 'all 0.2s ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Pulse ring when listening */}
      {isListening && (
        <span style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '50%',
          border: '2px solid #FF6B6B',
          animation: 'pulse-ring 1.2s ease-out infinite',
          opacity: 0.6,
        }} />
      )}
      {isListening ? '⏹' : '🎤'}
    </button>
  )
}