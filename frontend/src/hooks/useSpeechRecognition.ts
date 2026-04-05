'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
type SpeechRecognitionStatus =
  | 'idle'
  | 'listening'
  | 'stopped'
  | 'error'
  | 'unsupported'

type UseSpeechRecognitionReturn = {
  transcript:      string
  interimText:     string
  isListening:     boolean
  status:          SpeechRecognitionStatus
  error:           string | null
  isSupported:     boolean
  startListening:  () => void
  stopListening:   () => void
  clearTranscript: () => void
  setTranscript:   (text: string) => void
}

// ─────────────────────────────────────────
// HOOK
// To swap provider later (Whisper, Deepgram):
// Replace startListening() body only
// Keep return shape identical
// ─────────────────────────────────────────
export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript,  setTranscript]  = useState('')
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [status,      setStatus]      = useState<SpeechRecognitionStatus>('idle')
  const [error,       setError]       = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<any>(null)

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
    } else {
      setIsSupported(false)
      setStatus('unsupported')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setStatus('unsupported')
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }

    // Stop existing session if any
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.lang            = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setStatus('listening')
      setError(null)
    }

    recognition.onresult = (event: any) => {
      let finalText   = ''
      let interimTemp = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimTemp += result[0].transcript
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText)
      }
      setInterimText(interimTemp)
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      setStatus('error')

      const errorMessages: Record<string, string> = {
        'not-allowed':       'Microphone access denied. Allow microphone in browser settings.',
        'no-speech':         'No speech detected. Try speaking closer to the microphone.',
        'network':           'Network error. Check your connection.',
        'audio-capture':     'No microphone found. Connect a microphone and try again.',
        'service-not-allowed': 'Speech service not allowed. Try Chrome.',
      }

      setError(errorMessages[event.error] || `Speech error: ${event.error}`)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      setStatus('stopped')
    }

    try {
      recognition.start()
    } catch (err) {
      setError('Could not start microphone. Try again.')
      setStatus('error')
    }

  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimText('')
    setStatus('stopped')
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
    setInterimText('')
  }, [])

  return {
    transcript,
    interimText,
    isListening,
    status,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
  }
}