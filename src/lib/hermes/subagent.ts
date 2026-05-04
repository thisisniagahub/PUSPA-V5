// ============================================================
// Hermes Agent V2 — Subagent Delegation
// Spawn isolated subagents for parallel work
// Each subagent runs independently with its own context
// ============================================================

import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// ── Types ───────────────────────────────────────────────────

export interface SubagentOptions {
  model?: string
  provider?: string
  maxTokens?: number
  timeoutMs?: number
  systemPrompt?: string
}

export interface SubagentStatus {
  id: string
  parentSessionId: string
  userId: string
  task: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  result: string | null
  model: string | null
  provider: string | null
  tokensUsed: number
  startedAt: Date
  completedAt: Date | null
  durationMs: number | null
}

export interface SubagentListFilters {
  status?: string
  parentSessionId?: string
  limit?: number
}

// ── Spawn Subagent ──────────────────────────────────────────

/** Create and run a subagent for a parallel task */
export async function spawnSubagent(
  userId: string,
  parentSessionId: string,
  task: string,
  options: SubagentOptions = {}
): Promise<SubagentStatus> {
  const startTime = Date.now()

  // Create subagent record
  const subagent = await db.hermesSubagent.create({
    data: {
      parentSessionId,
      userId,
      task,
      status: 'running',
      model: options.model || null,
      provider: options.provider || null,
    },
  })

  // Run the subagent asynchronously
  runSubagentTask(subagent.id, task, options, startTime).catch(() => {
    // Error is handled inside runSubagentTask
  })

  return toSubagentStatus(subagent)
}

/** Internal: Run a subagent's task */
async function runSubagentTask(
  subagentId: string,
  task: string,
  options: SubagentOptions,
  startTime: number
): Promise<void> {
  try {
    const zai = await ZAI.create()
    const timeoutMs = options.timeoutMs || 60000

    const systemPrompt = options.systemPrompt ||
      'You are a subagent of Hermes AI. Complete the assigned task efficiently. Return a clear, structured result.'

    const response = await zai.chat.completions.create({
      model: options.model || 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task },
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: 0.4,
    })

    const result = response.choices?.[0]?.message?.content || 'No result generated'
    const tokensUsed = response.usage?.total_tokens || 0
    const durationMs = Date.now() - startTime

    await db.hermesSubagent.update({
      where: { id: subagentId },
      data: {
        status: 'completed',
        result,
        tokensUsed,
        completedAt: new Date(),
        durationMs,
      },
    })
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    await db.hermesSubagent.update({
      where: { id: subagentId },
      data: {
        status: 'failed',
        result: `Error: ${error?.message || 'Subagent task failed'}`,
        completedAt: new Date(),
        durationMs,
      },
    })
  }
}

// ── Status ──────────────────────────────────────────────────

/** Get the status of a subagent */
export async function getSubagentStatus(subagentId: string): Promise<SubagentStatus | null> {
  const subagent = await db.hermesSubagent.findUnique({
    where: { id: subagentId },
  })

  return subagent ? toSubagentStatus(subagent) : null
}

// ── List ────────────────────────────────────────────────────

/** List user's subagents with optional filters */
export async function listSubagents(userId: string, filters?: SubagentListFilters): Promise<SubagentStatus[]> {
  const where: Record<string, unknown> = { userId }

  if (filters?.status) where.status = filters.status
  if (filters?.parentSessionId) where.parentSessionId = filters.parentSessionId

  const subagents = await db.hermesSubagent.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: filters?.limit || 20,
  })

  return subagents.map(toSubagentStatus)
}

// ── Cancel ──────────────────────────────────────────────────

/** Cancel a running subagent */
export async function cancelSubagent(subagentId: string): Promise<void> {
  const subagent = await db.hermesSubagent.findUnique({
    where: { id: subagentId },
  })

  if (!subagent) throw new Error('Subagent not found')
  if (subagent.status !== 'running') throw new Error(`Cannot cancel subagent in "${subagent.status}" state`)

  await db.hermesSubagent.update({
    where: { id: subagentId },
    data: {
      status: 'cancelled',
      result: 'Cancelled by user',
      completedAt: new Date(),
      durationMs: Date.now() - subagent.startedAt.getTime(),
    },
  })
}

// ── Helpers ─────────────────────────────────────────────────

function toSubagentStatus(s: {
  id: string
  parentSessionId: string
  userId: string
  task: string
  status: string
  result: string | null
  model: string | null
  provider: string | null
  tokensUsed: number
  startedAt: Date
  completedAt: Date | null
  durationMs: number | null
}): SubagentStatus {
  return {
    id: s.id,
    parentSessionId: s.parentSessionId,
    userId: s.userId,
    task: s.task,
    status: s.status as SubagentStatus['status'],
    result: s.result,
    model: s.model,
    provider: s.provider,
    tokensUsed: s.tokensUsed,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    durationMs: s.durationMs,
  }
}
