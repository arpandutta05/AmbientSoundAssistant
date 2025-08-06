import { useState, useRef, useCallback } from 'react'

export const useAudioProcessor = () => {
  const [isActive, setIsActive] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState(null)

  const audioContextRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteTimeDomainData(dataArray)
    
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / dataArray.length)
    const level = Math.round(rms * 100 * 3)
    
    setAudioLevel(Math.min(100, level))
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }, [])

  return {
    isActive,
    setIsActive,
    audioLevel,
    error,
    setError,
    audioContextRef,
    streamRef,
    analyserRef,
    cleanup,
    updateAudioLevel
  }
}
