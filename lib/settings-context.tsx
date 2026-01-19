"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast'
export type AccentColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'cyan'
export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
export type ReaderFont = 'default' | 'dyslexic' | 'hyperlegible' | 'serif' | 'mono'
export type BionicStyle = 'bold-start' | 'bold-center' | 'color-start' | 'color-center' | 'opacity'
export type ReadingMode = 'scroll' | 'rsvp-single' | 'rsvp-multi'
export type IrlenOverlay = 'none' | 'rose' | 'blue' | 'green' | 'yellow' | 'orange' | 'aqua' | 'gray'
export type PerformanceMode = 'auto' | 'low' | 'balanced' | 'high'

export interface ReadingSettings {
  // Theme
  theme: Theme
  accentColor: AccentColor
  colorblindMode: ColorblindMode
  
  // Typography
  readerFont: ReaderFont
  fontSize: number // 12-32
  lineHeight: number // 1.2-2.5
  letterSpacing: number // 0-0.3em
  wordSpacing: number // 0-0.5em
  
  // Bionic Reading
  bionicEnabled: boolean
  bionicStyle: BionicStyle
  fixationStrength: number // 1-5 (how many letters to highlight)
  saccadeRhythm: number // 1-3 (every word, every 2nd, every 3rd)
  skipCommonWords: boolean
  bionicOpacity: number // 0.3-0.7 for faded text
  
  // Syllable Color-Coding
  syllableColorEnabled: boolean
  syllableColors: [string, string] // Alternating colors
  
  // Character Disambiguation (mirror letters)
  charDisambiguationEnabled: boolean
  charBColor: string // Color for 'b'
  charDColor: string // Color for 'd'
  charPColor: string // Color for 'p'
  charQColor: string // Color for 'q'
  
  // Irlen Overlay
  irlenOverlay: IrlenOverlay
  irlenOpacity: number // 0.1-0.4
  
  // Homophone Indicators
  homophoneEnabled: boolean
  
  // Visual Guides
  verticalRhythmLines: boolean
  verticalLineSpacing: number // pixels between lines
  verticalLineOpacity: number // 0.05-0.2
  
  // Focus Mask (Reading Ruler)
  focusMaskEnabled: boolean
  focusMaskLines: number // 1-5 visible lines
  
  // BeeLine Reader (gradient)
  beelineEnabled: boolean
  beelineColors: [string, string] // start and end colors
  
  // Reading Mode
  readingMode: ReadingMode
  wordsPerGroup: number // 1-7 for multi-word RSVP
  wpm: number // 100-1000 words per minute
  autoAdvance: boolean
  autoStartReading: boolean // Start immediately when loading content
  
  // TTS
  ttsEnabled: boolean
  ttsRate: number // 0.5-2
  ttsPitch: number // 0.5-2
  ttsVoice: string
  
  // Accessibility
  reducedMotion: boolean
  highContrastFocus: boolean
  largeClickTargets: boolean
  screenReaderOptimized: boolean
  
  // Motion Controls
  tremorCancellation: boolean
  tiltToScroll: boolean
  tiltSensitivity: number // 1-5
  volumeRockerNavigation: boolean
  
  // Performance Settings
  performanceMode: PerformanceMode // Device capability preset
  wordsPerChunk: number // 50-500 words per paragraph chunk for large texts
  virtualBufferSize: number // 2-10 extra paragraphs to render above/below viewport
  paragraphHeightEstimate: number // 80-300 pixels estimated paragraph height
  enableVirtualization: boolean // Toggle virtualization on/off
  textProcessingChunkSize: number // 25000-200000 chars processed per frame
  enableSmoothScrolling: boolean // CSS smooth scroll behavior
  maxRenderParagraphs: number // 10-100 max paragraphs to render at once
}

const defaultSettings: ReadingSettings = {
  theme: 'dark',
  accentColor: 'red',
  colorblindMode: 'none',
  readerFont: 'default',
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: 0,
  wordSpacing: 0,
  bionicEnabled: true,
  bionicStyle: 'bold-start',
  fixationStrength: 3,
  saccadeRhythm: 1,
  skipCommonWords: false,
  bionicOpacity: 0.5,
  syllableColorEnabled: false,
  syllableColors: ['#3B82F6', '#EF4444'],
  charDisambiguationEnabled: false,
  charBColor: '#3B82F6',
  charDColor: '#EF4444',
  charPColor: '#22C55E',
  charQColor: '#F97316',
  irlenOverlay: 'none',
  irlenOpacity: 0.15,
  homophoneEnabled: false,
  verticalRhythmLines: false,
  verticalLineSpacing: 40,
  verticalLineOpacity: 0.1,
  focusMaskEnabled: false,
  focusMaskLines: 3,
  beelineEnabled: false,
  beelineColors: ['#3B82F6', '#EF4444'],
  readingMode: 'scroll',
  wordsPerGroup: 3,
  wpm: 300,
  autoAdvance: true,
  autoStartReading: true,
  ttsEnabled: false,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoice: '',
  reducedMotion: false,
  highContrastFocus: false,
  largeClickTargets: false,
  screenReaderOptimized: false,
  tremorCancellation: false,
  tiltToScroll: false,
  tiltSensitivity: 3,
  volumeRockerNavigation: false,
  
  // Performance defaults (balanced for most devices)
  performanceMode: 'auto',
  wordsPerChunk: 200,
  virtualBufferSize: 5,
  paragraphHeightEstimate: 150,
  enableVirtualization: true,
  textProcessingChunkSize: 100000,
  enableSmoothScrolling: true,
  maxRenderParagraphs: 30,
}

interface SettingsContextType {
  settings: ReadingSettings
  updateSettings: (updates: Partial<ReadingSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bionic-reader-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...defaultSettings, ...parsed })
      } catch {
        // Invalid JSON, use defaults
      }
    }
    setMounted(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bionic-reader-settings', JSON.stringify(settings))
    }
  }, [settings, mounted])

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    
    // Remove all theme and colorblind classes first
    root.classList.remove('light', 'dark', 'sepia', 'high-contrast')
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia')
    
    // Add theme class
    root.classList.add(settings.theme)
    
    // Apply accent color CSS variable (only if NOT in colorblind mode)
    const accentColors: Record<AccentColor, string> = {
      red: 'oklch(0.55 0.22 25)',
      blue: 'oklch(0.55 0.2 250)',
      green: 'oklch(0.55 0.18 145)',
      orange: 'oklch(0.65 0.2 50)',
      purple: 'oklch(0.55 0.2 300)',
      cyan: 'oklch(0.6 0.15 200)',
    }
    
    if (settings.colorblindMode !== 'none') {
      // Add colorblind class which sets CSS variables via the stylesheet
      // The class needs both the colorblind type and theme for proper specificity
      root.classList.add(`colorblind-${settings.colorblindMode}`)
      // Force remove any inline styles that might override
      root.style.removeProperty('--primary')
      root.style.removeProperty('--accent')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--bionic-accent')
    } else {
      // Apply user's selected accent color
      root.style.setProperty('--primary', accentColors[settings.accentColor])
      root.style.setProperty('--accent', accentColors[settings.accentColor])
      root.style.setProperty('--ring', accentColors[settings.accentColor])
      root.style.setProperty('--bionic-accent', accentColors[settings.accentColor])
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0ms')
    } else {
      root.style.removeProperty('--transition-duration')
    }
    
    // Apply Irlen overlay
    root.classList.remove('irlen-rose', 'irlen-blue', 'irlen-green', 'irlen-yellow', 'irlen-orange', 'irlen-aqua', 'irlen-gray')
    if (settings.irlenOverlay !== 'none') {
      root.classList.add(`irlen-${settings.irlenOverlay}`)
      root.style.setProperty('--irlen-opacity', String(settings.irlenOpacity))
    }
  }, [settings.theme, settings.colorblindMode, settings.accentColor, settings.reducedMotion, settings.irlenOverlay, settings.irlenOpacity, mounted])

  const updateSettings = (updates: Partial<ReadingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {mounted ? children : <div className="h-screen w-screen" />}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
