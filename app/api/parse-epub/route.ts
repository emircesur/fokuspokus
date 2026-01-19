import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

// For App Router, use route segment config
export const maxDuration = 60 // Allow up to 60 seconds for large files
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] EPUB parse started')
    const arrayBuffer = await request.arrayBuffer()
    const filename = request.headers.get('X-Filename') || 'book.epub'
    console.log('[v0] EPUB file size:', arrayBuffer.byteLength, 'bytes')
    
    // Load the EPUB (which is a ZIP file)
    const zip = await JSZip.loadAsync(arrayBuffer)
    console.log('[v0] ZIP loaded, files:', Object.keys(zip.files).length)
    
    // Parse container.xml to find the OPF file
    // Try different case variations for container.xml
    let containerXml = await zip.file('META-INF/container.xml')?.async('string')
    if (!containerXml) {
      containerXml = await zip.file('meta-inf/container.xml')?.async('string')
    }
    if (!containerXml) {
      // Try to find container.xml anywhere
      const containerFile = Object.keys(zip.files).find(f => 
        f.toLowerCase().endsWith('container.xml')
      )
      if (containerFile) {
        containerXml = await zip.file(containerFile)?.async('string')
      }
    }
    
    if (!containerXml) {
      console.log('[v0] No container.xml found, trying fallback')
      // Fallback: try to find OPF file directly
      const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'))
      if (opfFile) {
        return await parseWithOpfPath(zip, opfFile, filename)
      }
      throw new Error('Invalid EPUB: missing container.xml and no OPF file found')
    }
    
    console.log('[v0] Container XML found')
    
    // Extract OPF path from container.xml - handle various formats
    let opfPath: string | null = null
    
    // Try different regex patterns for full-path attribute
    const patterns = [
      /full-path="([^"]+)"/i,
      /full-path='([^']+)'/i,
      /rootfile[^>]+full-path="([^"]+)"/i,
      /rootfile[^>]+full-path='([^']+)'/i,
    ]
    
    for (const pattern of patterns) {
      const match = containerXml.match(pattern)
      if (match) {
        opfPath = match[1]
        break
      }
    }
    
    if (!opfPath) {
      console.log('[v0] No OPF path in container, trying fallback')
      // Fallback: find .opf file in zip
      const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'))
      if (opfFile) {
        opfPath = opfFile
      }
    }
    
    if (!opfPath) {
      throw new Error('Invalid EPUB: cannot find OPF file')
    }
    
    console.log('[v0] OPF path:', opfPath)
    return await parseWithOpfPath(zip, opfPath, filename)
    
  } catch (error) {
    console.error('[v0] Error parsing EPUB:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse EPUB file' },
      { status: 500 }
    )
  }
}

async function parseWithOpfPath(zip: JSZip, opfPath: string, filename: string) {
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
  
  // Read and parse OPF file - try exact path first, then case-insensitive
  let opfContent = await zip.file(opfPath)?.async('string')
  if (!opfContent) {
    const opfLower = opfPath.toLowerCase()
    const opfFile = Object.keys(zip.files).find(f => f.toLowerCase() === opfLower)
    if (opfFile) {
      opfContent = await zip.file(opfFile)?.async('string')
    }
  }
  
  if (!opfContent) {
    throw new Error('Invalid EPUB: cannot read OPF file')
  }
  
  console.log('[v0] OPF content length:', opfContent.length)
  
  // Extract title from OPF metadata - try multiple patterns
  let title = filename.replace('.epub', '')
  const titlePatterns = [
    /<dc:title[^>]*>([^<]+)<\/dc:title>/i,
    /<dc:title[^>]*><!\[CDATA\[([^\]]+)\]\]><\/dc:title>/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ]
  for (const pattern of titlePatterns) {
    const match = opfContent.match(pattern)
    if (match && match[1].trim()) {
      title = match[1].trim()
      break
    }
  }
  console.log('[v0] Title:', title)
  
  // Extract spine order (reading order of content files)
  const spineItems: string[] = []
  
  // Handle both self-closing and standard itemref tags
  const spinePatterns = [
    /<itemref[^>]+idref=["']([^"']+)["'][^>]*\/?>/gi,
    /<itemref[^>]*idref=["']([^"']+)["'][^>]*>/gi,
  ]
  
  for (const pattern of spinePatterns) {
    const matches = opfContent.matchAll(pattern)
    for (const match of matches) {
      if (!spineItems.includes(match[1])) {
        spineItems.push(match[1])
      }
    }
    if (spineItems.length > 0) break
  }
  
  console.log('[v0] Spine items:', spineItems.length)
  
  // Build manifest map (id -> href)
  const manifest: Record<string, string> = {}
  
  // Handle various item tag formats
  const itemRegex = /<item\s+([^>]+)>/gi
  let itemMatch
  while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
    const attrs = itemMatch[1]
    const idMatch = attrs.match(/id=["']([^"']+)["']/i)
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i)
    if (idMatch && hrefMatch) {
      manifest[idMatch[1]] = decodeURIComponent(hrefMatch[1])
    }
  }
  
  console.log('[v0] Manifest items:', Object.keys(manifest).length)
  
  // Read content files in spine order
  const contentParts: string[] = []
  
  for (const itemId of spineItems) {
    const href = manifest[itemId]
    if (!href) {
      console.log('[v0] Spine item not in manifest:', itemId)
      continue
    }
    
    // Handle relative paths and URL encoding
    const decodedHref = href.replace(/^\.\//, '')
    const possiblePaths = [
      opfDir + decodedHref,
      decodedHref,
      opfDir + href,
      href,
    ]
    
    let file: JSZip.JSZipObject | null = null
    for (const path of possiblePaths) {
      file = zip.file(path)
      if (file) break
      // Try case-insensitive match
      const pathLower = path.toLowerCase()
      const matchingFile = Object.keys(zip.files).find(f => f.toLowerCase() === pathLower)
      if (matchingFile) {
        file = zip.file(matchingFile)
        if (file) break
      }
    }
    
    if (file) {
      try {
        const htmlContent = await file.async('string')
        const text = extractTextFromHtml(htmlContent)
        if (text.trim()) {
          contentParts.push(text)
        }
      } catch (err) {
        console.log('[v0] Error reading file:', href, err)
      }
    } else {
      console.log('[v0] Could not find file:', href)
    }
  }
  
  console.log('[v0] Content parts from spine:', contentParts.length)
  
  // If spine reading didn't work, try reading all HTML files
  if (contentParts.length === 0) {
    console.log('[v0] Falling back to reading all HTML files')
    const htmlFiles = Object.keys(zip.files).filter(
      name => /\.(x?html?|htm)$/i.test(name) && !name.includes('toc') && !name.includes('nav')
    ).sort()
    
    console.log('[v0] Found HTML files:', htmlFiles.length)
    
    for (const htmlFile of htmlFiles) {
      try {
        const content = await zip.file(htmlFile)?.async('string')
        if (content) {
          const text = extractTextFromHtml(content)
          if (text.trim() && text.length > 50) { // Skip very short files (likely nav/toc)
            contentParts.push(text)
          }
        }
      } catch (err) {
        console.log('[v0] Error reading HTML file:', htmlFile, err)
      }
    }
  }
  
  const fullContent = contentParts.join('\n\n')
  console.log('[v0] Total content length:', fullContent.length, 'chars')
  
  if (!fullContent.trim()) {
    throw new Error('Could not extract any readable content from EPUB')
  }
  
  return NextResponse.json({
    title,
    content: fullContent,
  })
}

function extractTextFromHtml(html: string): string {
  // Remove XML declaration and DOCTYPE
  let text = html
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
  
  // Remove head section
  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
  
  // Remove script and style
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Convert semantic elements to preserve structure
  text = text
    .replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, '\n\n$2\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1')
    .replace(/<\/?(div|section|article)[^>]*>/gi, '\n')
  
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
  
  // Handle numeric entities
  text = text.replace(/&#(\d+);/g, (_, num) => 
    String.fromCharCode(parseInt(num, 10))
  )
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => 
    String.fromCharCode(parseInt(hex, 16))
  )
  
  // Clean up whitespace
  text = text
    .replace(/[\t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
  
  return text
}
