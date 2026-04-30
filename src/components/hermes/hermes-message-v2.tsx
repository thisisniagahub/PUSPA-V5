'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Wrench, Clock, ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HermesChatMessage } from '@/stores/hermes-store'
import { PROVIDERS } from '@/lib/hermes/provider-types'

interface HermesMessageV2Props {
  message: HermesChatMessage
  isLast?: boolean
}

function renderContent(content: string): string {
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 my-2 overflow-x-auto text-xs font-mono border border-black/5"><code>$2</code></pre>')
    .replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-xs font-mono border border-black/5">$1</code>')
    .replace(/^### (.*$)/gm, '<h4 class="font-bold text-sm mt-3 mb-1 text-zinc-900">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold text-base mt-3 mb-1 text-zinc-900">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="font-bold text-lg mt-3 mb-1 text-zinc-900">$1</h2>')
    .replace(/^[•●] (.*$)/gm, '<li class="ml-4 list-disc text-zinc-700">$1</li>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-zinc-700">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-zinc-700">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>')

  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }

  return html
}

export function HermesMessageV2({ message, isLast }: HermesMessageV2Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* */ }
  }

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const providerInfo = message.provider ? PROVIDERS[message.provider] : null

  const renderedContent = useMemo(() => {
    if (isUser) return message.content
    return renderContent(message.content)
  }, [message.content, isUser])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('group flex flex-col', isUser ? 'items-end' : 'items-start')}
    >
      {/* Tool badge */}
      {message.isToolResult && message.toolName && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 border border-violet-200">
            <Wrench className="h-2.5 w-2.5" />
            {message.toolName}
          </span>
        </div>
      )}

      {/* Message bubble */}
      <div className={cn('relative max-w-[88%] rounded-2xl text-[13px] leading-[1.6]', 
        isUser
          ? 'bg-zinc-900 text-white dark:bg-zinc-800 px-4 py-3'
          : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 px-4 py-3 border border-black/5 dark:border-white/5'
      )}>
        {/* Copy button for assistant */}
        {!isUser && !message.isStreaming && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
            aria-label="Salin mesej"
          >
            {copied ? (
              <Check className="h-3 w-3 text-violet-600" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-400" />
            )}
          </button>
        )}

        {/* Content */}
        <div
          className={cn(
            'whitespace-pre-wrap break-words hermes-content-v2',
            isUser ? '' : '[&_strong]:font-semibold [&_code]:text-violet-600 dark:[&_code]:text-violet-400 [&_pre]:text-zinc-800 dark:[&_pre]:text-zinc-200 [&_h2]:text-zinc-900 [&_h3]:text-zinc-900 [&_h4]:text-zinc-900 [&_li]:text-zinc-700 dark:[&_li]:text-zinc-300',
          )}
          dangerouslySetInnerHTML={isUser ? undefined : { __html: renderedContent }}
        >
          {isUser ? message.content : undefined}
        </div>

        {/* Streaming cursor */}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle rounded-sm" />
        )}

        {/* Client action button */}
        {!isUser && message.clientAction && !message.isStreaming && (
          <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5">
            <button
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 hover:text-violet-700 transition-colors rounded-lg px-2 py-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
            >
              {message.clientAction.type === 'navigate' ? <ExternalLink className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              {message.clientAction.message || message.clientAction.type}
            </button>
          </div>
        )}
      </div>

      {/* Footer metadata */}
      <div className={cn('flex items-center gap-2 mt-1 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <span className="text-[10px] text-zinc-400">{formattedTime}</span>
        {!isUser && providerInfo && (
          <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
            <span>{providerInfo.icon}</span>
            {providerInfo.name}
          </span>
        )}
        {!isUser && message.latencyMs && message.latencyMs > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
            <Clock className="h-2.5 w-2.5" />
            {message.latencyMs < 1000 ? `${message.latencyMs}ms` : `${(message.latencyMs / 1000).toFixed(1)}s`}
          </span>
        )}
      </div>
    </motion.div>
  )
}
