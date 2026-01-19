"use client"

import { useState, useEffect, useRef } from 'react'
import { useSettings } from '@/lib/settings-context'
import { useReading } from '@/lib/reading-context'
import { TextInput } from '@/components/text-input'
import { RSVPReader } from '@/components/rsvp-reader'
import { ScrollReader } from '@/components/scroll-reader'
import { SettingsPanel } from '@/components/settings-panel'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { 
  Settings, 
  FileText
} from 'lucide-react'

type View = 'import' | 'read'

// Styled fokuspokus component - only first 'o' gets accent color
function StyledLogo({ className }: { className?: string }) {
  return (
    <span className={cn("italic", className)}>
      <span className="font-bold">f</span>
      <span className="font-bold text-primary">o</span>
      <span>kus</span>
      <span className="font-bold">po</span>
      <span>kus</span>
    </span>
  )
}

export default function Home() {
  const { settings } = useSettings()
  const { content, setContent } = useReading()
  const [view, setView] = useState<View>('import')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prevContentRef = useRef<typeof content>(null)
  
  // Auto-switch to reading view when content is set
  useEffect(() => {
    if (content && !prevContentRef.current) {
      setView('read')
    }
    prevContentRef.current = content
  }, [content])
  
  const handleNewContent = () => {
    setContent(null)
    setView('import')
  }
  
  // Render the appropriate reader based on mode
  const renderReader = () => {
    if (settings.readingMode === 'scroll') {
      return <ScrollReader />
    }
    return <RSVPReader />
  }
  
  return (
    <div className={cn(
      "flex flex-col h-[100dvh] overflow-hidden bg-background",
      settings.largeClickTargets && "text-lg"
    )}>
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-6 h-16 shrink-0">
        <h1 className="text-xl tracking-tight">
          <StyledLogo />
        </h1>
        
        <div className="flex items-center gap-3">
          {content && view === 'read' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewContent}
              className="touch-target text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New</span>
            </Button>
          )}
          
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0 border-l border-border/50">
              <SheetTitle className="sr-only">Settings</SheetTitle>
              <div className="flex items-center px-6 h-16 border-b border-border/50">
                <h2 className="text-lg font-medium">Settings</h2>
              </div>
              <div className="h-[calc(100dvh-64px)]">
                <SettingsPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'import' ? (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto py-12 px-6">
              {/* Minimal Hero */}
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-balance leading-tight">
                  Read faster with
                  <span className="block font-medium" style={{ color: settings.accentColor }}>
                    <span className="italic">fokuspokus</span>
                  </span>
                </h2>
                <p className="text-muted-foreground mt-4 text-lg font-light">
                  Import any text and transform how you read
                </p>
              </div>
              
              {/* Import Component */}
              <TextInput />
              
              {/* Footer - scrolls with content */}
              <footer className="mt-16 pt-6 text-xs text-muted-foreground/60 border-t border-border/30">
                <p className="text-center">All processing happens locally in your browser</p>
              </footer>
            </div>
          </div>
        ) : (
          renderReader()
        )}
      </main>
    </div>
  )
}
