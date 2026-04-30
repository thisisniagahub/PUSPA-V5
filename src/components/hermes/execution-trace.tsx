'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Wrench, Loader2, CheckCircle2, AlertTriangle, Zap, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentStep } from '@/stores/hermes-store'

interface ExecutionTraceProps {
  steps: AgentStep[]
  isLive?: boolean
}

const stepIcons: Record<AgentStep['type'], React.ReactNode> = {
  planning: <Brain className="h-3 w-3" />,
  tool_call: <Wrench className="h-3 w-3" />,
  processing: <Zap className="h-3 w-3" />,
  thinking: <Loader2 className="h-3 w-3 animate-spin" />,
  success: <CheckCircle2 className="h-3 w-3" />,
  error: <AlertTriangle className="h-3 w-3" />,
}

const stepColors: Record<AgentStep['type'], string> = {
  planning: 'text-zinc-500',
  tool_call: 'text-violet-600',
  processing: 'text-amber-600',
  thinking: 'text-zinc-400',
  success: 'text-violet-600',
  error: 'text-red-500',
}

const stepBgColors: Record<AgentStep['type'], string> = {
  planning: 'bg-zinc-100',
  tool_call: 'bg-violet-50 border-violet-200',
  processing: 'bg-amber-50 border-amber-200',
  thinking: 'bg-zinc-50',
  success: 'bg-violet-50',
  error: 'bg-red-50 border-red-200',
}

const stepBadgeColors: Record<AgentStep['type'], string> = {
  planning: 'bg-zinc-900 text-white',
  tool_call: 'bg-violet-600 text-white',
  processing: 'bg-amber-600 text-white',
  thinking: 'bg-zinc-400 text-white',
  success: 'bg-violet-600 text-white',
  error: 'bg-red-500 text-white',
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 1000) return 'now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  return `${Math.floor(diff / 3600000)}h`
}

export function ExecutionTrace({ steps, isLive = false }: ExecutionTraceProps) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
          <Zap className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Execution Trace</p>
        <p className="text-[11px] text-zinc-400 mt-1">Langkah agent akan dipaparkan di sini</p>
      </div>
    )
  }

  const hasRunningStep = steps.some(s => s.status === 'running')

  return (
    <div className="py-3 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Trace</span>
          {isLive && hasRunningStep && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[9px] font-semibold text-violet-600 uppercase">Live</span>
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-400">{steps.length} langkah</span>
      </div>

      {/* Steps */}
      <div className="relative space-y-0">
        {steps.map((step, index) => (
          <AnimatePresence key={step.id} mode="popLayout">
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[11px] top-[26px] bottom-0 w-px bg-zinc-200" />
              )}

              <div className="flex items-start gap-3 py-1.5">
                {/* Step icon */}
                <div
                  className={cn(
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors',
                    step.status === 'completed' ? stepBadgeColors[step.type] : 'bg-zinc-100 border-zinc-200 text-zinc-400',
                    step.status === 'error' && stepBadgeColors[step.type],
                    step.status === 'running' && 'bg-violet-500 text-white border-violet-500 animate-pulse',
                  )}
                >
                  {step.status === 'running'
                    ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    : stepIcons[step.type]
                  }
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      step.status === 'completed' ? stepColors[step.type] : 'text-zinc-400',
                      step.status === 'running' && 'text-violet-600',
                    )}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-zinc-300">
                      {getRelativeTime(step.timestamp)}
                    </span>
                    {step.duration && step.duration > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
                        <Clock className="h-2 w-2" />
                        {step.duration < 1000 ? `${step.duration}ms` : `${(step.duration / 1000).toFixed(1)}s`}
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p className={cn(
                      'text-[11px] mt-0.5 leading-snug',
                      step.status === 'completed' ? 'text-zinc-500' : 'text-zinc-400',
                    )}>
                      {step.detail}
                    </p>
                  )}
                  {step.toolName && step.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-700 border border-violet-100">
                      <Wrench className="h-2 w-2" />
                      {step.toolName}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
    </div>
  )
}
