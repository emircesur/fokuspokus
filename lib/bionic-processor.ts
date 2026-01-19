import type { BionicStyle } from './settings-context'

// Common words that can be skipped for bionic reading
const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their',
])

export interface BionicWord {
  original: string
  highlighted: string
  rest: string
  highlightIndex: number // For center-based highlighting
  isSkipped: boolean
}

export interface BionicOptions {
  style: BionicStyle
  fixationStrength: number // 1-5
  saccadeRhythm: number // 1-3
  skipCommonWords: boolean
  opacity: number // 0.3-0.7
}

// Calculate how many letters to highlight based on word length and fixation strength
function getHighlightCount(wordLength: number, fixationStrength: number): number {
  if (wordLength <= 1) return 1
  if (wordLength <= 3) return Math.min(fixationStrength, Math.ceil(wordLength / 2))
  
  // For longer words, scale based on fixation strength
  const baseCount = Math.ceil(wordLength * (fixationStrength / 10 + 0.2))
  return Math.min(baseCount, Math.ceil(wordLength * 0.6))
}

// Get the center index for center-based highlighting
function getCenterHighlightRange(wordLength: number, fixationStrength: number): [number, number] {
  if (wordLength <= 2) return [0, wordLength]
  
  const highlightCount = getHighlightCount(wordLength, fixationStrength)
  const center = Math.floor(wordLength / 2)
  const halfHighlight = Math.floor(highlightCount / 2)
  
  const start = Math.max(0, center - halfHighlight)
  const end = Math.min(wordLength, start + highlightCount)
  
  return [start, end]
}

// Process a single word for bionic reading
export function processWord(word: string, options: BionicOptions, wordIndex: number): BionicWord {
  // Extract clean word (letters only) for analysis
  const cleanWord = word.replace(/[^\p{L}]/gu, '')
  
  // Check if word should be skipped
  const isSkipped = options.skipCommonWords && 
    COMMON_WORDS.has(cleanWord.toLowerCase())
  
  // Check saccade rhythm (skip every nth word)
  const rhythmSkip = options.saccadeRhythm > 1 && 
    wordIndex % options.saccadeRhythm !== 0
  
  if (isSkipped || rhythmSkip || cleanWord.length === 0) {
    return {
      original: word,
      highlighted: '',
      rest: word,
      highlightIndex: -1,
      isSkipped: true,
    }
  }
  
  // Find where the actual word starts and ends (handling punctuation like "word." or "(word)")
  const wordStart = word.search(/\p{L}/u)
  const wordEnd = word.search(/\p{L}[^\p{L}]*$/u) + 1
  
  const prefix = wordStart > 0 ? word.slice(0, wordStart) : ''
  const suffix = wordEnd < word.length ? word.slice(wordEnd) : ''
  const wordPart = word.slice(wordStart, wordEnd)
  
  let highlighted: string
  let rest: string
  let highlightIndex: number
  
  if (options.style === 'bold-center' || options.style === 'color-center') {
    // Center-based highlighting
    const [start, end] = getCenterHighlightRange(wordPart.length, options.fixationStrength)
    const beforeCenter = wordPart.slice(0, start)
    const centerPart = wordPart.slice(start, end)
    const afterCenter = wordPart.slice(end)
    highlightIndex = start
    
    return {
      original: word,
      highlighted: centerPart,
      rest: prefix + beforeCenter + '|CENTER|' + afterCenter + suffix, // Special marker for center
      highlightIndex,
      isSkipped: false,
    }
  } else {
    // Start-based highlighting (bold-start, color-start, opacity)
    const highlightCount = getHighlightCount(wordPart.length, options.fixationStrength)
    highlighted = prefix + wordPart.slice(0, highlightCount)
    rest = wordPart.slice(highlightCount) + suffix
    highlightIndex = 0
    
    return {
      original: word,
      highlighted,
      rest,
      highlightIndex,
      isSkipped: false,
    }
  }
}

// Process entire text for bionic reading
export function processText(text: string, options: BionicOptions): BionicWord[] {
  const words = text.split(/(\s+)/)
  let wordIndex = 0
  
  return words.map(segment => {
    // Preserve whitespace
    if (/^\s+$/.test(segment)) {
      return {
        original: segment,
        highlighted: '',
        rest: segment,
        highlightIndex: -1,
        isSkipped: true,
      }
    }
    
    const result = processWord(segment, options, wordIndex)
    wordIndex++
    return result
  })
}

// Generate BeeLine gradient colors for a line
export function getBeelineGradient(
  lineIndex: number,
  totalLines: number,
  colors: [string, string]
): { start: string; end: string } {
  // Alternate colors between lines for continuity
  const isEven = lineIndex % 2 === 0
  return {
    start: isEven ? colors[0] : colors[1],
    end: isEven ? colors[1] : colors[0],
  }
}

// Split text into lines for BeeLine rendering
export function splitIntoLines(text: string, charsPerLine: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 > charsPerLine && currentLine.length > 0) {
      lines.push(currentLine.trim())
      currentLine = word
    } else {
      currentLine += (currentLine.length > 0 ? ' ' : '') + word
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine.trim())
  }
  
  return lines
}
