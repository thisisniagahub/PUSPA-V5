'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Loader2, Settings, RotateCcw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { HermesStatus } from '@/stores/hermes-store'

interface HermesChatInputProps {
  onSend: (text: string) => void
  onClear?: () => void
  onToggleSettings?: () => void
  disabled?: boolean
  placeholder?: string
  status: HermesStatus
  providerInfo: { icon: string; name: string }
  modelLabel?: string
  toolsUsed?: number
  messageCount?: number
}

export function HermesChatInput({
  onSend,
  onClear,
  onToggleSettings,
  disabled,
  placeholder,
  status,
  providerInfo,
  modelLabel,
  toolsUsed = 0,
  messageCount = 0,
}: HermesChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isBusy = status === 'thinking' || status === 'streaming'

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [input])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isBusy) return
    setInput('')
    onSend(text)
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, isBusy, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const defaultPlaceholder = isBusy
    ? 'PUSPA sedang berfikir...'
    : 'Taip mesej anda...'

  return (
    <div className="space-y-2">
      {/* Input area */}
      <div className={cn(
        'relative flex items-end gap-2 rounded-2xl border bg-white dark:bg-zinc-900 px-3 py-2 transition-all',
        'border-black/10 dark:border-white/10',
        'focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500/50',
        isBusy && 'opacity-80',
      )}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          disabled={isBusy || disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-[13px] leading-[1.6] text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 focus:outline-none',
            'max-h-[120px]',
          )}
          style={{ minHeight: '24px' }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isBusy}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
            input.trim() && !isBusy
              ? 'bg-violet-600 dark:bg-violet-500 text-white hover:opacity-80 active:scale-95'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed',
          )}
          aria-label="Hantar mesej"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1 border-black/5 dark:border-white/10">
            <span>{providerInfo.icon}</span>
            {providerInfo.name}
          </Badge>
          {modelLabel && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-zinc-100 dark:bg-zinc-800">
              {modelLabel}
            </Badge>
          )}
          {toolsUsed > 0 && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1 text-violet-600 border-violet-200 dark:border-violet-800">
              <Wrench className="h-2.5 w-2.5" />
              {toolsUsed}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {messageCount > 0 && onClear && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
              onClick={onClear}
              aria-label="Semakan semula"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          {onToggleSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
              onClick={onToggleSettings}
              aria-label="Tetapan"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
