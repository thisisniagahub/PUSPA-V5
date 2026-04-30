'use client'

import { Sparkles, RotateCcw, X, Settings, Brain, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHermesStore } from '@/stores/hermes-store'
import { viewLabels } from '@/types'
import { PROVIDERS } from '@/lib/hermes/provider-types'

export function HermesChatHeader() {
  const { currentView, clearMessages, setOpen, messages, showSettings, setShowSettings, providerState } = useHermesStore()

  const moduleLabel = viewLabels[currentView] || 'Dashboard'
  const providerInfo = PROVIDERS[providerState.provider]

  return (
    <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* PUSPA avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #7e22ce 100%)',
          }}
        >
          <Sparkles className="h-5 w-5 text-white" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">PUSPA</span>
            <span className="text-violet-500">✨</span>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
            >
              {providerInfo.icon} {providerInfo.name}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 w-fit bg-muted text-muted-foreground"
            >
              {moduleLabel}
            </Badge>
            {messages.length > 0 && (
              <span className="text-[9px] text-muted-foreground">
                {messages.length} mesej
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Tetapan provider"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={clearMessages}
            aria-label="Semakan semula perbualan"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(false)}
          aria-label="Tutup panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
