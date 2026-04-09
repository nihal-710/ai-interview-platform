'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
export type VoiceAnalytics = {
  wordsPerMinute:    number
  totalWords:        number
  fillerWordCount:   number
  fillerWordsFound:  string[]
  talkTimeSeconds:   number
  silenceSeconds:    number
  talkTimeRatio:     number
  answerStartDelay:  number
  avgAnswerDelay:    number
  longestPause:      number
  questionMetrics:   QuestionMetric[]
}

export type QuestionMetric = {
  questionIndex:   number
  wordsSpoken:     number
  timeTaken:       number
  startDelay:      number
  fillerCount:     number
  wordsPerMinute:  number
}

const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'literally',
  'actually', 'sort of', 'kind of', 'i mean', 'right',
  'so yeah', 'and um', 'er', 'hmm',
]

// ─────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────
export const useVoiceAnalytics = () => {
  const [analytics,    setAnalytics]    = useState<VoiceAnalytics | null>(null)
  const [isTracking,   setIsTracking]   = useState(false)

  const sessionStartRef   = useRef<number>(0)
  const questionStartRef  = useRef<number>(0)
  const firstWordTimeRef  = useRef<number | null>(null)
  const talkTimeRef       = useRef<number>(0)
  const pauseStartRef     = useRef<number | null>(null)
  const longestPauseRef   = useRef<number>(0)
  const allTranscriptsRef = useRef<string[]>([])
  const questionMetrics   = useRef<QuestionMetric[]>([])
  const currentQIndexRef  = useRef<number>(0)
  const startDelaysRef    = useRef<number[]>([])

  // Audio context for silence detection
  const audioContextRef   = useRef<AudioContext | null>(null)
  const analyserRef       = useRef<AnalyserNode | null>(null)
  const silenceTimerRef   = useRef<NodeJS.Timeout | null>(null)
  const isSpeakingRef     = useRef<boolean>(false)
  const totalSilenceRef   = useRef<number>(0)

  // ─────────────────────────────────────────
  // START TRACKING
  // ─────────────────────────────────────────
  const startTracking = useCallback(async (stream?: MediaStream) => {
    sessionStartRef.current  = Date.now()
    questionStartRef.current = Date.now()
    firstWordTimeRef.current = null
    talkTimeRef.current      = 0
    totalSilenceRef.current  = 0
    longestPauseRef.current  = 0
    allTranscriptsRef.current = []
    questionMetrics.current  = []
    startDelaysRef.current   = []
    setIsTracking(true)

    // Set up Web Audio silence detection if stream available
    if (stream && typeof AudioContext !== 'undefined') {
      try {
        const ctx      = new AudioContext()
        const analyser = ctx.createAnalyser()
        const source   = ctx.createMediaStreamSource(stream)

        analyser.fftSize            = 512
        analyser.smoothingTimeConstant = 0.8

        source.connect(analyser)

        audioContextRef.current = ctx
        analyserRef.current     = analyser

        // Start silence detection loop
        detectSilence(analyser)

      } catch {
        console.warn('[Voice Analytics] Audio context failed, skipping silence detection')
      }
    }
  }, [])

  // ─────────────────────────────────────────
  // SILENCE DETECTION via Web Audio API
  // ─────────────────────────────────────────
  const detectSilence = (analyser: AnalyserNode) => {
    const dataArray  = new Uint8Array(analyser.frequencyBinCount)
    const THRESHOLD  = 15 // Volume threshold for speech detection
    const CHECK_INTERVAL = 200 // Check every 200ms

    const check = () => {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length

      if (avg > THRESHOLD) {
        // Speaking
        if (!isSpeakingRef.current) {
          // Was silent — now speaking
          if (pauseStartRef.current !== null) {
            const pauseDuration = (Date.now() - pauseStartRef.current) / 1000
            totalSilenceRef.current  += pauseDuration
            longestPauseRef.current   = Math.max(longestPauseRef.current, pauseDuration)
            pauseStartRef.current     = null
          }
          isSpeakingRef.current = true
          talkTimeRef.current  += CHECK_INTERVAL / 1000
        } else {
          talkTimeRef.current += CHECK_INTERVAL / 1000
        }
      } else {
        // Silence
        if (isSpeakingRef.current) {
          // Was speaking — now silent
          pauseStartRef.current = Date.now()
          isSpeakingRef.current = false
        }
      }

      silenceTimerRef.current = setTimeout(check, CHECK_INTERVAL)
    }

    check()
  }

  // ─────────────────────────────────────────
  // RECORD FIRST WORD TIME (call when user starts answering)
  // ─────────────────────────────────────────
  const recordAnswerStart = useCallback(() => {
    if (firstWordTimeRef.current === null) {
      firstWordTimeRef.current = Date.now()
    }
  }, [])

  // ─────────────────────────────────────────
  // ON QUESTION CHANGE
  // ─────────────────────────────────────────
  const onQuestionSubmit = useCallback((transcript: string, questionIndex: number) => {
    const timeTaken  = (Date.now() - questionStartRef.current) / 1000
    const startDelay = firstWordTimeRef.current
      ? (firstWordTimeRef.current - questionStartRef.current) / 1000
      : timeTaken * 0.3

    const words        = transcript.trim().split(/\s+/).filter(Boolean).length
    const wpm          = timeTaken > 0 ? Math.round((words / timeTaken) * 60) : 0
    const fillerCount  = countFillers(transcript)

    questionMetrics.current.push({
      questionIndex,
      wordsSpoken:    words,
      timeTaken:      Math.round(timeTaken),
      startDelay:     Math.round(startDelay * 10) / 10,
      fillerCount,
      wordsPerMinute: Math.min(wpm, 300),
    })

    startDelaysRef.current.push(startDelay)
    allTranscriptsRef.current.push(transcript)

    // Reset for next question
    questionStartRef.current = Date.now()
    firstWordTimeRef.current = null
    currentQIndexRef.current = questionIndex + 1

  }, [])

  // ─────────────────────────────────────────
  // STOP TRACKING + GENERATE ANALYTICS
  // ─────────────────────────────────────────
  const stopTracking = useCallback((): VoiceAnalytics => {
    setIsTracking(false)

    // Stop audio context
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    const fullTranscript   = allTranscriptsRef.current.join(' ')
    const totalWords       = fullTranscript.trim().split(/\s+/).filter(Boolean).length
    const sessionSecs      = (Date.now() - sessionStartRef.current) / 1000
    const talkTime         = Math.max(talkTimeRef.current, totalWords / 2.5)
    const silenceTime      = Math.max(0, sessionSecs - talkTime)
    const talkRatio        = sessionSecs > 0 ? Math.round((talkTime / sessionSecs) * 100) : 0
    const avgWPM           = talkTime > 0 ? Math.round((totalWords / talkTime) * 60) : 0
    const fillerData       = findFillers(fullTranscript)
    const avgDelay         = startDelaysRef.current.length > 0
      ? Math.round((startDelaysRef.current.reduce((a, b) => a + b, 0) / startDelaysRef.current.length) * 10) / 10
      : 0

    const result: VoiceAnalytics = {
      wordsPerMinute:   Math.min(avgWPM, 300),
      totalWords,
      fillerWordCount:  fillerData.count,
      fillerWordsFound: fillerData.found,
      talkTimeSeconds:  Math.round(talkTime),
      silenceSeconds:   Math.round(silenceTime),
      talkTimeRatio:    Math.min(talkRatio, 100),
      answerStartDelay: avgDelay,
      avgAnswerDelay:   avgDelay,
      longestPause:     Math.round(longestPauseRef.current * 10) / 10,
      questionMetrics:  questionMetrics.current,
    }

    setAnalytics(result)
    return result

  }, [])

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const countFillers = (text: string): number => {
    const lower = text.toLowerCase()
    return FILLER_WORDS.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      return count + (lower.match(regex)?.length || 0)
    }, 0)
  }

  const findFillers = (text: string): { count: number; found: string[] } => {
    const lower = text.toLowerCase()
    const found: string[] = []
    let count = 0

    FILLER_WORDS.forEach((word) => {
      const regex   = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lower.match(regex)
      if (matches) {
        count += matches.length
        found.push(`${word} (×${matches.length})`)
      }
    })

    return { count, found }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  return {
    analytics,
    isTracking,
    startTracking,
    stopTracking,
    recordAnswerStart,
    onQuestionSubmit,
  }
}



