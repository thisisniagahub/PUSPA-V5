'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RotateCcw, X, Settings, Send, Zap, Brain, ChevronDown, Loader2, History, Wrench, AlertTriangle, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { useHermesStore } from '@/stores/hermes-store'
import { viewLabels } from '@/types'
import { HermesMessage } from './hermes-message'
import { HermesChatHeader } from './hermes-chat-header'
import { HermesSettings } from './hermes-settings'
import { getQuickActions } from '@/lib/hermes/quick-actions'
import { cn } from '@/lib/utils'
import { PROVIDERS } from '@/lib/hermes/provider-types'

export function HermesPanel() {
  const {
    isOpen, status, messages, currentView, showSettings,
    clearMessages, sendMessage, sendMessageStream,
    providerState, setShowSettings, addPendingAction, consumePendingAction,
  } = useHermesStore()

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Process pending actions
  useEffect(() => {
    const action = consumePendingAction()
    if (action?.type === 'navigate' && action.viewId) {
      // Navigation will be handled by the parent shell
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || status === 'thinking' || status === 'streaming') return

    setInput('')
    if (providerState.provider === 'zai') {
      await sendMessage(text)
    } else {
      await sendMessageStream(text)
    }
  }, [input, status, providerState.provider, sendMessage, sendMessageStream])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const quickActions = getQuickActions(currentView)
  const providerInfo = PROVIDERS[providerState.provider]

  if (!isOpen) return null

  // Count tools used in conversation
  const toolsUsed = messages.filter(m => m.isToolResult || m.toolName).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl lg:bottom-28 lg:right-8"
      style={{ width: '420px', height: '600px', maxHeight: 'calc(100vh - 140px)' }}
    >
      {/* Header */}
      <HermesChatHeader />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b"
          >
            <HermesSettings />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #7e22ce 100%)' }}
            >
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">PUSPA AI</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                Ejen AI pintar PUSPA dengan akses penuh ke seluruh sistem — boleh cari, cipta, kemaskini, dan analisis data
              </p>
            </div>

            {/* Capability Badges */}
            <div className="flex flex-wrap justify-center gap-1.5">
              <Badge variant="outline" className="text-[10px] gap-1 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800">
                <Search className="h-3 w-3" /> Carian
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                <Wrench className="h-3 w-3" /> CRUD
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-800">
                <Brain className="h-3 w-3" /> Analisis
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                <Zap className="h-3 w-3" /> Automasi
              </Badge>
            </div>

            {/* Provider Badge */}
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span>{providerInfo.icon}</span>
              <span>{providerInfo.name}</span>
              {providerState.provider !== 'zai' && (
                <span className="text-muted-foreground">• {providerState.model.split('/').pop()}</span>
              )}
            </Badge>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {quickActions.slice(0, 5).map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    setInput(action.query)
                    inputRef.current?.focus()
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <HermesMessage key={msg.id} message={msg} />
            ))}

            {/* Streaming indicator */}
            {status === 'streaming' && messages[messages.length - 1]?.isStreaming && (
              <div className="flex items-center gap-2 px-4">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-muted-foreground">PUSPA sedang menaip...</span>
              </div>
            )}

            {/* Thinking indicator */}
            {status === 'thinking' && (
              <div className="flex items-center gap-2 px-4">
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                <span className="text-xs text-muted-foreground">Memproses...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions Bar (when messages exist) */}
      {messages.length > 0 && status === 'idle' && (
        <div className="border-t px-3 py-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                onClick={() => setInput(action.query)}
                className="shrink-0 text-[10px] px-2 py-1 rounded-full border bg-background hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-3 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={status === 'thinking' || status === 'streaming' ? 'PUSPA sedang berfikir...' : 'Taip mesej anda...'}
              disabled={status === 'thinking' || status === 'streaming'}
              className="pr-2 text-sm h-10 rounded-xl border-border focus-visible:ring-violet-500/30"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!input.trim() || status === 'thinking' || status === 'streaming'}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' : undefined,
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1">
              <span>{providerInfo.icon}</span>
              {providerInfo.name}
            </Badge>
            {providerState.provider !== 'zai' && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                {providerState.model.split('/').pop()?.slice(0, 20)}
              </Badge>
            )}
            {toolsUsed > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1 text-violet-600 border-violet-200">
                <Wrench className="h-2.5 w-2.5" /> {toolsUsed}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={clearMessages}
              aria-label="Semakan semula"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Tetapan"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Simple Search icon component for the capability badge
function Search({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
