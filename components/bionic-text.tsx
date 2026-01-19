"use client"

import React from "react"

import { useMemo } from 'react'
import { useSettings } from '@/lib/settings-context'
import { processText, getBeelineGradient, splitIntoLines } from '@/lib/bionic-processor'
import { cn } from '@/lib/utils'

interface BionicTextProps {
  text: string
  className?: string
}

// Common homophones for detection
const HOMOPHONES: Record<string, string> = {
  'there': 'location',
  'their': 'possession',
  "they're": 'they are',
  'your': 'possession',
  "you're": 'you are',
  'its': 'possession',
  "it's": 'it is',
  'to': 'direction',
  'too': 'also/excessive',
  'two': 'number 2',
  'then': 'time/sequence',
  'than': 'comparison',
  'affect': 'verb: influence',
  'effect': 'noun: result',
  'accept': 'receive',
  'except': 'exclude',
  'weather': 'climate',
  'whether': 'if',
  'principal': 'main/school head',
  'principle': 'rule/belief',
  'stationary': 'not moving',
  'stationery': 'paper/pens',
  'complement': 'complete',
  'compliment': 'praise',
  'pair': 'two items',
  'pear': 'fruit',
  'pare': 'trim/peel',
  'break': 'shatter',
  'brake': 'stop',
  'bare': 'naked/empty',
  'bear': 'animal/carry',
  'hear': 'listen',
  'here': 'location',
  'know': 'understand',
  'no': 'negative',
  'new': 'recent',
  'knew': 'past of know',
  'write': 'compose',
  'right': 'correct/direction',
  'by': 'near',
  'buy': 'purchase',
  'bye': 'farewell',
}

// Simple syllable approximation (not perfect but good enough)
function approximateSyllables(word: string): string[] {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
  if (cleanWord.length <= 3) return [word]
  
  // Simple vowel-based syllable detection
  const vowels = 'aeiouy'
  const syllables: string[] = []
  let currentSyllable = ''
  let prevWasVowel = false
  
  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i]
    const isVowel = vowels.includes(char)
    
    currentSyllable += word[i] || char
    
    // Start new syllable after a vowel followed by consonant (simplified)
    if (prevWasVowel && !isVowel && i < cleanWord.length - 1) {
      // Check if next char is a vowel - if so, split before current consonant
      const nextChar = cleanWord[i + 1]
      if (nextChar && vowels.includes(nextChar)) {
        syllables.push(currentSyllable.slice(0, -1))
        currentSyllable = char
      }
    }
    
    prevWasVowel = isVowel
  }
  
  if (currentSyllable) {
    syllables.push(currentSyllable)
  }
  
  // Filter out empty syllables and merge tiny ones
  const filtered = syllables.filter(s => s.length > 0)
  if (filtered.length <= 1) return [word]
  
  return filtered
}

export function BionicText({ text, className }: BionicTextProps) {
  const { settings } = useSettings()
  
  const fontClass = useMemo(() => {
    const fontMap: Record<string, string> = {
      default: 'font-reader-default',
      dyslexic: 'font-reader-dyslexic',
      hyperlegible: 'font-reader-hyperlegible',
      serif: 'font-reader-serif',
      mono: 'font-reader-mono',
    }
    return fontMap[settings.readerFont] || 'font-reader-default'
  }, [settings.readerFont])
  
  const processedWords = useMemo(() => {
    if (!settings.bionicEnabled && !settings.beelineEnabled) {
      return null
    }
    
    return processText(text, {
      style: settings.bionicStyle,
      fixationStrength: settings.fixationStrength,
      saccadeRhythm: settings.saccadeRhythm,
      skipCommonWords: settings.skipCommonWords,
      opacity: settings.bionicOpacity,
    })
  }, [
    text,
    settings.bionicEnabled,
    settings.beelineEnabled,
    settings.bionicStyle,
    settings.fixationStrength,
    settings.saccadeRhythm,
    settings.skipCommonWords,
    settings.bionicOpacity,
  ])
  
  // Apply character disambiguation (b/d/p/q coloring)
  const applyCharDisambiguation = (text: string): React.ReactNode => {
    if (!settings.charDisambiguationEnabled) return text
    
    const chars = text.split('')
    return chars.map((char, i) => {
      const lowerChar = char.toLowerCase()
      let color: string | undefined
      
      switch (lowerChar) {
        case 'b': color = settings.charBColor; break
        case 'd': color = settings.charDColor; break
        case 'p': color = settings.charPColor; break
        case 'q': color = settings.charQColor; break
      }
      
      if (color) {
        return <span key={i} style={{ color }}>{char}</span>
      }
      return char
    })
  }
  
  // Apply syllable coloring
  const applySyllableColors = (word: string, baseStyle?: React.CSSProperties): React.ReactNode => {
    if (!settings.syllableColorEnabled) {
      return settings.charDisambiguationEnabled 
        ? applyCharDisambiguation(word) 
        : word
    }
    
    const syllables = approximateSyllables(word)
    if (syllables.length <= 1) {
      return settings.charDisambiguationEnabled 
        ? applyCharDisambiguation(word) 
        : word
    }
    
    return syllables.map((syllable, i) => (
      <span 
        key={i} 
        style={{ 
          ...baseStyle,
          color: settings.syllableColors[i % 2] 
        }}
      >
        {settings.charDisambiguationEnabled 
          ? applyCharDisambiguation(syllable) 
          : syllable}
      </span>
    ))
  }
  
  // Check if word is a homophone
  const isHomophone = (word: string): string | undefined => {
    if (!settings.homophoneEnabled) return undefined
    const cleanWord = word.toLowerCase().replace(/[^a-z']/g, '')
    return HOMOPHONES[cleanWord]
  }
  
  // Render a word with all enhancements
  const renderWord = (word: string, key: number, highlightStyle?: React.CSSProperties, restStyle?: React.CSSProperties): React.ReactNode => {
    const homophoneHint = isHomophone(word)
    
    const content = settings.syllableColorEnabled 
      ? applySyllableColors(word, highlightStyle)
      : settings.charDisambiguationEnabled 
        ? applyCharDisambiguation(word)
        : word
    
    if (homophoneHint) {
      return (
        <span 
          key={key}
          className="homophone-indicator"
          title={`Homophone: ${homophoneHint}`}
          data-homophone={homophoneHint}
          aria-label={`${word} - homophone meaning: ${homophoneHint}`}
        >
          {content}
        </span>
      )
    }
    
    return <span key={key} style={highlightStyle}>{content}</span>
  }
  
  // BeeLine gradient rendering
  if (settings.beelineEnabled) {
    const lines = splitIntoLines(text, 80)
    
    return (
      <div
        className={cn(fontClass, className)}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          letterSpacing: `${settings.letterSpacing}em`,
          wordSpacing: `${settings.wordSpacing}em`,
        }}
      >
        {lines.map((line, lineIndex) => {
          const gradient = getBeelineGradient(lineIndex, lines.length, settings.beelineColors)
          return (
            <p
              key={lineIndex}
              className="mb-0"
              style={{
                background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {line}
            </p>
          )
        })}
      </div>
    )
  }
  
  // Standard bionic or plain text rendering
  if (!processedWords || !settings.bionicEnabled) {
    // Still apply syllable colors and char disambiguation to plain text
    const words = text.split(/(\s+)/)
    
    return (
      <div
        className={cn(fontClass, className)}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          letterSpacing: `${settings.letterSpacing}em`,
          wordSpacing: `${settings.wordSpacing}em`,
        }}
      >
        {words.map((word, index) => {
          if (/^\s+$/.test(word)) {
            return <span key={index}>{word}</span>
          }
          return renderWord(word, index)
        })}
      </div>
    )
  }
  
  const getHighlightStyle = (): React.CSSProperties => {
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
  
  const getRestStyle = (): React.CSSProperties => {
    if (settings.bionicStyle === 'opacity') {
      return { opacity: settings.bionicOpacity }
    }
    return {}
  }
  
  return (
    <div
      className={cn(fontClass, 'leading-relaxed', className)}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacing}em`,
        wordSpacing: `${settings.wordSpacing}em`,
      }}
    >
      {processedWords.map((word, index) => {
        if (word.isSkipped || /^\s+$/.test(word.original)) {
          return <span key={index}>{word.original}</span>
        }
        
        const homophoneHint = isHomophone(word.original)
        const wrapperClass = homophoneHint ? 'homophone-indicator' : undefined
        const wrapperTitle = homophoneHint ? `Homophone: ${homophoneHint}` : undefined
        
        // Handle center-based highlighting
        if (word.rest.includes('|CENTER|')) {
          const [before, after] = word.rest.split('|CENTER|')
          
          const content = (
            <>
              <span style={getRestStyle()} key={index + '.before'}>
                {settings.syllableColorEnabled || settings.charDisambiguationEnabled 
                  ? applySyllableColors(before, getRestStyle())
                  : before}
              </span>
              <span style={getHighlightStyle()} key={index + '.highlight'}>
                {settings.syllableColorEnabled || settings.charDisambiguationEnabled 
                  ? applySyllableColors(word.highlighted, getHighlightStyle())
                  : word.highlighted}
              </span>
              <span style={getRestStyle()} key={index + '.after'}>
                {settings.syllableColorEnabled || settings.charDisambiguationEnabled 
                  ? applySyllableColors(after, getRestStyle())
                  : after}
              </span>
            </>
          )
          
          return wrapperClass ? (
            <span key={index} className={wrapperClass} title={wrapperTitle}>
              {content}
            </span>
          ) : (
            <span key={index}>{content}</span>
          )
        }
        
        const content = (
          <>
            <span style={getHighlightStyle()} key={index + '.highlight'}>
              {settings.syllableColorEnabled || settings.charDisambiguationEnabled 
                ? applySyllableColors(word.highlighted, getHighlightStyle())
                : word.highlighted}
            </span>
            <span style={getRestStyle()} key={index + '.rest'}>
              {settings.syllableColorEnabled || settings.charDisambiguationEnabled 
                ? applySyllableColors(word.rest, getRestStyle())
                : word.rest}
            </span>
          </>
        )
        
        return wrapperClass ? (
          <span key={index} className={wrapperClass} title={wrapperTitle}>
            {content}
          </span>
        ) : (
          <span key={index}>{content}</span>
        )
      })}
    </div>
  )
}
