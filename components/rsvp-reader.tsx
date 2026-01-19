"use client"

import { useEffect, useCallback, useRef, useState } from 'react'
import { useSettings } from '@/lib/settings-context'
import { useReading } from '@/lib/reading-context'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react'
import { processWord, type BionicOptions } from '@/lib/bionic-processor'
import { getWordsInRange } from '@/lib/reading-context'

export function RSVPReader() {
  const { settings, updateSettings } = useSettings()
  const { content, words, currentIndex, setCurrentIndex, isPlaying, setIsPlaying } = useReading()
  const [localWpm, setLocalWpm] = useState(settings.wpm)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Get word count from content metadata
  const totalWords = content?.wordCount || 0
  const progress = totalWords > 0 ? ((currentIndex + 1) / totalWords) * 100 : 0
  
  const wordsPerGroup = settings.readingMode === 'rsvp-single' ? 1 : settings.wordsPerGroup
  
  // Get current word(s) to display - uses pre-parsed word array from context
  const getCurrentWords = useCallback(() => {
    if (!words || words.length === 0 || totalWords === 0) return ''
    if (currentIndex >= totalWords) return ''
    return getWordsInRange(words, currentIndex, wordsPerGroup).join(' ')
  }, [words, totalWords, currentIndex, wordsPerGroup])
  
  // Calculate interval from WPM
  const getIntervalMs = useCallback(() => {
    return (60 / localWpm) * 1000 * wordsPerGroup
  }, [localWpm, wordsPerGroup])
  
  // Advance to next word(s)
  const advance = useCallback(() => {
    if (totalWords === 0) return
    setCurrentIndex(prev => {
      const next = prev + wordsPerGroup
      if (next >= totalWords) {
        setIsPlaying(false)
        return Math.max(0, totalWords - 1)
      }
      return next
    })
  }, [wordsPerGroup, totalWords, setCurrentIndex, setIsPlaying])
  
  // Go back
  const goBack = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - wordsPerGroup))
  }, [wordsPerGroup, setCurrentIndex])
  
  // Jump to position
  const jumpTo = useCallback((position: number) => {
    const index = Math.floor((position / 100) * totalWords)
    setCurrentIndex(Math.min(Math.max(0, index), totalWords - 1))
  }, [totalWords, setCurrentIndex])
  
  // Reset to beginning
  const reset = useCallback(() => {
    setCurrentIndex(0)
    setIsPlaying(false)
  }, [setCurrentIndex, setIsPlaying])
  
  // Skip back 10 words
  const skipBack = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 10))
  }, [setCurrentIndex])
  
  // Skip forward 10 words
  const skipForward = useCallback(() => {
    setCurrentIndex(prev => Math.min(totalWords - 1, prev + 10))
  }, [totalWords, setCurrentIndex])
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (currentIndex >= totalWords - 1 && !isPlaying) {
      setCurrentIndex(0)
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, currentIndex, totalWords, setIsPlaying, setCurrentIndex])
  
  // Auto-advance effect
  useEffect(() => {
    if (isPlaying && settings.autoAdvance && totalWords > 0) {
      const interval = getIntervalMs()
      intervalRef.current = setInterval(advance, interval)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, settings.autoAdvance, advance, getIntervalMs, totalWords])
  
  // TTS effect
  useEffect(() => {
    if (!settings.ttsEnabled || !isPlaying) {
      if (utteranceRef.current) {
        window.speechSynthesis?.cancel()
      }
      return
    }
    
    const currentWord = getCurrentWords()
    if (currentWord && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(currentWord)
      utterance.rate = settings.ttsRate
      utterance.pitch = settings.ttsPitch
      
      if (settings.ttsVoice) {
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find(v => v.name === settings.ttsVoice)
        if (voice) utterance.voice = voice
      }
      
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
    
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [currentIndex, isPlaying, settings.ttsEnabled, settings.ttsRate, settings.ttsPitch, settings.ttsVoice, getCurrentWords])
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          advance()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goBack()
          break
        case 'ArrowUp':
          e.preventDefault()
          setLocalWpm(prev => Math.min(1000, prev + 25))
          break
        case 'ArrowDown':
          e.preventDefault()
          setLocalWpm(prev => Math.max(100, prev - 25))
          break
        case 'KeyR':
          e.preventDefault()
          reset()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, advance, goBack, reset])
  
  // Sync local WPM with settings - only when user changes it, not on initial load
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    updateSettings({ wpm: localWpm })
  }, [localWpm]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Auto-start reading when content loads
  const hasAutoStarted = useRef(false)
  const contentIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Reset auto-start flag when content changes
    if (content?.id !== contentIdRef.current) {
      hasAutoStarted.current = false
      contentIdRef.current = content?.id || null
    }
    
    if (content && totalWords > 0 && settings.autoStartReading && settings.autoAdvance && !hasAutoStarted.current) {
      hasAutoStarted.current = true
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        setIsPlaying(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [content, totalWords, settings.autoStartReading, settings.autoAdvance, setIsPlaying])
  
  const fontClass = {
    default: 'font-reader-default',
    dyslexic: 'font-reader-dyslexic',
    hyperlegible: 'font-reader-hyperlegible',
    serif: 'font-reader-serif',
    mono: 'font-reader-mono',
  }[settings.readerFont]
  
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">No content loaded</p>
        <p className="text-sm mt-2">Import text to start reading</p>
      </div>
    )
  }
  
  const currentWord = getCurrentWords()
  
  // Bionic options for processing
  const bionicOptions: BionicOptions = {
    style: settings.bionicStyle,
    fixationStrength: settings.fixationStrength,
    saccadeRhythm: 1, // Always process every word in RSVP
    skipCommonWords: false, // Don't skip in RSVP mode
    opacity: settings.bionicOpacity,
  }

  // Get highlight style based on settings
  const getHighlightStyle = () => {
    switch (settings.bionicStyle) {
      case 'bold-start':
      case 'bold-center':
        return { fontWeight: 700 }
      case 'color-start':
      case 'color-center':
        return { color: 'var(--bionic-accent)' }
      case 'opacity':
        return { fontWeight: 600 }
      default:
        return { fontWeight: 700 }
    }
  }

  const getRestStyle = () => {
    if (settings.bionicStyle === 'opacity') {
      return { opacity: settings.bionicOpacity }
    }
    return {}
  }

  // Render a single word with bionic processing
  const renderBionicWord = (word: string, index: number) => {
    const processed = processWord(word, bionicOptions, index)
    
    if (processed.isSkipped || !word.trim()) {
      return <span key={index}>{word}</span>
    }

    // Handle center-based highlighting
    if (processed.rest.includes('|CENTER|')) {
      const [before, after] = processed.rest.split('|CENTER|')
      return (
        <span key={index}>
          <span style={getRestStyle()}>{before}</span>
          <span style={getHighlightStyle()}>{processed.highlighted}</span>
          <span style={getRestStyle()}>{after}</span>
        </span>
      )
    }

    return (
      <span key={index}>
        <span style={getHighlightStyle()}>{processed.highlighted}</span>
        <span style={getRestStyle()}>{processed.rest}</span>
      </span>
    )
  }

  // Calculate focal point (center letter for highlighting)
  const renderFocalWord = () => {
    if (!currentWord) return null
    
    // Apply bionic reading if enabled
    if (settings.bionicEnabled) {
      // Split into words for multi-word mode
      const wordList = currentWord.split(' ')
      
      if (wordList.length === 1) {
        // Single word - render with bionic
        return (
          <span className={fontClass}>
            {renderBionicWord(currentWord, 0)}
          </span>
        )
      }
      
      // Multi-word mode - render each word with bionic, preserve spaces
      return (
        <span className={fontClass}>
          {wordList.map((word, index) => (
            <span key={index}>
              {renderBionicWord(word, index)}
              {index < wordList.length - 1 && ' '}
            </span>
          ))}
        </span>
      )
    }
    
    return <span className={fontClass}>{currentWord}</span>
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Main display area */}
      <div className="flex-1 flex items-center justify-center relative rsvp-focus-line min-h-[300px]">
        <div
          className={cn(
            "text-center px-8 transition-opacity duration-75",
            settings.reducedMotion && "transition-none"
          )}
          style={{
            fontSize: `${Math.min(settings.fontSize * 2.5, 72)}px`,
            lineHeight: 1.2,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {renderFocalWord()}
        </div>
        
        {/* Focal point indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-px h-8 bg-primary/20 absolute -top-12 left-1/2 -translate-x-1/2" />
          <div className="w-px h-8 bg-primary/20 absolute -bottom-12 left-1/2 -translate-x-1/2" />
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const position = ((e.clientX - rect.left) / rect.width) * 100
            jumpTo(position)
          }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{currentIndex + 1} / {totalWords} words</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 space-y-4 border-t border-border">
        {/* Main playback controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            className="touch-target"
            aria-label="Reset to beginning"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={skipBack}
            className="touch-target"
            aria-label="Skip back 10 words"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="touch-target"
            aria-label="Previous word"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="h-14 w-14 rounded-full touch-target"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={advance}
            className="touch-target"
            aria-label="Next word"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            className="touch-target"
            aria-label="Skip forward 10 words"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}
            className={cn("touch-target", settings.ttsEnabled && "text-primary")}
            aria-label={settings.ttsEnabled ? 'Disable TTS' : 'Enable TTS'}
          >
            {settings.ttsEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Speed control */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground min-w-[60px]">
            {localWpm} WPM
          </span>
          <Slider
            value={[localWpm]}
            min={100}
            max={1000}
            step={25}
            onValueChange={([value]) => setLocalWpm(value)}
            className="flex-1"
            aria-label="Words per minute"
          />
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-muted-foreground text-center">
          <span className="hidden md:inline">
            Space: Play/Pause | Arrows: Navigate | R: Reset
          </span>
          <span className="md:hidden">
            Tap to advance manually
          </span>
        </div>
      </div>
    </div>
  )
}
