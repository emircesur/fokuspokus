"use client"

import { useState, useEffect } from 'react'
import { useSettings, type Theme, type AccentColor, type ColorblindMode, type ReaderFont, type BionicStyle, type ReadingMode, type IrlenOverlay, type PerformanceMode } from '@/lib/settings-context'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { 
  Sun, 
  Moon, 
  Palette, 
  Type, 
  Eye, 
  Zap, 
  Volume2,
  Accessibility,
  RotateCcw,
  Layers,
  Move,
  Grid3X3,
  Gauge,
  Cpu,
  Smartphone,
  Monitor,
  Laptop,
  LayoutGrid,
  Rows3,
  Columns3
} from 'lucide-react'

export function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  
  // Load available TTS voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || []
      setVoices(availableVoices)
    }
    
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
    }
  }, [])
  
  const accentColors: { value: AccentColor; label: string; color: string }[] = [
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
  ]

  const irlenColors: { value: IrlenOverlay; label: string; color: string }[] = [
    { value: 'none', label: 'None', color: 'bg-transparent border border-border' },
    { value: 'rose', label: 'Rose', color: 'bg-rose-400' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-400' },
    { value: 'green', label: 'Green', color: 'bg-green-400' },
    { value: 'yellow', label: 'Yellow', color: 'bg-yellow-300' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-400' },
    { value: 'aqua', label: 'Aqua', color: 'bg-cyan-300' },
    { value: 'gray', label: 'Gray', color: 'bg-gray-400' },
  ]
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="display" className="px-2" title="Display">
              <Sun className="h-4 w-4" />
              <span className="sr-only">Display</span>
            </TabsTrigger>
            <TabsTrigger value="bionic" className="px-2" title="Bionic">
              <Zap className="h-4 w-4" />
              <span className="sr-only">Bionic</span>
            </TabsTrigger>
            <TabsTrigger value="visual" className="px-2" title="Visual">
              <Layers className="h-4 w-4" />
              <span className="sr-only">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="tts" className="px-2" title="Text-to-Speech">
              <Volume2 className="h-4 w-4" />
              <span className="sr-only">Text-to-Speech</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="px-2" title="Performance">
              <Gauge className="h-4 w-4" />
              <span className="sr-only">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="a11y" className="px-2" title="Accessibility">
              <Accessibility className="h-4 w-4" />
              <span className="sr-only">Accessibility</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Display Settings */}
          <TabsContent value="display" className="mt-4 space-y-6">
            {/* Theme */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(['light', 'dark', 'sepia', 'high-contrast'] as Theme[]).map((theme) => (
                    <Button
                      key={theme}
                      variant={settings.theme === theme ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ theme })}
                      className="text-xs capitalize"
                    >
                      {theme.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Accent Color */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Accent Color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {accentColors.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => updateSettings({ accentColor: value })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color,
                        settings.accentColor === value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                      )}
                      aria-label={label}
                      title={label}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Typography */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Typography
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Font Family</Label>
                  <Select
                    value={settings.readerFont}
                    onValueChange={(value: ReaderFont) => updateSettings({ readerFont: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Geist)</SelectItem>
                      <SelectItem value="serif">Serif (Georgia)</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                      <SelectItem value="dyslexic">OpenDyslexic</SelectItem>
                      <SelectItem value="hyperlegible">Atkinson Hyperlegible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Font Size</Label>
                    <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
                  </div>
                  <Slider
                    value={[settings.fontSize]}
                    min={12}
                    max={32}
                    step={1}
                    onValueChange={([value]) => updateSettings({ fontSize: value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Line Height</Label>
                    <span className="text-xs text-muted-foreground">{settings.lineHeight.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[settings.lineHeight]}
                    min={1.2}
                    max={2.5}
                    step={0.1}
                    onValueChange={([value]) => updateSettings({ lineHeight: value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Letter Spacing (Tracking)</Label>
                    <span className="text-xs text-muted-foreground">{settings.letterSpacing.toFixed(2)}em</span>
                  </div>
                  <Slider
                    value={[settings.letterSpacing]}
                    min={0}
                    max={0.3}
                    step={0.01}
                    onValueChange={([value]) => updateSettings({ letterSpacing: value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Increases space between individual letters
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Word Spacing</Label>
                    <span className="text-xs text-muted-foreground">{settings.wordSpacing.toFixed(2)}em</span>
                  </div>
                  <Slider
                    value={[settings.wordSpacing]}
                    min={0}
                    max={0.5}
                    step={0.05}
                    onValueChange={([value]) => updateSettings({ wordSpacing: value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Bionic Reading Settings */}
          <TabsContent value="bionic" className="mt-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Bionic Reading
                </CardTitle>
                <CardDescription className="text-xs">
                  Highlight parts of words to guide your eyes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable Bionic Reading</Label>
                  <Switch
                    checked={settings.bionicEnabled}
                    onCheckedChange={(checked) => updateSettings({ bionicEnabled: checked })}
                  />
                </div>
                
                {settings.bionicEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Highlight Style</Label>
                      <Select
                        value={settings.bionicStyle}
                        onValueChange={(value: BionicStyle) => updateSettings({ bionicStyle: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bold-start">Bold (Start of word)</SelectItem>
                          <SelectItem value="bold-center">Bold (Center of word)</SelectItem>
                          <SelectItem value="color-start">Color (Start of word)</SelectItem>
                          <SelectItem value="color-center">Color (Center of word)</SelectItem>
                          <SelectItem value="opacity">Opacity (Fade rest)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Fixation Strength</Label>
                        <span className="text-xs text-muted-foreground">{settings.fixationStrength}</span>
                      </div>
                      <Slider
                        value={[settings.fixationStrength]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([value]) => updateSettings({ fixationStrength: value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher = more letters highlighted per word
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Saccade Rhythm</Label>
                        <span className="text-xs text-muted-foreground">
                          {settings.saccadeRhythm === 1 ? 'Every word' : `Every ${settings.saccadeRhythm} words`}
                        </span>
                      </div>
                      <Slider
                        value={[settings.saccadeRhythm]}
                        min={1}
                        max={3}
                        step={1}
                        onValueChange={([value]) => updateSettings({ saccadeRhythm: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Skip Common Words</Label>
                      <Switch
                        checked={settings.skipCommonWords}
                        onCheckedChange={(checked) => updateSettings({ skipCommonWords: checked })}
                      />
                    </div>
                    
                    {settings.bionicStyle === 'opacity' && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-xs">Fade Opacity</Label>
                          <span className="text-xs text-muted-foreground">{(settings.bionicOpacity * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                          value={[settings.bionicOpacity]}
                          min={0.3}
                          max={0.7}
                          step={0.05}
                          onValueChange={([value]) => updateSettings({ bionicOpacity: value })}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Syllable Color-Coding */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Syllable Color-Coding</CardTitle>
                <CardDescription className="text-xs">
                  Alternate colors for syllables in multi-syllabic words
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable Syllable Colors</Label>
                  <Switch
                    checked={settings.syllableColorEnabled}
                    onCheckedChange={(checked) => updateSettings({ syllableColorEnabled: checked })}
                  />
                </div>
                
                {settings.syllableColorEnabled && (
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Color 1</Label>
                      <input
                        type="color"
                        value={settings.syllableColors[0]}
                        onChange={(e) => updateSettings({ 
                          syllableColors: [e.target.value, settings.syllableColors[1]] 
                        })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Color 2</Label>
                      <input
                        type="color"
                        value={settings.syllableColors[1]}
                        onChange={(e) => updateSettings({ 
                          syllableColors: [settings.syllableColors[0], e.target.value] 
                        })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Character Disambiguation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Character Disambiguation</CardTitle>
                <CardDescription className="text-xs">
                  Color mirror letters (b/d, p/q) differently to prevent confusion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable Mirror Letter Colors</Label>
                  <Switch
                    checked={settings.charDisambiguationEnabled}
                    onCheckedChange={(checked) => updateSettings({ charDisambiguationEnabled: checked })}
                  />
                </div>
                
                {settings.charDisambiguationEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Letter b</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.charBColor}
                          onChange={(e) => updateSettings({ charBColor: e.target.value })}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <span className="text-lg font-bold" style={{ color: settings.charBColor }}>b</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Letter d</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.charDColor}
                          onChange={(e) => updateSettings({ charDColor: e.target.value })}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <span className="text-lg font-bold" style={{ color: settings.charDColor }}>d</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Letter p</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.charPColor}
                          onChange={(e) => updateSettings({ charPColor: e.target.value })}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <span className="text-lg font-bold" style={{ color: settings.charPColor }}>p</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Letter q</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.charQColor}
                          onChange={(e) => updateSettings({ charQColor: e.target.value })}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <span className="text-lg font-bold" style={{ color: settings.charQColor }}>q</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  BeeLine Reader
                </CardTitle>
                <CardDescription className="text-xs">
                  Color gradient guides eyes across lines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable BeeLine</Label>
                  <Switch
                    checked={settings.beelineEnabled}
                    onCheckedChange={(checked) => updateSettings({ 
                      beelineEnabled: checked,
                      bionicEnabled: checked ? false : settings.bionicEnabled 
                    })}
                  />
                </div>
                
                {settings.beelineEnabled && (
                  <div className="space-y-2">
                    <Label className="text-xs">Gradient Colors</Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <input
                          type="color"
                          value={settings.beelineColors[0]}
                          onChange={(e) => updateSettings({ 
                            beelineColors: [e.target.value, settings.beelineColors[1]] 
                          })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <input
                          type="color"
                          value={settings.beelineColors[1]}
                          onChange={(e) => updateSettings({ 
                            beelineColors: [settings.beelineColors[0], e.target.value] 
                          })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Reading Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={settings.readingMode}
                  onValueChange={(value: ReadingMode) => updateSettings({ readingMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scroll">Scroll Reading</SelectItem>
                    <SelectItem value="rsvp-single">RSVP (Single Word)</SelectItem>
                    <SelectItem value="rsvp-multi">RSVP (Multi-Word)</SelectItem>
                  </SelectContent>
                </Select>
                
                {settings.readingMode === 'rsvp-multi' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Words per Group</Label>
                      <span className="text-xs text-muted-foreground">{settings.wordsPerGroup}</span>
                    </div>
                    <Slider
                      value={[settings.wordsPerGroup]}
                      min={2}
                      max={7}
                      step={1}
                      onValueChange={([value]) => updateSettings({ wordsPerGroup: value })}
                    />
                  </div>
                )}
                
                {(settings.readingMode === 'rsvp-single' || settings.readingMode === 'rsvp-multi') && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Default Speed (WPM)</Label>
                        <span className="text-xs text-muted-foreground">{settings.wpm}</span>
                      </div>
                      <Slider
                        value={[settings.wpm]}
                        min={100}
                        max={1000}
                        step={25}
                        onValueChange={([value]) => updateSettings({ wpm: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-advance</Label>
                      <Switch
                        checked={settings.autoAdvance}
                        onCheckedChange={(checked) => updateSettings({ autoAdvance: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Auto-start Reading</Label>
                        <p className="text-xs text-muted-foreground">Start immediately when content loads</p>
                      </div>
                      <Switch
                        checked={settings.autoStartReading}
                        onCheckedChange={(checked) => updateSettings({ autoStartReading: checked })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Visual Aids Settings */}
          <TabsContent value="visual" className="mt-4 space-y-6">
            {/* Irlen Overlay */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Irlen Color Overlay
                </CardTitle>
                <CardDescription className="text-xs">
                  Tint the screen to reduce visual stress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {irlenColors.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => updateSettings({ irlenOverlay: value })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color,
                        settings.irlenOverlay === value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                      )}
                      aria-label={label}
                      title={label}
                    />
                  ))}
                </div>
                
                {settings.irlenOverlay !== 'none' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Overlay Intensity</Label>
                      <span className="text-xs text-muted-foreground">{(settings.irlenOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[settings.irlenOpacity]}
                      min={0.05}
                      max={0.4}
                      step={0.05}
                      onValueChange={([value]) => updateSettings({ irlenOpacity: value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Focus Mask */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Focus Mask (Reading Ruler)</CardTitle>
                <CardDescription className="text-xs">
                  Black out top and bottom, show only a few lines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable Focus Mask</Label>
                  <Switch
                    checked={settings.focusMaskEnabled}
                    onCheckedChange={(checked) => updateSettings({ focusMaskEnabled: checked })}
                  />
                </div>
                
                {settings.focusMaskEnabled && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Visible Lines</Label>
                      <span className="text-xs text-muted-foreground">{settings.focusMaskLines}</span>
                    </div>
                    <Slider
                      value={[settings.focusMaskLines]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={([value]) => updateSettings({ focusMaskLines: value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Vertical Rhythm Lines */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Vertical Rhythm Lines
                </CardTitle>
                <CardDescription className="text-xs">
                  Faint vertical guides to keep eyes aligned
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable Vertical Lines</Label>
                  <Switch
                    checked={settings.verticalRhythmLines}
                    onCheckedChange={(checked) => updateSettings({ verticalRhythmLines: checked })}
                  />
                </div>
                
                {settings.verticalRhythmLines && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Line Spacing</Label>
                        <span className="text-xs text-muted-foreground">{settings.verticalLineSpacing}px</span>
                      </div>
                      <Slider
                        value={[settings.verticalLineSpacing]}
                        min={20}
                        max={80}
                        step={5}
                        onValueChange={([value]) => updateSettings({ verticalLineSpacing: value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Line Opacity</Label>
                        <span className="text-xs text-muted-foreground">{(settings.verticalLineOpacity * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[settings.verticalLineOpacity]}
                        min={0.05}
                        max={0.2}
                        step={0.01}
                        onValueChange={([value]) => updateSettings({ verticalLineOpacity: value })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Homophone Indicators */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Homophone Indicators</CardTitle>
                <CardDescription className="text-xs">
                  Subtly mark words like there/their/they're
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable Homophone Hints</Label>
                  <Switch
                    checked={settings.homophoneEnabled}
                    onCheckedChange={(checked) => updateSettings({ homophoneEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* TTS Settings */}
          <TabsContent value="tts" className="mt-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Text-to-Speech
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable TTS</Label>
                  <Switch
                    checked={settings.ttsEnabled}
                    onCheckedChange={(checked) => updateSettings({ ttsEnabled: checked })}
                  />
                </div>
                
                {settings.ttsEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Voice</Label>
                      <Select
                        value={settings.ttsVoice || 'default'}
                        onValueChange={(value) => updateSettings({ ttsVoice: value === 'default' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="System Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">System Default</SelectItem>
                          {voices.map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Speed</Label>
                        <span className="text-xs text-muted-foreground">{settings.ttsRate.toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={[settings.ttsRate]}
                        min={0.5}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => updateSettings({ ttsRate: value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Pitch</Label>
                        <span className="text-xs text-muted-foreground">{settings.ttsPitch.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[settings.ttsPitch]}
                        min={0.5}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => updateSettings({ ttsPitch: value })}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance('Testing voice settings')
                        utterance.rate = settings.ttsRate
                        utterance.pitch = settings.ttsPitch
                        if (settings.ttsVoice) {
                          const voice = voices.find(v => v.name === settings.ttsVoice)
                          if (voice) utterance.voice = voice
                        }
                        window.speechSynthesis?.speak(utterance)
                      }}
                    >
                      Test Voice
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Settings */}
          <TabsContent value="performance" className="mt-4 space-y-6">
            {/* Device Profile Presets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Device Profile
                </CardTitle>
                <CardDescription className="text-xs">
                  Quick presets optimized for different device capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={settings.performanceMode === 'auto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ 
                      performanceMode: 'auto',
                      wordsPerChunk: 200,
                      virtualBufferSize: 5,
                      paragraphHeightEstimate: 150,
                      enableVirtualization: true,
                      textProcessingChunkSize: 100000,
                      enableSmoothScrolling: true,
                      maxRenderParagraphs: 30
                    })}
                    className="flex items-center gap-2"
                  >
                    <Cpu className="h-4 w-4" />
                    Auto
                  </Button>
                  <Button
                    variant={settings.performanceMode === 'low' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ 
                      performanceMode: 'low',
                      wordsPerChunk: 100,
                      virtualBufferSize: 2,
                      paragraphHeightEstimate: 120,
                      enableVirtualization: true,
                      textProcessingChunkSize: 25000,
                      enableSmoothScrolling: false,
                      maxRenderParagraphs: 10
                    })}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Low-End
                  </Button>
                  <Button
                    variant={settings.performanceMode === 'balanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ 
                      performanceMode: 'balanced',
                      wordsPerChunk: 200,
                      virtualBufferSize: 5,
                      paragraphHeightEstimate: 150,
                      enableVirtualization: true,
                      textProcessingChunkSize: 100000,
                      enableSmoothScrolling: true,
                      maxRenderParagraphs: 30
                    })}
                    className="flex items-center gap-2"
                  >
                    <Laptop className="h-4 w-4" />
                    Balanced
                  </Button>
                  <Button
                    variant={settings.performanceMode === 'high' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ 
                      performanceMode: 'high',
                      wordsPerChunk: 500,
                      virtualBufferSize: 10,
                      paragraphHeightEstimate: 200,
                      enableVirtualization: false,
                      textProcessingChunkSize: 200000,
                      enableSmoothScrolling: true,
                      maxRenderParagraphs: 100
                    })}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    High-End
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.performanceMode === 'auto' && 'Automatically adjusts based on your device'}
                  {settings.performanceMode === 'low' && 'Optimized for older phones and tablets'}
                  {settings.performanceMode === 'balanced' && 'Good balance of performance and quality'}
                  {settings.performanceMode === 'high' && 'Maximum quality for powerful devices'}
                </p>
              </CardContent>
            </Card>
            
            {/* Render Chunk Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Render Chunks
                </CardTitle>
                <CardDescription className="text-xs">
                  Control how text is divided and rendered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Words Per Chunk</Label>
                    <span className="text-xs text-muted-foreground">{settings.wordsPerChunk}</span>
                  </div>
                  <Slider
                    value={[settings.wordsPerChunk]}
                    min={50}
                    max={500}
                    step={25}
                    onValueChange={([value]) => updateSettings({ wordsPerChunk: value, performanceMode: 'auto' })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fewer words = faster initial load, more = smoother scrolling
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Max Render Paragraphs</Label>
                    <span className="text-xs text-muted-foreground">{settings.maxRenderParagraphs}</span>
                  </div>
                  <Slider
                    value={[settings.maxRenderParagraphs]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([value]) => updateSettings({ maxRenderParagraphs: value, performanceMode: 'auto' })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum paragraphs rendered at once
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Text Processing Chunk Size</Label>
                    <span className="text-xs text-muted-foreground">{(settings.textProcessingChunkSize / 1000).toFixed(0)}k chars</span>
                  </div>
                  <Slider
                    value={[settings.textProcessingChunkSize]}
                    min={25000}
                    max={200000}
                    step={25000}
                    onValueChange={([value]) => updateSettings({ textProcessingChunkSize: value, performanceMode: 'auto' })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Characters processed per frame during parsing
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Layout & Virtualization */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Rows3 className="h-4 w-4" />
                  Layout & Virtualization
                </CardTitle>
                <CardDescription className="text-xs">
                  Control scroll behavior and layout rendering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Enable Virtualization</Label>
                    <p className="text-xs text-muted-foreground">Only render visible paragraphs</p>
                  </div>
                  <Switch
                    checked={settings.enableVirtualization}
                    onCheckedChange={(checked) => updateSettings({ enableVirtualization: checked, performanceMode: 'auto' })}
                  />
                </div>
                
                {settings.enableVirtualization && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Virtual Buffer Size</Label>
                        <span className="text-xs text-muted-foreground">{settings.virtualBufferSize} paragraphs</span>
                      </div>
                      <Slider
                        value={[settings.virtualBufferSize]}
                        min={2}
                        max={10}
                        step={1}
                        onValueChange={([value]) => updateSettings({ virtualBufferSize: value, performanceMode: 'auto' })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Extra paragraphs rendered above/below viewport
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Paragraph Height Estimate</Label>
                        <span className="text-xs text-muted-foreground">{settings.paragraphHeightEstimate}px</span>
                      </div>
                      <Slider
                        value={[settings.paragraphHeightEstimate]}
                        min={80}
                        max={300}
                        step={10}
                        onValueChange={([value]) => updateSettings({ paragraphHeightEstimate: value, performanceMode: 'auto' })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Adjust if scrollbar jumps or content shifts
                      </p>
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Smooth Scrolling</Label>
                    <p className="text-xs text-muted-foreground">CSS smooth scroll behavior</p>
                  </div>
                  <Switch
                    checked={settings.enableSmoothScrolling}
                    onCheckedChange={(checked) => updateSettings({ enableSmoothScrolling: checked, performanceMode: 'auto' })}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Reading Space Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Columns3 className="h-4 w-4" />
                  Reading Space
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize content layout and spacing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Current Configuration</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Chunks: {settings.wordsPerChunk} words</div>
                    <div>Buffer: {settings.virtualBufferSize} paragraphs</div>
                    <div>Max render: {settings.maxRenderParagraphs}</div>
                    <div>Est. height: {settings.paragraphHeightEstimate}px</div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => updateSettings({
                    performanceMode: 'balanced',
                    wordsPerChunk: 200,
                    virtualBufferSize: 5,
                    paragraphHeightEstimate: 150,
                    enableVirtualization: true,
                    textProcessingChunkSize: 100000,
                    enableSmoothScrolling: true,
                    maxRenderParagraphs: 30
                  })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Balanced Defaults
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Accessibility Settings */}
          <TabsContent value="a11y" className="mt-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Color Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Colorblind Mode</Label>
                  <Select
                    value={settings.colorblindMode}
                    onValueChange={(value: ColorblindMode) => updateSettings({ colorblindMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                      <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                      <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Motion Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Motion Controls
                </CardTitle>
                <CardDescription className="text-xs">
                  Alternative input methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Tremor Cancellation</Label>
                    <p className="text-xs text-muted-foreground">Stabilize text for shaky hands</p>
                  </div>
                  <Switch
                    checked={settings.tremorCancellation}
                    onCheckedChange={(checked) => updateSettings({ tremorCancellation: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Tilt-to-Scroll</Label>
                    <p className="text-xs text-muted-foreground">Tilt phone to scroll (RSI friendly)</p>
                  </div>
                  <Switch
                    checked={settings.tiltToScroll}
                    onCheckedChange={(checked) => updateSettings({ tiltToScroll: checked })}
                  />
                </div>
                
                {settings.tiltToScroll && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Tilt Sensitivity</Label>
                      <span className="text-xs text-muted-foreground">{settings.tiltSensitivity}</span>
                    </div>
                    <Slider
                      value={[settings.tiltSensitivity]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={([value]) => updateSettings({ tiltSensitivity: value })}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Volume Rocker Navigation</Label>
                    <p className="text-xs text-muted-foreground">Use volume buttons to navigate</p>
                  </div>
                  <Switch
                    checked={settings.volumeRockerNavigation}
                    onCheckedChange={(checked) => updateSettings({ volumeRockerNavigation: checked })}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Accessibility className="h-4 w-4" />
                  General Accessibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Reduced Motion</Label>
                    <p className="text-xs text-muted-foreground">Disable animations</p>
                  </div>
                  <Switch
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">High Contrast Focus</Label>
                    <p className="text-xs text-muted-foreground">Enhanced focus indicators</p>
                  </div>
                  <Switch
                    checked={settings.highContrastFocus}
                    onCheckedChange={(checked) => updateSettings({ highContrastFocus: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Large Touch Targets</Label>
                    <p className="text-xs text-muted-foreground">44px minimum touch areas</p>
                  </div>
                  <Switch
                    checked={settings.largeClickTargets}
                    onCheckedChange={(checked) => updateSettings({ largeClickTargets: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Screen Reader Optimized</Label>
                    <p className="text-xs text-muted-foreground">Enhanced ARIA labels</p>
                  </div>
                  <Switch
                    checked={settings.screenReaderOptimized}
                    onCheckedChange={(checked) => updateSettings({ screenReaderOptimized: checked })}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Button
              variant="outline"
              onClick={resetSettings}
              className="w-full bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
