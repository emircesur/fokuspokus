import JSZip from 'jszip'

export interface ParsedEpub {
  title: string
  content: string
}

export async function parseEpub(file: File): Promise<ParsedEpub> {
  const arrayBuffer = await file.arrayBuffer()
  const filename = file.name

  // Load the EPUB (which is a ZIP file)
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Parse container.xml to find the OPF file
  let containerXml = await zip.file('META-INF/container.xml')?.async('string')
  if (!containerXml) {
    containerXml = await zip.file('meta-inf/container.xml')?.async('string')
  }
  if (!containerXml) {
    const containerFile = Object.keys(zip.files).find(f =>
      f.toLowerCase().endsWith('container.xml')
    )
    if (containerFile) {
      containerXml = await zip.file(containerFile)?.async('string')
    }
  }

  if (!containerXml) {
    // Fallback: try to find OPF file directly
    const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'))
    if (opfFile) {
      return await parseWithOpfPath(zip, opfFile, filename)
    }
    throw new Error('Invalid EPUB: missing container.xml and no OPF file found')
  }

  // Extract OPF path from container.xml
  let opfPath: string | null = null

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
    const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'))
    if (opfFile) {
      opfPath = opfFile
    }
  }

  if (!opfPath) {
    throw new Error('Invalid EPUB: cannot find OPF file')
  }

  return await parseWithOpfPath(zip, opfPath, filename)
}

async function parseWithOpfPath(zip: JSZip, opfPath: string, filename: string): Promise<ParsedEpub> {
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1)

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

  // Extract title from OPF metadata
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

  // Extract spine order
  const spineItems: string[] = []
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

  // Build manifest map
  const manifest: Record<string, string> = {}
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

  // Read content files in spine order
  const contentParts: string[] = []

  for (const itemId of spineItems) {
    const href = manifest[itemId]
    if (!href) continue

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
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // Fallback: read all HTML files if spine reading failed
  if (contentParts.length === 0) {
    const htmlFiles = Object.keys(zip.files).filter(
      name => /\.(x?html?|htm)$/i.test(name) && !name.includes('toc') && !name.includes('nav')
    ).sort()

    for (const htmlFile of htmlFiles) {
      try {
        const content = await zip.file(htmlFile)?.async('string')
        if (content) {
          const text = extractTextFromHtml(content)
          if (text.trim() && text.length > 50) {
            contentParts.push(text)
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  const fullContent = contentParts.join('\n\n')

  if (!fullContent.trim()) {
    throw new Error('Could not extract any readable content from EPUB')
  }

  return { title, content: fullContent }
}

function extractTextFromHtml(html: string): string {
  let text = html
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')

  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  text = text
    .replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, '\n\n$2\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1')
    .replace(/<\/?(div|section|article)[^>]*>/gi, '\n')

  text = text.replace(/<[^>]+>/g, ' ')

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

  text = text.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  )
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )

  text = text
    .replace(/[\t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()

  return text
}
