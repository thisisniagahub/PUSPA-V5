// ============================================================
// Hermes Agent V2 — Cron Scheduler
// Scheduled automations from the agent
// Supports cron expressions, one-time, and interval schedules
// ============================================================

import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// ── Types ───────────────────────────────────────────────────

export type CronJobKind = 'cron' | 'interval' | 'one_time'

export interface CronJobConfig {
  name: string
  schedule: string
  kind: CronJobKind
  task: string
  tz?: string
  enabled?: boolean
}

export interface CronJobUpdate {
  name?: string
  schedule?: string
  task?: string
  enabled?: boolean
}

export interface CronJobEntry {
  id: string
  userId: string
  name: string
  schedule: string
  kind: string
  task: string
  tz: string
  isEnabled: boolean
  platform: string | null
  sessionId: string | null
  lastRunAt: Date | null
  nextRunAt: Date | null
  lastResult: string | null
  failureState: string | null
  runCount: number
  createdAt: Date
  updatedAt: Date
}

// ── Create ──────────────────────────────────────────────────

/** Create a new cron job */
export async function createCronJob(userId: string, config: CronJobConfig): Promise<CronJobEntry> {
  const tz = config.tz || 'Asia/Kuala_Lumpur'
  const nextRun = calculateNextRun(config.schedule, tz, config.kind)

  const job = await db.hermesCronJob.create({
    data: {
      userId,
      name: config.name,
      schedule: config.schedule,
      kind: config.kind as string,
      task: config.task,
      tz,
      isEnabled: config.enabled !== false,
      nextRunAt: nextRun,
    },
  })

  return toCronJobEntry(job)
}

// ── Update ──────────────────────────────────────────────────

/** Update an existing cron job */
export async function updateCronJob(jobId: string, updates: CronJobUpdate): Promise<CronJobEntry> {
  const existing = await db.hermesCronJob.findUnique({ where: { id: jobId } })
  if (!existing) throw new Error('Cron job not found')

  const data: Record<string, unknown> = {
    ...updates,
    ...(updates.enabled !== undefined ? { isEnabled: updates.enabled } : {}),
    updatedAt: new Date(),
  }
  delete data.enabled

  // Recalculate next run if schedule changed
  if (updates.schedule) {
    data.nextRunAt = calculateNextRun(updates.schedule, existing.tz, existing.kind as CronJobKind)
  }

  const job = await db.hermesCronJob.update({
    where: { id: jobId },
    data,
  })

  return toCronJobEntry(job)
}

// ── Delete ──────────────────────────────────────────────────

/** Delete a cron job */
export async function deleteCronJob(jobId: string): Promise<void> {
  await db.hermesCronJob.delete({ where: { id: jobId } })
}

// ── List ────────────────────────────────────────────────────

/** List all cron jobs for a user */
export async function listCronJobs(userId: string): Promise<CronJobEntry[]> {
  const jobs = await db.hermesCronJob.findMany({
    where: { userId },
    orderBy: { nextRunAt: 'asc' },
  })

  return jobs.map(toCronJobEntry)
}

// ── Execute ─────────────────────────────────────────────────

/** Execute a cron job immediately */
export async function executeCronJob(jobId: string): Promise<{
  success: boolean
  result: string
  tokensUsed: number
}> {
  const job = await db.hermesCronJob.findUnique({ where: { id: jobId } })
  if (!job) throw new Error('Cron job not found')

  const startTime = Date.now()

  try {
    // Execute the task using Z-AI
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: 'You are an automated task executor for PUSPA Hermes. Execute the scheduled task and return a concise result.',
        },
        { role: 'user', content: job.task },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    })

    const result = response.choices?.[0]?.message?.content || 'Task completed with no output'
    const tokensUsed = response.usage?.total_tokens || 0

    // Update job record
    const now = new Date()
    const nextRun = job.kind !== 'one_time'
      ? calculateNextRun(job.schedule, job.tz, job.kind as CronJobKind)
      : null

    await db.hermesCronJob.update({
      where: { id: jobId },
      data: {
        lastRunAt: now,
        nextRunAt: nextRun,
        lastResult: result.slice(0, 500),
        isEnabled: job.kind === 'one_time' ? false : job.isEnabled,
      },
    })

    return { success: true, result, tokensUsed }
  } catch (error: any) {
    const now = new Date()
    const nextRun = job.kind !== 'one_time'
      ? calculateNextRun(job.schedule, job.tz, job.kind as CronJobKind)
      : null

    await db.hermesCronJob.update({
      where: { id: jobId },
      data: {
        lastRunAt: now,
        nextRunAt: nextRun,
        lastResult: `Error: ${error?.message || 'Execution failed'}`.slice(0, 500),
      },
    })

    return {
      success: false,
      result: error?.message || 'Execution failed',
      tokensUsed: 0,
    }
  }
}

// ── Next Run Calculator ─────────────────────────────────────

/**
 * Calculate the next run time based on schedule type.
 *
 * For cron expressions: Parse and compute next occurrence
 * For intervals: Add interval to current time
 * For one_time: Return the specified date/time
 */
export function calculateNextRun(
  schedule: string,
  tz: string = 'Asia/Kuala_Lumpur',
  kind: CronJobKind = 'cron'
): Date | null {
  const now = new Date()

  if (kind === 'one_time') {
    // Try parsing as ISO date
    const parsed = new Date(schedule)
    if (!isNaN(parsed.getTime())) return parsed
    return null
  }

  if (kind === 'interval') {
    // Parse interval like "30m", "1h", "2h", "1d", "7d"
    const intervalMatch = schedule.match(/^(\d+)(m|h|d|w)$/)
    if (intervalMatch) {
      const amount = parseInt(intervalMatch[1])
      const unit = intervalMatch[2]
      const multipliers: Record<string, number> = { m: 60000, h: 3600000, d: 86400000, w: 604800000 }
      return new Date(now.getTime() + amount * (multipliers[unit] || 3600000))
    }
    // Fallback: 1 hour
    return new Date(now.getTime() + 3600000)
  }

  // Cron expression parsing (simplified — 5-field cron)
  if (kind === 'cron') {
    return parseCronExpression(schedule, now)
  }

  return null
}

/** Simple 5-field cron parser (minute hour day month weekday) */
function parseCronExpression(expr: string, from: Date): Date {
  const fields = expr.trim().split(/\s+/)
  if (fields.length !== 5) {
    // Default: every hour
    return new Date(from.getTime() + 3600000)
  }

  // Start from the next minute
  const next = new Date(from.getTime() + 60000)
  next.setSeconds(0, 0)

  // Simple approach: try the next 1000 minutes to find a match
  for (let i = 0; i < 1000; i++) {
    const candidate = new Date(next.getTime() + i * 60000)
    if (matchesCronField(fields[0], candidate.getMinutes()) &&
        matchesCronField(fields[1], candidate.getHours()) &&
        matchesCronField(fields[2], candidate.getDate()) &&
        matchesCronField(fields[3], candidate.getMonth() + 1) &&
        matchesCronField(fields[4], candidate.getDay())) {
      return candidate
    }
  }

  // Fallback: 1 hour from now
  return new Date(from.getTime() + 3600000)
}

/** Check if a value matches a cron field */
function matchesCronField(field: string, value: number): boolean {
  if (field === '*') return true

  // Handle step: */5
  const stepMatch = field.match(/^\*\/(\d+)$/)
  if (stepMatch) {
    const step = parseInt(stepMatch[1])
    return value % step === 0
  }

  // Handle range: 1-5
  const rangeMatch = field.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1])
    const max = parseInt(rangeMatch[2])
    return value >= min && value <= max
  }

  // Handle list: 1,3,5
  if (field.includes(',')) {
    const values = field.split(',').map(v => parseInt(v.trim()))
    return values.includes(value)
  }

  // Handle exact value
  const num = parseInt(field)
  return !isNaN(num) && num === value
}

// ── Helpers ─────────────────────────────────────────────────

function toCronJobEntry(j: {
  id: string
  userId: string
  name: string
  schedule: string
  kind: string
  task: string
  tz: string
  platform: string | null
  sessionId: string | null
  isEnabled: boolean
  lastRunAt: Date | null
  nextRunAt: Date | null
  lastResult: string | null
  failureState: string | null
  runCount: number
  createdAt: Date
  updatedAt: Date
}): CronJobEntry {
  return {
    id: j.id,
    userId: j.userId,
    name: j.name,
    schedule: j.schedule,
    kind: j.kind,
    task: j.task,
    tz: j.tz,
    platform: j.platform,
    sessionId: j.sessionId,
    isEnabled: j.isEnabled,
    lastRunAt: j.lastRunAt,
    nextRunAt: j.nextRunAt,
    lastResult: j.lastResult,
    failureState: j.failureState,
    runCount: j.runCount,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  }
}
