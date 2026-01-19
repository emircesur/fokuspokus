"use client"

import React from "react"
import { useState, useCallback, useRef } from 'react'
import { useReading, parseTextToWords, generateId, type ReadingContent } from '@/lib/reading-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  Link, 
  ClipboardPaste, 
  Upload,
  Loader2
} from 'lucide-react'

export function TextInput() {
  const { setContent, addToHistory } = useReading()
  const [pastedText, setPastedText] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const createContent = useCallback(async (
    text: string,
    title: string,
    source: 'epub' | 'url' | 'paste'
  ): Promise<ReadingContent> => {
    // Parse words ONCE during content creation (async to prevent UI blocking)
    const words = await parseTextToWords(text, (percent) => {
      setLoadingStatus(`Processing text... ${percent}%`)
    })
    const id = generateId()
    
    // Only store raw content for small texts (under 50k chars) to save memory
    const shouldStoreContent = text.length < 50000
    
    const content: ReadingContent = {
      id,
      title,
      source,
      ...(shouldStoreContent && { content: text }),
      words,
      wordCount: words.length,
      currentIndex: 0,
      createdAt: new Date(),
    }
    return content
  }, [])
  
  const handlePasteSubmit = useCallback(async () => {
    if (!pastedText.trim()) {
      setError('Please paste some text first')
      return
    }
    
    setError(null)
    setIsLoading(true)
    setLoadingStatus('Processing text...')
    
    try {
      const content = await createContent(
        pastedText,
        'Pasted Text',
        'paste'
      )
      setContent(content)
      addToHistory(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text')
    } finally {
      setIsLoading(false)
      setLoadingStatus('')
    }
  }, [pastedText, createContent, setContent, addToHistory])
  
  const handleUrlSubmit = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from URL')
      }
      
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('No readable content found on the page')
      }
      
      const content = await createContent(
        data.content,
        data.title || 'Web Article',
        'url'
      )
      setContent(content)
      addToHistory(content)
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch URL')
    } finally {
      setIsLoading(false)
    }
  }, [url, createContent, setContent, addToHistory])
  
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      
      if (extension === 'epub') {
        // Parse EPUB - show progress for large files
        setLoadingStatus(`Reading ${file.name}...`)
        const arrayBuffer = await file.arrayBuffer()
        
        setLoadingStatus('Parsing EPUB structure...')
        const response = await fetch('/api/parse-epub', {
          method: 'POST',
          body: arrayBuffer,
          headers: {
            'Content-Type': 'application/epub+zip',
            'X-Filename': file.name,
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to parse EPUB file')
        }
        
        setLoadingStatus('Processing text content...')
        const data = await response.json()
        
        if (!data.content || data.content.trim().length === 0) {
          throw new Error('No readable content found in EPUB. The file may be DRM-protected or use an unsupported format.')
        }
        
        const content = await createContent(
          data.content,
          data.title || file.name.replace('.epub', ''),
          'epub'
        )
        setContent(content)
        addToHistory(content)
      } else if (extension === 'txt' || extension === 'md') {
        // Parse plain text
        setLoadingStatus('Reading file...')
        const text = await file.text()
        const content = await createContent(
          text,
          file.name.replace(/\.(txt|md)$/, ''),
          'paste'
        )
        setContent(content)
        addToHistory(content)
      } else {
        throw new Error('Unsupported file format. Please use EPUB, TXT, or MD files.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsLoading(false)
      setLoadingStatus('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [createContent, setContent, addToHistory])
  
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setPastedText(text)
    } catch {
      setError('Unable to access clipboard. Please paste manually.')
    }
  }, [])
  
  return (
    <div className="w-full">
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="w-full bg-muted/50 p-1 h-auto">
          <TabsTrigger 
            value="paste" 
            className="flex-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste
          </TabsTrigger>
          <TabsTrigger 
            value="url" 
            className="flex-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Link className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger 
            value="file" 
            className="flex-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            File
          </TabsTrigger>
        </TabsList>
        
        {/* Paste Tab */}
        <TabsContent value="paste" className="mt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="paste-text" className="text-sm font-medium text-muted-foreground">
                Your text
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePasteFromClipboard}
                className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
              >
                <ClipboardPaste className="h-3 w-3 mr-1" />
                Clipboard
              </Button>
            </div>
            <Textarea
              id="paste-text"
              placeholder="Paste your text here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="min-h-[180px] resize-y border-border/50 focus:border-primary/50 bg-background"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground/60">
              <span>{pastedText.split(/\s+/).filter(w => w).length} words</span>
              <span>{pastedText.length} characters</span>
            </div>
          </div>
          <Button
            onClick={handlePasteSubmit}
            disabled={!pastedText.trim() || isLoading}
            className="w-full"
          >
            Continue
          </Button>
        </TabsContent>
        
        {/* URL Tab */}
        <TabsContent value="url" className="mt-6 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="url-input" className="text-sm font-medium text-muted-foreground">
              Article URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="border-border/50 focus:border-primary/50 bg-background"
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={!url.trim() || isLoading}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Extract'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Extracts readable content from articles and web pages
            </p>
          </div>
        </TabsContent>
        
        {/* File Tab */}
        <TabsContent value="file" className="mt-6 space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Upload a file
            </Label>
            <div
              className={cn(
                "border border-dashed border-border/50 bg-muted/30 p-10 text-center cursor-pointer transition-all",
                "hover:border-primary/50 hover:bg-muted/50",
                isLoading && "opacity-50 pointer-events-none"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-primary/50', 'bg-muted/50')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-primary/50', 'bg-muted/50')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary/50', 'bg-muted/50')
                const file = e.dataTransfer.files[0]
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  fileInputRef.current.files = dt.files
                  handleFileUpload({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>)
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.txt,.md"
                className="hidden"
                onChange={handleFileUpload}
              />
              {isLoading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground/60" />
              ) : (
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/60" />
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {isLoading ? (loadingStatus || 'Processing...') : 'Drop a file here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                EPUB, TXT, Markdown
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
