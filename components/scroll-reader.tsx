"use client"

import React from "react"

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSettings } from '@/lib/settings-context'
import { useReading } from '@/lib/reading-context'
import { BionicText } from './bionic-text'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

export function ScrollReader() {
  const { settings, updateSettings } = useSettings()
  const { content, words, isPlaying, setIsPlaying } = useReading()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollSpeed, setScrollSpeed] = useState(50) // pixels per second
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Tremor cancellation state
  const [tremorOffset, setTremorOffset] = useState({ x: 0, y: 0 })
  const motionBuffer = useRef<{ x: number; y: number }[]>([])
  
  // Focus mask positioning
  const [focusMaskPosition, setFocusMaskPosition] = useState(40) // percent from top
  
  // Virtualization state - only render visible paragraphs
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: settings.maxRenderParagraphs })
  
  // Use settings for virtualization parameters
  const PARAGRAPH_HEIGHT_ESTIMATE = settings.paragraphHeightEstimate
  const BUFFER_PARAGRAPHS = settings.virtualBufferSize
  const WORDS_PER_PARAGRAPH = settings.wordsPerChunk
  
  // Memoize paragraph generation to avoid recalculating on every render
  const paragraphs = React.useMemo(() => {
    // If we have stored content, use it (small texts)
    if (content?.content) {
      return content.content.split(/\n\n+/).filter(p => p.trim())
    }
    
    // For large texts, chunk words into paragraphs
    if (words?.length) {
      const chunks: string[] = []
      for (let i = 0; i < words.length; i += WORDS_PER_PARAGRAPH) {
        const chunk = words.slice(i, i + WORDS_PER_PARAGRAPH).join(' ')
        chunks.push(chunk)
      }
      return chunks
    }
    
    return []
  }, [content?.content, words])
  
  // Full text only needed for TTS - memoize it lazily
  const fullTextRef = useRef<string | null>(null)
  const getFullText = useCallback(() => {
    if (fullTextRef.current === null) {
      if (content?.content) {
        fullTextRef.current = content.content
      } else if (words?.length) {
        fullTextRef.current = words.join(' ')
      } else {
        fullTextRef.current = ''
      }
    }
    return fullTextRef.current
  }, [content?.content, words])
  
  // Reset fullTextRef when content changes
  useEffect(() => {
    fullTextRef.current = null
  }, [content?.id])
  
  // Update visible range on scroll (respects virtualization setting)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    // If virtualization is disabled, show all paragraphs
    if (!settings.enableVirtualization) {
      setVisibleRange(prev => {
        if (prev.start === 0 && prev.end === paragraphs.length) return prev
        return { start: 0, end: paragraphs.length }
      })
      return
    }
    
    const { scrollTop, clientHeight } = containerRef.current
    const startIndex = Math.max(0, Math.floor(scrollTop / PARAGRAPH_HEIGHT_ESTIMATE) - BUFFER_PARAGRAPHS)
    // maxRenderParagraphs controls how many paragraphs to render at once, not total limit
    const visibleCount = Math.min(
      Math.ceil(clientHeight / PARAGRAPH_HEIGHT_ESTIMATE) + BUFFER_PARAGRAPHS * 2,
      settings.maxRenderParagraphs
    )
    const endIndex = Math.min(paragraphs.length, startIndex + visibleCount)
    
    setVisibleRange(prev => {
      if (prev.start === startIndex && prev.end === endIndex) return prev
      return { start: startIndex, end: endIndex }
    })
  }, [paragraphs.length, settings.enableVirtualization, settings.maxRenderParagraphs, PARAGRAPH_HEIGHT_ESTIMATE, BUFFER_PARAGRAPHS])
  
  // Set up scroll listener for virtualization
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // Tremor cancellation using accelerometer
  useEffect(() => {
    if (!settings.tremorCancellation) {
      setTremorOffset({ x: 0, y: 0 })
      return
    }
    
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.x === null || acc.y === null) return
      
      // Add to buffer
      motionBuffer.current.push({ x: acc.x, y: acc.y })
      if (motionBuffer.current.length > 5) {
        motionBuffer.current.shift()
      }
      
      // Calculate average movement
      const avgX = motionBuffer.current.reduce((sum, v) => sum + v.x, 0) / motionBuffer.current.length
      const avgY = motionBuffer.current.reduce((sum, v) => sum + v.y, 0) / motionBuffer.current.length
      
      // Apply counter-movement (scaled and inverted)
      setTremorOffset({
        x: -avgX * 2,
        y: -avgY * 2
      })
    }
    
    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion)
      return () => window.removeEventListener('devicemotion', handleMotion)
    }
  }, [settings.tremorCancellation])
  
  // Tilt-to-scroll using gyroscope
  useEffect(() => {
    if (!settings.tiltToScroll || !containerRef.current) return
    
    let tiltInterval: NodeJS.Timeout | null = null
    let currentTilt = 0
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null) return
      // beta is front-back tilt: -180 to 180
      // Normalize around rest position (usually ~45 degrees when holding phone)
      const tiltThreshold = 10
      const restPosition = 45
      const tilt = (e.beta - restPosition)
      
      if (Math.abs(tilt) > tiltThreshold) {
        currentTilt = tilt * settings.tiltSensitivity * 0.5
      } else {
        currentTilt = 0
      }
    }
    
    const scrollByTilt = () => {
      if (containerRef.current && currentTilt !== 0) {
        containerRef.current.scrollTop += currentTilt
      }
    }
    
    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation)
      tiltInterval = setInterval(scrollByTilt, 50)
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation)
        if (tiltInterval) clearInterval(tiltInterval)
      }
    }
  }, [settings.tiltToScroll, settings.tiltSensitivity])
  
  // Volume rocker navigation (works on Android with physical buttons)
  useEffect(() => {
    if (!settings.volumeRockerNavigation) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Volume keys are mapped to AudioVolumeUp/AudioVolumeDown on some browsers
      if (e.key === 'AudioVolumeUp' || e.code === 'VolumeUp') {
        e.preventDefault()
        scrollUp()
      } else if (e.key === 'AudioVolumeDown' || e.code === 'VolumeDown') {
        e.preventDefault()
        scrollDown()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings.volumeRockerNavigation])
  
  // Auto-scroll animation
  const animate = useCallback((currentTime: number) => {
    if (!containerRef.current || !isPlaying) return
    
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime
    }
    
    const deltaTime = (currentTime - lastTimeRef.current) / 1000
    lastTimeRef.current = currentTime
    
    const scrollAmount = scrollSpeed * deltaTime
    containerRef.current.scrollTop += scrollAmount
    
    // Check if reached bottom
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsPlaying(false)
      return
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [isPlaying, scrollSpeed, setIsPlaying])
  
  useEffect(() => {
    if (isPlaying && !settings.reducedMotion) {
      lastTimeRef.current = 0
      animationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isPlaying, animate, settings.reducedMotion])
  
  // TTS for scroll mode
  useEffect(() => {
    const fullText = getFullText();
    if (!settings.ttsEnabled || !content || !isPlaying) {
      window.speechSynthesis?.cancel()
      return
    }
    
    // Read the full text with TTS
    const utterance = new SpeechSynthesisUtterance(fullText)
    utterance.rate = settings.ttsRate
    utterance.pitch = settings.ttsPitch
    
    if (settings.ttsVoice) {
      const voices = window.speechSynthesis.getVoices()
      const voice = voices.find(v => v.name === settings.ttsVoice)
      if (voice) utterance.voice = voice
    }
    
    utterance.onend = () => {
      setIsPlaying(false)
    }
    
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [settings.ttsEnabled, isPlaying, settings.ttsRate, settings.ttsPitch, settings.ttsVoice, content, setIsPlaying, getFullText])
  
  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])
  
  const scrollUp = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -200, behavior: 'smooth' })
    }
  }, [])
  
  const scrollDown = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: 200, behavior: 'smooth' })
    }
  }, [])
  
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
        case 'ArrowUp':
          e.preventDefault()
          scrollUp()
          break
        case 'ArrowDown':
          e.preventDefault()
          scrollDown()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, scrollUp, scrollDown])
  
  // Calculate focus mask dimensions
  const getFocusMaskHeight = () => {
    const lineHeight = settings.fontSize * settings.lineHeight
    return lineHeight * settings.focusMaskLines
  }
  
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">No content loaded</p>
        <p className="text-sm mt-2">Import text to start reading</p>
      </div>
    )
  }
  
  // Calculate vertical rhythm line styles using CSS custom properties
  const verticalLinesStyle = settings.verticalRhythmLines ? {
    '--rhythm-line-spacing': `${settings.verticalLineSpacing}px`,
    '--rhythm-line-color': `rgba(128, 128, 128, ${settings.verticalLineOpacity})`,
  } as React.CSSProperties : {}
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Focus Mask - Top */}
      {settings.focusMaskEnabled && (
        <>
          <div 
            className="focus-mask-top"
            style={{ 
              height: `calc(${focusMaskPosition}% - ${getFocusMaskHeight() / 2}px)`,
            }}
          />
          <div 
            className="focus-mask-bottom"
            style={{ 
              height: `calc(${100 - focusMaskPosition}% - ${getFocusMaskHeight() / 2}px)`,
            }}
          />
        </>
      )}
      
      {/* Reading area */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-8 smooth-reading",
          settings.reducedMotion && "scroll-auto",
          settings.enableSmoothScrolling && !settings.reducedMotion && "scroll-smooth",
          settings.verticalRhythmLines && "vertical-rhythm-lines"
        )}
        style={{
          backgroundColor: 'var(--reading-surface)',
          color: 'var(--reading-text)',
          ...verticalLinesStyle,
          transform: settings.tremorCancellation 
            ? `translate(${tremorOffset.x}px, ${tremorOffset.y}px)` 
            : undefined,
        }}
      >
        <div className="max-w-3xl mx-auto">
          {content.title && (
            <h1 
              className="text-2xl font-bold mb-8 text-center"
              style={{ fontSize: `${settings.fontSize * 1.5}px` }}
            >
              {content.title}
            </h1>
          )}
          
          {/* Virtualized paragraph list */}
          {settings.enableVirtualization ? (
            <div style={{ position: 'relative', height: `${paragraphs.length * PARAGRAPH_HEIGHT_ESTIMATE}px` }}>
              {/* Spacer for paragraphs before visible range */}
              <div style={{ height: `${visibleRange.start * PARAGRAPH_HEIGHT_ESTIMATE}px` }} />
              
              {/* Only render visible paragraphs */}
              {paragraphs.slice(visibleRange.start, visibleRange.end).map((paragraph, index) => (
                <div
                  key={visibleRange.start + index}
                  className="mb-6"
                  style={{ minHeight: `${PARAGRAPH_HEIGHT_ESTIMATE - 24}px` }}
                >
                  <BionicText
                    text={paragraph}
                    className="leading-relaxed"
                  />
                </div>
              ))}
            </div>
          ) : (
            // Non-virtualized rendering for high-end devices
            paragraphs.map((paragraph, index) => (
              <div key={index} className="mb-6">
                <BionicText
                  text={paragraph}
                  className="leading-relaxed"
                />
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 space-y-4 border-t border-border bg-card">
        {/* Focus mask position control */}
        {settings.focusMaskEnabled && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground min-w-[80px]">
              Focus: {focusMaskPosition}%
            </span>
            <Slider
              value={[focusMaskPosition]}
              min={20}
              max={80}
              step={5}
              onValueChange={([value]) => setFocusMaskPosition(value)}
              className="flex-1"
              aria-label="Focus mask position"
            />
          </div>
        )}
        
        {/* Main controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollUp}
            className="touch-target"
            aria-label="Scroll up"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="h-14 w-14 rounded-full touch-target"
            aria-label={isPlaying ? 'Pause auto-scroll' : 'Start auto-scroll'}
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
            onClick={scrollDown}
            className="touch-target"
            aria-label="Scroll down"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}
            className={cn("touch-target ml-4", settings.ttsEnabled && "text-primary")}
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
          <span className="text-sm text-muted-foreground min-w-[80px]">
            {scrollSpeed} px/s
          </span>
          <Slider
            value={[scrollSpeed]}
            min={10}
            max={200}
            step={10}
            onValueChange={([value]) => setScrollSpeed(value)}
            className="flex-1"
            aria-label="Scroll speed"
          />
        </div>
      </div>
    </div>
  )
}
