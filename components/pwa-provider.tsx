"use client"

import React from "react"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowInstallBanner(true)
      }
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Handle app installed
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setShowInstallBanner(false)
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
  
  const handleInstall = async () => {
    if (!installPrompt) return
    
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setShowInstallBanner(false)
    }
  }
  
  const handleDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }
  
  return (
    <>
      {children}
      
      {/* Install Banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm">Install FlowRead</p>
              <p className="text-xs text-muted-foreground">
                Add to your home screen for the best experience
              </p>
            </div>
            <Button size="sm" onClick={handleInstall}>
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
            <Button size="icon" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
