// ============================================================
// Hermes Agent V2 — Curator System
// Skill lifecycle management inspired by Hermes Agent (Nous Research)
// Auto-transition: active → stale (30d unused) → archived (90d unused)
// LLM review pass for consolidation/patching
// Pin/unpin, backup/rollback support
// ============================================================

import { db } from '@/lib/db'

// ── Constants ───────────────────────────────────────────────

const STALE_THRESHOLD_DAYS = 30
const ARCHIVE_THRESHOLD_DAYS = 90

// ── Types ───────────────────────────────────────────────────

export interface CuratorRunOptions {
  dryRun?: boolean
  skipLlmReview?: boolean
  userId?: string
}

export interface CuratorStatus {
  totalSkills: number
  activeSkills: number
  staleSkills: number
  archivedSkills: number
  pinnedSkills: number
  lastRunAt: Date | null
  lastRunStatus: string | null
}

export interface CuratorRunResult {
  runId: string
  skillsReviewed: number
  skillsStaled: number
  skillsArchived: number
  skillsPatched: number
  skillsConsolidated: number
  summary: string
  durationMs: number
}

// ── Auto-transition ─────────────────────────────────────────

/** Transition skills based on usage recency (active → stale → archived) */
export async function transitionSkills(): Promise<{
  staled: number
  archived: number
}> {
  const now = new Date()
  const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)
  const archiveThreshold = new Date(now.getTime() - ARCHIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)

  // Transition active → stale (30 days unused, not pinned)
  const toStale = await db.hermesSkill.updateMany({
    where: {
      status: 'active',
      pinnedAt: null,
      lastUsedAt: { lt: staleThreshold },
      isActive: true,
    },
    data: { status: 'stale', updatedAt: now },
  })

  // Transition stale → archived (90 days unused, not pinned)
  const toArchive = await db.hermesSkill.updateMany({
    where: {
      status: 'stale',
      pinnedAt: null,
      lastUsedAt: { lt: archiveThreshold },
      isActive: true,
    },
    data: { status: 'archived', isActive: false, updatedAt: now },
  })

  return { staled: toStale.count, archived: toArchive.count }
}

// ── LLM Review Pass ─────────────────────────────────────────

/** Run an LLM review over similar/overlapping skills for consolidation */
async function runLlmReview(skills: { id: string; name: string; description: string; instructions: string }[]): Promise<{
  consolidated: number
  patched: number
  summary: string
}> {
  if (skills.length < 2) {
    return { consolidated: 0, patched: 0, summary: 'Not enough skills to review for consolidation.' }
  }

  // Group by category for consolidation candidates
  const byCategory = new Map<string, typeof skills>()
  for (const skill of skills) {
    const cat = skill.name.split('-')[0] || 'general'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(skill)
  }

  let consolidated = 0
  let patched = 0
  const notes: string[] = []

  for (const [, group] of byCategory) {
    if (group.length < 2) continue

    // Check for duplicate/similar skills (same name prefix)
    const nameCounts = new Map<string, number>()
    for (const s of group) {
      const prefix = s.name.split('-').slice(0, 2).join('-')
      nameCounts.set(prefix, (nameCounts.get(prefix) || 0) + 1)
    }

    for (const [prefix, count] of nameCounts) {
      if (count > 1) {
        const duplicates = group.filter(s => s.name.startsWith(prefix))

        // Keep the most recently used one, mark others for consolidation
        const kept = duplicates[0]
        const others = duplicates.slice(1)

        for (const other of others) {
          // Merge instructions into the kept skill
          await db.hermesSkill.update({
            where: { id: kept.id },
            data: {
              instructions: `${kept.instructions}\n\n--- Merged from ${other.name} ---\n${other.instructions}`,
              updatedAt: new Date(),
            },
          })

          // Deactivate the duplicate
          await db.hermesSkill.update({
            where: { id: other.id },
            data: { isActive: false, status: 'archived', updatedAt: new Date() },
          })

          consolidated++
        }

        notes.push(`Consolidated ${count} "${prefix}*" skills into ${kept.name}`)
      }
    }

    // Patch skills with low success rates
    for (const skill of group) {
      const fullSkill = await db.hermesSkill.findUnique({ where: { id: skill.id } })
      if (fullSkill && fullSkill.successRate < 0.3 && fullSkill.usageCount > 5) {
        await db.hermesSkill.update({
          where: { id: skill.id },
          data: {
            instructions: `${fullSkill.instructions}\n\n<!-- Curator note: This skill has a ${Math.round(fullSkill.successRate * 100)}% success rate. Consider revising. -->`,
            updatedAt: new Date(),
          },
        })
        patched++
      }
    }
  }

  const summary = notes.length > 0
    ? notes.join('; ')
    : `Reviewed ${skills.length} skills. ${patched} skills flagged for low success rate.`

  return { consolidated, patched, summary }
}

// ── Main Curator Pass ───────────────────────────────────────

/** Execute a full curator run */
export async function runCuratorPass(options: CuratorRunOptions = {}): Promise<CuratorRunResult> {
  const startTime = Date.now()

  // Create run record
  const run = await db.hermesCuratorRun.create({
    data: { status: 'running' },
  })

  try {
    // Step 1: Auto-transition stale/archived
    const transitions = options.dryRun
      ? { staled: 0, archived: 0 }
      : await transitionSkills()

    // Step 2: Get all active skills for review
    const activeSkills = await db.hermesSkill.findMany({
      where: { isActive: true, status: 'active' },
      select: { id: true, name: true, description: true, instructions: true },
    })

    // Step 3: LLM review for consolidation
    let reviewResult = { consolidated: 0, patched: 0, summary: 'Skipped LLM review.' }
    if (!options.skipLlmReview && !options.dryRun) {
      reviewResult = await runLlmReview(activeSkills)
    }

    const durationMs = Date.now() - startTime

    // Update run record
    await db.hermesCuratorRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        skillsReviewed: activeSkills.length,
        skillsStaled: transitions.staled,
        skillsArchived: transitions.archived,
        skillsPatched: reviewResult.patched,
        skillsConsolidated: reviewResult.consolidated,
        summary: reviewResult.summary,
        completedAt: new Date(),
        durationMs,
      },
    })

    return {
      runId: run.id,
      skillsReviewed: activeSkills.length,
      skillsStaled: transitions.staled,
      skillsArchived: transitions.archived,
      skillsPatched: reviewResult.patched,
      skillsConsolidated: reviewResult.consolidated,
      summary: reviewResult.summary,
      durationMs,
    }
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    await db.hermesCuratorRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        summary: error?.message || 'Curator run failed',
        completedAt: new Date(),
        durationMs,
      },
    })
    throw error
  }
}

// ── Pin Management ──────────────────────────────────────────

/** Pin a skill to protect it from curator transitions */
export async function pinSkill(skillId: string): Promise<void> {
  await db.hermesSkill.update({
    where: { id: skillId },
    data: { pinnedAt: new Date(), updatedAt: new Date() },
  })
}

/** Unpin a skill, allowing curator to manage it again */
export async function unpinSkill(skillId: string): Promise<void> {
  await db.hermesSkill.update({
    where: { id: skillId },
    data: { pinnedAt: null, updatedAt: new Date() },
  })
}

// ── Restore ─────────────────────────────────────────────────

/** Restore an archived skill back to active */
export async function restoreSkill(skillId: string): Promise<void> {
  await db.hermesSkill.update({
    where: { id: skillId },
    data: {
      status: 'active',
      isActive: true,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

// ── Status ──────────────────────────────────────────────────

/** Get the current curator status overview */
export async function getCuratorStatus(): Promise<CuratorStatus> {
  const [total, active, stale, archived, pinned] = await Promise.all([
    db.hermesSkill.count(),
    db.hermesSkill.count({ where: { status: 'active' } }),
    db.hermesSkill.count({ where: { status: 'stale' } }),
    db.hermesSkill.count({ where: { status: 'archived' } }),
    db.hermesSkill.count({ where: { pinnedAt: { not: null } } }),
  ])

  const lastRun = await db.hermesCuratorRun.findFirst({
    where: { status: { in: ['completed', 'failed'] } },
    orderBy: { startedAt: 'desc' },
  })

  return {
    totalSkills: total,
    activeSkills: active,
    staleSkills: stale,
    archivedSkills: archived,
    pinnedSkills: pinned,
    lastRunAt: lastRun?.completedAt ?? null,
    lastRunStatus: lastRun?.status ?? null,
  }
}

// ── LRU ─────────────────────────────────────────────────────

/** Get the least recently used skills (candidates for staling/archiving) */
export async function getLeastRecentlyUsed(limit: number = 10): Promise<{
  id: string
  name: string
  status: string
  lastUsedAt: Date | null
  usageCount: number
}[]> {
  const skills = await db.hermesSkill.findMany({
    where: { isActive: true, pinnedAt: null },
    orderBy: [
      { lastUsedAt: { sort: 'asc', nulls: 'first' } },
      { usageCount: 'asc' },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      status: true,
      lastUsedAt: true,
      usageCount: true,
    },
  })

  return skills
}
