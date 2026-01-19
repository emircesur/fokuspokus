import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    // Fetch the page with browser-like headers
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    })
    
    if (!response.ok) {
      // Check for common blocking scenarios
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'This website blocks automated requests. Please copy and paste the text directly instead.' },
          { status: 403 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      )
    }
    
    const html = await response.text()
    
    // Check if response contains Cloudflare challenge
    if (html.includes('Just a moment...') || html.includes('cf-browser-verification') || html.includes('_cf_chl_opt')) {
      return NextResponse.json(
        { error: 'This website uses bot protection and cannot be accessed automatically. Please copy and paste the text directly instead.' },
        { status: 403 }
      )
    }
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : ''
    
    // Extract main content
    const content = extractMainContent(html)
    
    return NextResponse.json({
      title,
      content,
      url: parsedUrl.toString(),
    })
  } catch (error) {
    console.error('Error extracting text:', error)
    return NextResponse.json(
      { error: 'Failed to extract text from URL' },
      { status: 500 }
    )
  }
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  }
  
  let decoded = text
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char)
  }
  
  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => 
    String.fromCharCode(parseInt(num, 10))
  )
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => 
    String.fromCharCode(parseInt(hex, 16))
  )
  
  return decoded
}

function extractMainContent(html: string): string {
  // Remove script, style, and other non-content elements
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  
  // Try to find article or main content
  let mainContent = ''
  
  // Priority: article > main > .content > .post > body
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    mainContent = articleMatch[1]
  } else {
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) {
      mainContent = mainMatch[1]
    } else {
      // Fallback to body content
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        mainContent = bodyMatch[1]
      } else {
        mainContent = content
      }
    }
  }
  
  // Convert certain elements to preserve structure
  mainContent = mainContent
    .replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, '\n\n$2\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
  
  // Remove remaining HTML tags
  mainContent = mainContent.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  mainContent = decodeHTMLEntities(mainContent)
  
  // Clean up whitespace
  mainContent = mainContent
    .replace(/[\t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
  
  return mainContent
}
