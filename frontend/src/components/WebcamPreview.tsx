'use client'

import { useEffect, useRef, useState } from 'react'

type WebcamPreviewProps = {
  stream:      MediaStream | null
  isRecording: boolean
  isMinimized: boolean
  onToggle:    () => void
}

export default function WebcamPreview({
  stream,
  isRecording,
  isMinimized,
  onToggle,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream) return null

  return (
    <div style={{
      position:     'fixed',
      bottom:       '2rem',
      right:        '2rem',
      zIndex:       100,
      borderRadius: '12px',
      overflow:     'hidden',
      border:       `2px solid ${isRecording ? '#FF6B6B' : 'var(--border)'}`,
      background:   'var(--bg-card)',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
      transition:   'all 0.3s ease',
      width:        isMinimized ? '80px'  : '220px',
      height:       isMinimized ? '60px'  : '165px',
    }}>

      {/* Recording indicator */}
      {isRecording && (
        <div style={{
          position:   'absolute',
          top:        '8px',
          left:       '8px',
          zIndex:     10,
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '999px',
          padding:    '2px 8px',
        }}>
          <span style={{
            width:        '7px',
            height:       '7px',
            borderRadius: '50%',
            background:   '#FF6B6B',
            animation:    'pulse-ring 1s ease infinite',
            display:      'inline-block',
          }} />
          {!isMinimized && (
            <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>
              REC
            </span>
          )}
        </div>
      )}

      {/* Toggle minimize button */}
      <button
        onClick={onToggle}
        title={isMinimized ? 'Expand camera' : 'Minimize camera'}
        style={{
          position:   'absolute',
          top:        '6px',
          right:      '6px',
          zIndex:     10,
          width:      '22px',
          height:     '22px',
          borderRadius: '50%',
          border:     'none',
          background: 'rgba(0,0,0,0.5)',
          color:      'white',
          fontSize:   '0.65rem',
          cursor:     'pointer',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isMinimized ? '⤢' : '⤡'}
      </button>

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width:      '100%',
          height:     '100%',
          objectFit:  'cover',
          transform:  'scaleX(-1)', // mirror effect
          display:    'block',
        }}
      />
    </div>
  )
}