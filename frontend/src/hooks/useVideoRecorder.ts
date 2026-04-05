'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
type RecordingStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'recording'
  | 'stopped'
  | 'error'
  | 'unsupported'

type UseVideoRecorderReturn = {
  status:          RecordingStatus
  isRecording:     boolean
  isSupported:     boolean
  videoBlob:       Blob | null
  videoUrl:        string | null
  error:           string | null
  streamRef:       React.RefObject<MediaStream | null>
  startCamera:     () => Promise<void>
  startRecording:  () => void
  stopRecording:   () => void
  downloadVideo:   (sessionId: string) => void
  releaseCamera:   () => void
}

// ─────────────────────────────────────────
// HOOK
// To upgrade to cloud upload later:
// Replace downloadVideo() with uploadVideo()
// Keep all other return values identical
// ─────────────────────────────────────────
export const useVideoRecorder = (): UseVideoRecorderReturn => {
  const [status,      setStatus]      = useState<RecordingStatus>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [videoBlob,   setVideoBlob]   = useState<Blob | null>(null)
  const [videoUrl,    setVideoUrl]    = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const streamRef      = useRef<MediaStream | null>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const blobUrlRef     = useRef<string | null>(null)

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'

    setIsSupported(supported)
    if (!supported) setStatus('unsupported')

    // Cleanup on unmount
    return () => {
      releaseCamera()
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  // ─────────────────────────────────────────
  // START CAMERA
  // ─────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setStatus('unsupported')
      setError('Camera recording is not supported in this browser.')
      return
    }

    setStatus('requesting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:     { ideal: 1280 },
          height:    { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      })

      streamRef.current = stream
      setStatus('ready')

    } catch (err: any) {
      setStatus('error')

      const messages: Record<string, string> = {
        NotAllowedError:  'Camera access denied. Allow camera in browser settings.',
        NotFoundError:    'No camera found. Connect a camera and try again.',
        NotReadableError: 'Camera is in use by another application.',
        OverconstrainedError: 'Camera does not support required settings.',
      }

      setError(messages[err.name] || `Camera error: ${err.message}`)
    }
  }, [isSupported])

  // ─────────────────────────────────────────
  // START RECORDING
  // ─────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('Camera not initialized. Call startCamera first.')
      return
    }

    chunksRef.current = []

    // Pick best supported format
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ].find((type) => MediaRecorder.isTypeSupported(type)) || ''

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType:    mimeType || undefined,
        videoBitsPerSecond: 1_000_000, // 1 Mbps — good quality, controlled size
      })

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        })

        // Revoke old URL if exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
        }

        const url        = URL.createObjectURL(blob)
        blobUrlRef.current = url

        setVideoBlob(blob)
        setVideoUrl(url)
        setIsRecording(false)
        setStatus('stopped')
      }

      recorder.onerror = () => {
        setError('Recording error occurred.')
        setIsRecording(false)
        setStatus('error')
      }

      recorderRef.current = recorder
      recorder.start(1000) // collect data every 1 second
      setIsRecording(true)
      setStatus('recording')

    } catch (err: any) {
      setError(`Could not start recording: ${err.message}`)
      setStatus('error')
    }
  }, [])

  // ─────────────────────────────────────────
  // STOP RECORDING
  // ─────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  // ─────────────────────────────────────────
  // DOWNLOAD VIDEO
  // ─────────────────────────────────────────
  const downloadVideo = useCallback((sessionId: string) => {
    if (!videoUrl) return

    const a       = document.createElement('a')
    a.href        = videoUrl
    a.download    = `interview-session-${sessionId}.webm`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

  }, [videoUrl])

  // ─────────────────────────────────────────
  // RELEASE CAMERA
  // ─────────────────────────────────────────
  const releaseCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (recorderRef.current) {
      if (recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      recorderRef.current = null
    }
    setIsRecording(false)
    setStatus('idle')
  }, [])

  return {
    status,
    isRecording,
    isSupported,
    videoBlob,
    videoUrl,
    error,
    streamRef,
    startCamera,
    startRecording,
    stopRecording,
    downloadVideo,
    releaseCamera,
  }
}