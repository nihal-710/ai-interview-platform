'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
export type FacePresenceAnalytics = {
  faceDetectedPercent:  number
  lookingAwayCount:     number
  avgBrightness:        string
  totalChecks:          number
  presenceTimeline:     boolean[]
}

// ─────────────────────────────────────────
// HOOK — uses canvas pixel analysis
// No heavy ML library needed for basic presence
// ─────────────────────────────────────────
export const useFacePresence = () => {
  const [faceAnalytics, setFaceAnalytics] = useState<FacePresenceAnalytics | null>(null)
  const [isTracking,    setIsTracking]    = useState(false)
  const [faceVisible,   setFaceVisible]   = useState(true)

  const videoRef        = useRef<HTMLVideoElement | null>(null)
  const canvasRef       = useRef<HTMLCanvasElement | null>(null)
  const intervalRef     = useRef<NodeJS.Timeout | null>(null)
  const checksRef       = useRef<boolean[]>([])
  const lookAwayRef     = useRef<number>(0)
  const prevFaceRef     = useRef<boolean>(true)
  const brightnessRef   = useRef<number[]>([])
  const consecutiveFailsRef   = useRef<number>(0)

  // ─────────────────────────────────────────
  // START TRACKING
  // ─────────────────────────────────────────
  const startTracking = useCallback((stream: MediaStream) => {
    // Create hidden video element to read frames
    const video         = document.createElement('video')
    video.srcObject     = stream
    video.muted         = true
    video.playsInline   = true
    video.autoplay      = true
    video.style.display = 'none'
    document.body.appendChild(video)

    // Create hidden canvas for pixel analysis
    const canvas  = document.createElement('canvas')
    canvas.width  = 160
    canvas.height = 120
    canvas.style.display = 'none'
    document.body.appendChild(canvas)

    videoRef.current  = video
    canvasRef.current = canvas
    checksRef.current = []
    lookAwayRef.current   = 0
    brightnessRef.current = []
    consecutiveFailsRef.current = 0
    setIsTracking(true)

    // Check face presence every 3 seconds
    intervalRef.current = setInterval(() => {
      analyzeFrame(video, canvas)
    }, 3000)

  }, [])

  // ─────────────────────────────────────────
  // ANALYSE FRAME — pixel brightness heuristic
  // Center region brightness = face likely present
  // ─────────────────────────────────────────
  const analyzeFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Sample center region (where face should be)
    const centerX = Math.floor(canvas.width  * 0.25)
    const centerY = Math.floor(canvas.height * 0.15)
    const sampleW = Math.floor(canvas.width  * 0.5)
    const sampleH = Math.floor(canvas.height * 0.7)

    const imageData = ctx.getImageData(centerX, centerY, sampleW, sampleH)
    const pixels    = imageData.data

    // Calculate average brightness of center region
    let totalBrightness = 0
    let pixelCount      = 0

    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114)
      pixelCount++
    }

    const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0
    brightnessRef.current.push(avgBrightness)
    const consecutiveFailsRef = useRef<number>(0)

    // Heuristic: if center is too dark or too bright, face may not be present
    // Normal face in decent lighting: brightness 60-200
    const facePresent = avgBrightness > 40 && avgBrightness < 240

checksRef.current.push(facePresent)

// Only show warning after 3 consecutive failed checks (~9 seconds)
// This prevents false positives from lighting changes
consecutiveFailsRef.current = facePresent ? 0 : consecutiveFailsRef.current + 1
setFaceVisible(consecutiveFailsRef.current < 3)

// Detect look-away only on sustained absence
if (prevFaceRef.current && consecutiveFailsRef.current === 3) {
  lookAwayRef.current++
}
prevFaceRef.current = facePresent
  }

  // ─────────────────────────────────────────
  // STOP TRACKING
  // ─────────────────────────────────────────
  const stopTracking = useCallback((): FacePresenceAnalytics => {
    setIsTracking(false)

    if (intervalRef.current) clearInterval(intervalRef.current)

    // Cleanup DOM elements
    if (videoRef.current) {
      document.body.removeChild(videoRef.current)
      videoRef.current = null
    }
    if (canvasRef.current) {
      document.body.removeChild(canvasRef.current)
      canvasRef.current = null
    }

    const checks          = checksRef.current
    const presentCount    = checks.filter(Boolean).length
    const totalChecks     = checks.length || 1
    const facePercent     = Math.round((presentCount / totalChecks) * 100)

    const avgBright       = brightnessRef.current.length > 0
      ? brightnessRef.current.reduce((a, b) => a + b, 0) / brightnessRef.current.length
      : 128

    const brightnessLabel = avgBright < 60  ? 'Poor lighting'
      : avgBright < 100 ? 'Fair lighting'
      : avgBright < 180 ? 'Good lighting'
      : 'Bright lighting'

    const result: FacePresenceAnalytics = {
      faceDetectedPercent: facePercent,
      lookingAwayCount:    lookAwayRef.current,
      avgBrightness:       brightnessLabel,
      totalChecks,
      presenceTimeline:    checks,
    }

    setFaceAnalytics(result)
    return result

  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    faceAnalytics,
    faceVisible,
    isTracking,
    startTracking,
    stopTracking,
  }
}