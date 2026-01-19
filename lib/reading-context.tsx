"use client"

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

// Metadata stored in React state (small, triggers re-renders)
export interface ReadingContentMeta {
  id: string
  title: string
  source: 'epub' | 'url' | 'paste'
  wordCount: number
  currentIndex: number
  createdAt: Date
}

// Full content with words array (for creation/transfer)
export interface ReadingContent extends ReadingContentMeta {
  content?: string // Optional - only stored for small texts
  words: string[] // Pre-parsed words array
}

interface ReadingContextType {
  content: ReadingContentMeta | null
  words: string[] // Access words via context
  setContent: (content: ReadingContent | null) => void
  currentIndex: number
  setCurrentIndex: (index: number | ((prev: number) => number)) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  history: ReadingContentMeta[]
  addToHistory: (content: ReadingContent) => void
  clearHistory: () => void
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined)

export function ReadingProvider({ children }: { children: ReactNode }) {
  // Store only metadata in state (triggers re-renders)
  const [contentMeta, setContentMeta] = useState<ReadingContentMeta | null>(null)
  const [currentIndex, setCurrentIndexState] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [history, setHistory] = useState<ReadingContentMeta[]>([])
  
  // Store words in ref (large array avoids React state overhead)
  // Use a version counter to force re-renders when words change
  const wordsRef = useRef<string[]>([])
  const [wordsVersion, setWordsVersion] = useState(0)
  
  // Wrapper for setCurrentIndex that handles both direct values and function updaters
  const setCurrentIndex = useCallback((indexOrUpdater: number | ((prev: number) => number)) => {
    if (typeof indexOrUpdater === 'function') {
      setCurrentIndexState(indexOrUpdater)
    } else {
      setCurrentIndexState(indexOrUpdater)
    }
  }, [])

  const setContent = useCallback((newContent: ReadingContent | null) => {
    // Store words in ref (large array avoids React state overhead)
    wordsRef.current = newContent?.words || []
    setWordsVersion(prev => prev + 1)
    
    // Store only metadata in state (small object, triggers re-render)
    if (newContent) {
      const { words: _words, content: _content, ...meta } = newContent
      setContentMeta(meta)
    } else {
      setContentMeta(null)
    }
    
    setCurrentIndexState(0)
    setIsPlaying(false)
  }, [])

  const addToHistory = useCallback((item: ReadingContent) => {
    // Only store metadata in history (no words array)
    const { words, content, ...meta } = item
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== meta.id)
      return [meta, ...filtered].slice(0, 20) // Keep last 20 items
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _version = wordsVersion // Use wordsVersion to trigger re-render when words change
  const words = wordsRef.current

  return (
    <ReadingContext.Provider
      value={{
        content: contentMeta,
        words,
        setContent,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        history,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </ReadingContext.Provider>
  )
}

export function useReading() {
  const context = useContext(ReadingContext)
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider')
  }
  return context
}

// Parse text to words array - done once during content creation
// Uses async chunked processing to avoid blocking UI
export async function parseTextToWords(text: string, onProgress?: (percent: number) => void): Promise<string[]> {
  // For very large texts, use more efficient approach
  if (text.length > 500000) { // 500k+ characters
    return parseTextToWordsLarge(text, onProgress)
  }
  
  const words: string[] = []
  const chunkSize = 100000 // Process 100k chars at a time
  const totalLength = text.length
  
  let start = 0
  let chunkCount = 0
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)
    
    // Find word boundary
    if (end < text.length) {
      while (end < text.length && !/\s/.test(text[end])) {
        end++
      }
    }
    
    const chunk = text.slice(start, end)
    const chunkWords = chunk.split(/\s+/).filter(w => w.length > 0)
    words.push(...chunkWords)
    
    start = end
    while (start < text.length && /\s/.test(text[start])) {
      start++
    }
    
    chunkCount++
    // Yield to browser to prevent UI blocking (every chunk)
    if (start < text.length) {
      const percent = Math.round((start / totalLength) * 100)
      onProgress?.(percent)
      // Use requestAnimationFrame for smoother UI updates
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }
  
  onProgress?.(100)
  return words
}

// Optimized parser for very large texts (500k+ characters)
async function parseTextToWordsLarge(text: string, onProgress?: (percent: number) => void): Promise<string[]> {
  // Split all at once (more efficient for large texts than chunked splitting)
  const allWords = text.split(/\s+/)
  const totalWords = allWords.length
  
  // Filter in chunks to allow UI updates
  const words: string[] = []
  const filterChunkSize = 50000
  
  for (let i = 0; i < allWords.length; i += filterChunkSize) {
    const chunk = allWords.slice(i, i + filterChunkSize)
    const filtered = chunk.filter(w => w.length > 0)
    words.push(...filtered)
    
    if (i + filterChunkSize < allWords.length) {
      const percent = Math.round(((i + filterChunkSize) / totalWords) * 100)
      onProgress?.(percent)
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }
  
  onProgress?.(100)
  return words
}

// Simple function to get words from pre-parsed array
export function getWordsInRange(words: string[], startIndex: number, count: number): string[] {
  return words.slice(startIndex, startIndex + count)
}

// Get a single word at index
export function getWordAtIndex(words: string[], targetIndex: number): string {
  return words[targetIndex] || ''
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
