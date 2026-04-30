'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, Maximize2, Minimize2, Settings,
  Search, Wrench, Brain, Zap, ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHermesStore } from '@/stores/hermes-store'
import { viewLabels } from '@/types'
import { HermesMessageV2 } from './hermes-message-v2'
import { HermesChatInput } from './hermes-chat-input'
import { HermesSettings } from './hermes-settings'
import { ExecutionTrace } from './execution-trace'
import { getQuickActions } from '@/lib/hermes/quick-actions'
import { cn } from '@/lib/utils'
import { PROVIDERS } from '@/lib/hermes/provider-types'

export function HermesDashboard() {
  const {
    isOpen, viewMode, status, messages, currentView, showSettings,
    clearMessages, sendMessage, sendMessageStream,
    providerState, setShowSettings, setViewMode,
    activeSteps, addPendingAction, consumePendingAction,
  } = useHermesStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [traceCollapsed, setTraceCollapsed] = useState(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  // Process pending actions
  useEffect(() => {
    const action = consumePendingAction()
    if (action?.type === 'navigate' && action.viewId) {
      // Navigation will be handled by the parent shell
    }
  }, [messages])

  const handleSend = useCallback(async (text: string) => {
    if (status === 'thinking' || status === 'streaming') return
    if (providerState.provider === 'zai') {
      await sendMessage(text)
    } else {
      await sendMessageStream(text)
    }
  }, [status, providerState.provider, sendMessage, sendMessageStream])

  const quickActions = getQuickActions(currentView)
  const providerInfo = PROVIDERS[providerState.provider]
  const toolsUsed = messages.filter(m => m.isToolResult || m.toolName).length
  const isLive = status === 'thinking' || status === 'streaming'
  const moduleLabel = viewLabels[currentView] || 'Dashboard'

  // Collect all steps from messages for the trace panel
  const allSteps = activeSteps.length > 0
    ? activeSteps
    : messages.flatMap(m => m.steps || [])

  if (!isOpen) return null

  // Fullscreen layout
  if (viewMode === 'fullscreen') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-white dark:bg-zinc-950"
      >
        {/* Sidebar Navigation */}
        <div className="hidden lg:flex w-[200px] flex-col border-r border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-black/5 dark:border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">PUSPA</p>
              <p className="text-[9px] text-zinc-400 uppercase tracking-wider">AI ASSISTANT</p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-2 space-y-0.5">
            {['Chat', 'Dashboards', 'Reports', 'Orders', 'Reviews'].map((item) => (
              <button
                key={item}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-colors',
                  item === 'Chat'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                )}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Provider */}
          <div className="p-3 border-t border-black/5 dark:border-white/5">
            <Badge variant="outline" className="w-full justify-center text-[9px] gap-1 border-black/5 dark:border-white/10">
              <span>{providerInfo.icon}</span>
              {providerInfo.name}
            </Badge>
          </div>
        </div>

        {/* Main Content: Trace + Chat */}
        <div className="flex-1 flex flex-row-reverse min-w-0">
          {/* Execution Trace Panel (Right) */}
          <div className={cn(
            'border-l border-black/5 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50 transition-all duration-300',
            traceCollapsed ? 'w-0 overflow-hidden' : 'w-[320px]'
          )}>
            <div className="h-full flex flex-col">
              {/* Trace Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Execution Trace</span>
                  {isLive && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-[9px] font-semibold text-violet-600 uppercase">Live</span>
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
                  onClick={() => setTraceCollapsed(true)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>

              {/* Trace Content */}
              <ScrollArea className="flex-1">
                <ExecutionTrace steps={allSteps} isLive={isLive} />
              </ScrollArea>
            </div>
          </div>

          {/* Expand trace button (when collapsed) */}
          {traceCollapsed && (
            <button
              onClick={() => setTraceCollapsed(false)}
              className="flex items-center gap-1 px-2 border-l border-black/5 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="text-[9px] uppercase font-semibold tracking-wider">Trace</span>
            </button>
          )}

          {/* Chat Area (Left) */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">PUSPA AI</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800">
                      {moduleLabel}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400">Cerdas. Mesra. Sentiasa di sisi anda.</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <span className="text-[10px] text-zinc-400 mr-2">{messages.length} mesej</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                  onClick={() => setViewMode('panel')}
                  aria-label="Minimize"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                  onClick={() => useHermesStore.getState().setOpen(false)}
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-black/5 dark:border-white/5"
                >
                  <HermesSettings />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-12">
                  {/* Hero */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/20">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Hai! 😊</h2>
                    <p className="text-sm text-zinc-500 mt-2 max-w-[400px] leading-relaxed">
                      Saya PUSPA, AI Assistant anda. Ada apa yang boleh saya bantu hari ini?
                    </p>
                    <p className="text-[11px] text-violet-500/70 mt-1 italic">Cerdas. Mesra. Sentiasa di sisi anda.</p>
                  </div>

                  {/* Capability Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 max-w-lg">
                    {[
                      { icon: <Search className="h-4 w-4" />, label: 'Carian', desc: 'Cari data', color: 'text-violet-600 bg-violet-50 border-violet-100' },
                      { icon: <Wrench className="h-4 w-4" />, label: 'CRUD', desc: 'Cipta & edit', color: 'text-purple-600 bg-purple-50 border-purple-100' },
                      { icon: <Brain className="h-4 w-4" />, label: 'Analisis', desc: 'Insight data', color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
                      { icon: <Zap className="h-4 w-4" />, label: 'Automasi', desc: 'Proses pantas', color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    ].map((cap) => (
                      <div key={cap.label} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border', cap.color)}>
                        {cap.icon}
                        <span className="text-[11px] font-semibold">{cap.label}</span>
                        <span className="text-[9px] opacity-70">{cap.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
                    {quickActions.slice(0, 6).map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleSend(action.query)}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 transition-all hover:shadow-sm active:scale-95"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>

                  {/* Provider */}
                  <Badge variant="outline" className="gap-1.5 text-xs border-black/5 dark:border-white/10">
                    <span>{providerInfo.icon}</span>
                    <span>{providerInfo.name}</span>
                    {providerState.provider !== 'zai' && (
                      <span className="text-zinc-400">• {providerState.model.split('/').pop()}</span>
                    )}
                  </Badge>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <HermesMessageV2
                      key={msg.id}
                      message={msg}
                      isLast={i === messages.length - 1}
                    />
                  ))}

                  {/* Streaming indicator */}
                  {status === 'streaming' && messages[messages.length - 1]?.isStreaming && (
                    <div className="flex items-center gap-2 px-2">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] text-zinc-400">PUSPA sedang menaip...</span>
                    </div>
                  )}

                  {/* Thinking indicator */}
                  {status === 'thinking' && (
                    <div className="flex items-center gap-2 px-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      <span className="text-[11px] text-zinc-400">Memproses...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-black/5 dark:border-white/5 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
              {/* Quick actions (when messages exist and idle) */}
              {messages.length > 0 && status === 'idle' && (
                <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {quickActions.slice(0, 4).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleSend(action.query)}
                      className="shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-all whitespace-nowrap active:scale-95"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <HermesChatInput
                onSend={handleSend}
                onClear={clearMessages}
                onToggleSettings={() => setShowSettings(!showSettings)}
                status={status}
                providerInfo={providerInfo}
                modelLabel={providerState.provider !== 'zai' ? providerState.model.split('/').pop()?.slice(0, 20) : undefined}
                toolsUsed={toolsUsed}
                messageCount={messages.length}
              />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Panel mode (original floating panel, redesigned)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-2xl lg:bottom-28 lg:right-8"
      style={{ width: '440px', height: '640px', maxHeight: 'calc(100vh - 140px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">PUSPA</span>
              <span className="text-violet-500">✨</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-black/5 dark:border-white/10">
                <span>{providerInfo.icon}</span>
                {providerInfo.name}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 w-fit bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {moduleLabel}
              </Badge>
              {isLive && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-[9px] text-violet-600">Live</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
            onClick={() => setViewMode('fullscreen')}
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Tetapan"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
            onClick={() => useHermesStore.getState().setOpen(false)}
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-black/5 dark:border-white/5"
          >
            <HermesSettings />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Trace (when active) */}
      {activeSteps.length > 0 && isLive && (
        <div className="border-b border-black/5 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
          <ExecutionTrace steps={activeSteps} isLive={isLive} />
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Hai! 😊</h3>
              <p className="text-[12px] text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
                Saya PUSPA, AI Assistant anda. Ada apa yang boleh saya bantu hari ini?
              </p>
              <p className="text-[10px] text-violet-500/70 mt-0.5 italic">Cerdas. Mesra. Sentiasa di sisi anda.</p>
            </div>

            {/* Capabilities */}
            <div className="flex flex-wrap justify-center gap-1.5">
              <Badge variant="outline" className="text-[10px] gap-1 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800">
                <Search className="h-3 w-3" /> Carian
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                <Wrench className="h-3 w-3" /> CRUD
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                <Brain className="h-3 w-3" /> Analisis
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                <Zap className="h-3 w-3" /> Automasi
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {quickActions.slice(0, 5).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSend(action.query)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 transition-all active:scale-95"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <HermesMessageV2
                key={msg.id}
                message={msg}
                isLast={i === messages.length - 1}
              />
            ))}

            {status === 'streaming' && messages[messages.length - 1]?.isStreaming && (
              <div className="flex items-center gap-2 px-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-zinc-400">PUSPA sedang menaip...</span>
              </div>
            )}

            {status === 'thinking' && (
              <div className="flex items-center gap-2 px-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <span className="text-[11px] text-zinc-400">Memproses...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick actions bar (when messages exist) */}
      {messages.length > 0 && status === 'idle' && (
        <div className="border-t border-black/5 dark:border-white/5 px-3 py-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                onClick={() => handleSend(action.query)}
                className="shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-all whitespace-nowrap active:scale-95"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-black/5 dark:border-white/5 p-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
        <HermesChatInput
          onSend={handleSend}
          onClear={clearMessages}
          onToggleSettings={() => setShowSettings(!showSettings)}
          status={status}
          providerInfo={providerInfo}
          modelLabel={providerState.provider !== 'zai' ? providerState.model.split('/').pop()?.slice(0, 20) : undefined}
          toolsUsed={toolsUsed}
          messageCount={messages.length}
        />
      </div>
    </motion.div>
  )
}
