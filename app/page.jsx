"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Mic, MicOff, Volume2, VolumeX, Headphones, AlertCircle, Play, Pause, Sun, Moon, Info, Zap, Shield, Waves, Filter, Volume1 } from 'lucide-react'

export default function AmbientSoundApp() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [micGain, setMicGain] = useState([80])
  const [outputVolume, setOutputVolume] = useState([60])
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)
  const [echoCancel, setEchoCancel] = useState(true)
  const [noiseSuppress, setNoiseSuppress] = useState(true)
  const [autoGainControl, setAutoGainControl] = useState(false)
  const [latencyMode, setLatencyMode] = useState('interactive')

  // Audio processing refs
  const audioContextRef = useRef(null)
  const streamRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const gainNodeRef = useRef(null)
  const outputGainRef = useRef(null)
  const analyserRef = useRef(null)
  const compressorRef = useRef(null)
  const filterRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Define cleanup function first
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
    
    // Clear all references
    sourceNodeRef.current = null
    gainNodeRef.current = null
    outputGainRef.current = null
    analyserRef.current = null
    compressorRef.current = null
    filterRef.current = null
  }, [])

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteTimeDomainData(dataArray)
    
    // Calculate RMS for more accurate level detection
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / dataArray.length)
    const level = Math.round(rms * 100 * 3) // Amplify for better visibility
    
    setAudioLevel(Math.min(100, level))
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }, [])

  const createOptimizedAudioChain = useCallback(async (stream) => {
    // Create audio context with optimal settings for low latency
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: latencyMode,
      sampleRate: 44100
    })

    // Resume context if needed
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    // Create source with minimal processing delay
    const source = audioContext.createMediaStreamSource(stream)
    
    // Create processing nodes
    const inputGain = audioContext.createGain()
    const compressor = audioContext.createDynamicsCompressor()
    const filter = audioContext.createBiquadFilter()
    const outputGain = audioContext.createGain()
    const analyser = audioContext.createAnalyser()

    // Configure compressor for better audio quality
    compressor.threshold.value = -24
    compressor.knee.value = 30
    compressor.ratio.value = 12
    compressor.attack.value = 0.003
    compressor.release.value = 0.25

    // Configure filter for noise reduction
    filter.type = 'highpass'
    filter.frequency.value = noiseSuppress ? 200 : 80
    filter.Q.value = 1

    // Configure analyser for real-time feedback
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.3

    // Connect audio chain: source -> inputGain -> compressor -> filter -> analyser -> outputGain -> destination
    source.connect(inputGain)
    inputGain.connect(compressor)
    compressor.connect(filter)
    filter.connect(analyser)
    analyser.connect(outputGain)
    outputGain.connect(audioContext.destination)

    // Set initial values
    inputGain.gain.value = micGain[0] / 100
    outputGain.gain.value = outputVolume[0] / 100

    // Store references
    audioContextRef.current = audioContext
    sourceNodeRef.current = source
    gainNodeRef.current = inputGain
    outputGainRef.current = outputGain
    analyserRef.current = analyser
    compressorRef.current = compressor
    filterRef.current = filter

    return { audioContext, source, inputGain, outputGain, analyser }
  }, [latencyMode, noiseSuppress, micGain, outputVolume])

  const startAmbientSound = useCallback(async () => {
    try {
      setError(null)
      
      // Request microphone with optimized settings for low latency
      const constraints = {
        audio: {
          echoCancellation: echoCancel,
          noiseSuppression: noiseSuppress,
          autoGainControl: autoGainControl,
          sampleRate: 44100,
          sampleSize: 16,
          channelCount: 1,
          latency: 0.01, // Request 10ms latency
          volume: 1.0
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Create optimized audio processing chain
      await createOptimizedAudioChain(stream)
      
      setIsActive(true)
      updateAudioLevel()

      // Update media session
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
      
    } catch (err) {
      console.error('Microphone access error:', err)
      let errorMessage = 'Microphone access failed. '
      
      switch (err.name) {
        case 'NotAllowedError':
          errorMessage += 'Please allow microphone access in your browser settings.'
          break
        case 'NotFoundError':
          errorMessage += 'No microphone detected. Please connect a microphone.'
          break
        case 'NotReadableError':
          errorMessage += 'Microphone is being used by another application.'
          break
        default:
          errorMessage += 'Please check your audio settings and try again.'
      }
      
      setError(errorMessage)
    }
  }, [autoGainControl, echoCancel, noiseSuppress, createOptimizedAudioChain, updateAudioLevel])

  const stopAmbientSound = useCallback(() => {
    cleanup()
    setIsActive(false)
    setAudioLevel(0)

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused'
    }
  }, [cleanup])

  const updateMicGain = useCallback((value) => {
    setMicGain(value)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value[0] / 100
    }
  }, [])

  const updateOutputVolume = useCallback((value) => {
    const volume = Array.isArray(value) ? value[0] : value
    setOutputVolume([volume])
    if (outputGainRef.current) {
      outputGainRef.current.gain.value = volume / 100
    }
  }, [])

  const toggleEchoCancel = useCallback(() => {
    setEchoCancel(!echoCancel)
    if (isActive) {
      // Restart with new settings
      stopAmbientSound()
      setTimeout(startAmbientSound, 100)
    }
  }, [echoCancel, isActive, startAmbientSound, stopAmbientSound])

  const toggleNoiseSuppress = useCallback(() => {
    setNoiseSuppress(!noiseSuppress)
    if (filterRef.current) {
      filterRef.current.frequency.value = !noiseSuppress ? 200 : 80
    }
    if (isActive && !noiseSuppress) {
      // Restart for echo cancellation change
      stopAmbientSound()
      setTimeout(startAmbientSound, 100)
    }
  }, [isActive, noiseSuppress, startAmbientSound, stopAmbientSound])

  const toggleAutoGain = useCallback(() => {
    setAutoGainControl(!autoGainControl)
    if (isActive) {
      stopAmbientSound()
      setTimeout(startAmbientSound, 100)
    }
  }, [autoGainControl, isActive, startAmbientSound, stopAmbientSound])

  useEffect(() => {
    // Check browser support
    if (!navigator.mediaDevices || !window.AudioContext) {
      setIsSupported(false)
      setError("Your browser doesn't support required audio features. Please use Chrome, Firefox, or Safari.")
      return
    }

    // Enhanced Media Session API setup
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Ambient Sound Assistant',
        artist: 'Hearing Aid App',
        album: 'Accessibility Tools',
        artwork: [
          { src: '/placeholder.svg?height=96&width=96', sizes: '96x96', type: 'image/svg+xml' },
          { src: '/placeholder.svg?height=128&width=128', sizes: '128x128', type: 'image/svg+xml' },
          { src: '/placeholder.svg?height=256&width=256', sizes: '256x256', type: 'image/svg+xml' }
        ]
      })

      // Media session action handlers - use inline functions to avoid dependency issues
      navigator.mediaSession.setActionHandler('play', () => {
        if (!isActive) {
          startAmbientSound()
        }
      })
      
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isActive) {
          stopAmbientSound()
        }
      })
      
      navigator.mediaSession.setActionHandler('stop', () => {
        cleanup()
        setIsActive(false)
        setAudioLevel(0)
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused'
        }
      })
      
      // Volume controls
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const newVolume = Math.max(0, outputVolume[0] - 10)
        setOutputVolume([newVolume])
        if (outputGainRef.current) {
          outputGainRef.current.gain.value = newVolume / 100
        }
      })
      
      navigator.mediaSession.setActionHandler('seekforward', () => {
        const newVolume = Math.min(100, outputVolume[0] + 10)
        setOutputVolume([newVolume])
        if (outputGainRef.current) {
          outputGainRef.current.gain.value = newVolume / 100
        }
      })
    }

    return () => {
      cleanup()
    }
  }, [cleanup])

  const themeClasses = useMemo(() => 
    isDarkMode 
      ? "min-h-screen bg-black text-white" 
      : "min-h-screen bg-white text-black"
  , [isDarkMode])

  const cardClasses = useMemo(() => 
    isDarkMode 
      ? "bg-gray-900 border-gray-800 text-white" 
      : "bg-white border-gray-200 text-black"
  , [isDarkMode])

  const buttonClasses = useMemo(() => 
    isDarkMode 
      ? "bg-white text-black hover:bg-gray-200" 
      : "bg-black text-white hover:bg-gray-800"
  , [isDarkMode])

  if (!isSupported) {
    return (
      <div className={themeClasses}>
        <div className="flex items-center justify-center p-4">
          <Card className={`w-full max-w-md ${cardClasses} border-red-500`}>
            <CardHeader className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-500">Browser Not Supported</CardTitle>
              <CardDescription className="text-red-400">
                Please use Chrome, Firefox, or Safari for the best experience.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <React.StrictMode>
      <div className={themeClasses}>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          
          {/* Header with Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Headphones className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Ambient Sound Assistant</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time hearing aid
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Control Panel */}
          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <>
                      <div className="relative">
                        <Mic className="w-5 h-5 text-green-500" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      </div>
                      <span className="text-green-500">ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-500">READY</span>
                    </>
                  )}
                </div>
                <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {isActive ? 'LISTENING' : 'STOPPED'}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              
              {/* Audio Level Display */}
              {isActive && (
                <AudioLevelDisplay audioLevel={audioLevel} isDarkMode={isDarkMode} />
              )}

              {/* Volume Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Microphone Gain */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Microphone Gain
                    </span>
                    <Badge variant="secondary">{micGain[0]}%</Badge>
                  </div>
                  <Slider
                    value={micGain}
                    onValueChange={updateMicGain}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Controls how sensitive the microphone is to outside sounds
                  </p>
                </div>

                {/* Output Volume */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      {outputVolume[0] > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      Output Volume
                    </span>
                    <Badge variant="secondary">{outputVolume[0]}%</Badge>
                  </div>
                  <Slider
                    value={outputVolume}
                    onValueChange={updateOutputVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Controls the volume of sound played through your headphones
                  </p>
                </div>
              </div>

              <Separator className={isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} />

              {/* Audio Processing Controls */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Audio Processing
                </h3>
                
                <div className="grid gap-4">
                  
                  {/* Echo Cancellation */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-medium text-sm">Echo Cancellation</span>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Prevents feedback and echo from speakers
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={echoCancel}
                      onCheckedChange={toggleEchoCancel}
                    />
                  </div>

                  {/* Noise Suppression */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Waves className="w-4 h-4 text-green-500" />
                      <div>
                        <span className="font-medium text-sm">Noise Suppression</span>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Reduces background noise and hum
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={noiseSuppress}
                      onCheckedChange={toggleNoiseSuppress}
                    />
                  </div>

                  {/* Auto Gain Control */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Volume1 className="w-4 h-4 text-purple-500" />
                      <div>
                        <span className="font-medium text-sm">Auto Gain Control</span>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Automatically adjusts volume levels
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={autoGainControl}
                      onCheckedChange={toggleAutoGain}
                    />
                  </div>
                </div>
              </div>

              <Separator className={isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} />

              {/* Main Control Button */}
              <Button
                onClick={isActive ? stopAmbientSound : startAmbientSound}
                className={`w-full h-16 text-lg font-semibold ${
                  isActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : buttonClasses
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-6 h-6 mr-3" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 mr-3" />
                    Start Listening
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {[
                  {
                    step: "1",
                    title: "Connect Headphones",
                    description: "Plug in your headphones or connect Bluetooth earbuds to your device."
                  },
                  {
                    step: "2", 
                    title: "Allow Microphone Access",
                    description: "Click 'Start Listening' and allow microphone access when prompted by your browser."
                  },
                  {
                    step: "3",
                    title: "Adjust Microphone Gain",
                    description: "Use the Microphone Gain slider to control how sensitive the app is to outside sounds."
                  },
                  {
                    step: "4",
                    title: "Set Output Volume", 
                    description: "Adjust Output Volume to a comfortable level. Start low and increase gradually."
                  },
                  {
                    step: "5",
                    title: "Configure Audio Processing",
                    description: "Enable Echo Cancellation to prevent feedback. Use Noise Suppression to reduce background noise."
                  },
                  {
                    step: "6",
                    title: "Use Device Controls",
                    description: "Control playback using your phone's volume buttons, notification panel, or lock screen controls."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Technical Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Audio Latency:</span>
                  <span className="font-medium">~10-20ms (Ultra Low)</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sample Rate:</span>
                  <span className="font-medium">44.1 kHz</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Audio Quality:</span>
                  <span className="font-medium">16-bit PCM</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Processing:</span>
                  <span className="font-medium">Real-time DSP</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Warning */}
          <Alert className={`border-amber-500 ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className={`text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
              <strong>Hearing Safety:</strong> Always start with low volume levels and increase gradually. 
              Take regular breaks to protect your hearing. Be aware of your surroundings when using this app.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </React.StrictMode>
  )
}

const AudioLevelDisplay = React.memo(({ audioLevel, isDarkMode }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Waves className="w-4 h-4" />
          Audio Level
        </span>
        <Badge variant="outline">{audioLevel}%</Badge>
      </div>
      <div className={`w-full h-4 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div 
          className="h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-100"
          style={{ width: `${audioLevel}%` }}
        />
      </div>
    </div>
  );
});
