import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get curator status (last run, skill counts, LRU top 5)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    // Get last curator run
    const lastRun = await db.hermesCuratorRun.findFirst({
      orderBy: { startedAt: 'desc' },
    })

    // Get skill counts by status
    const [activeCount, staleCount, archivedCount, pinnedCount, totalCount] = await Promise.all([
      db.hermesSkill.count({ where: { status: 'active', isActive: true } }),
      db.hermesSkill.count({ where: { status: 'stale' } }),
      db.hermesSkill.count({ where: { status: 'archived' } }),
      db.hermesSkill.count({ where: { pinnedAt: { not: null } } }),
      db.hermesSkill.count(),
    ])

    // LRU top 5 — least recently used skills
    const lruTop5 = await db.hermesSkill.findMany({
      where: { isActive: true, lastUsedAt: { not: null } },
      orderBy: { lastUsedAt: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        lastUsedAt: true,
        usageCount: true,
        successRate: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        lastRun,
        skillCounts: {
          active: activeCount,
          stale: staleCount,
          archived: archivedCount,
          pinned: pinnedCount,
          total: totalCount,
        },
        lruTop5,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Trigger curator run (with dryRun option in body)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()
    const dryRun = body.dryRun === true

    // Check if there's already a running curator
    const runningJob = await db.hermesCuratorRun.findFirst({
      where: { status: 'running' },
    })

    if (runningJob) {
      return NextResponse.json(
        { success: false, error: 'Curator is already running' },
        { status: 409 },
      )
    }

    // Create a new curator run
    const curatorRun = await db.hermesCuratorRun.create({
      data: {
        status: dryRun ? 'completed' : 'running',
        skillsReviewed: 0,
        skillsStaled: 0,
        skillsArchived: 0,
        skillsPatched: 0,
        skillsConsolidated: 0,
        summary: dryRun ? 'Dry run — no changes applied' : null,
        ...(dryRun ? { completedAt: new Date(), durationMs: 0 } : {}),
      },
    })

    if (!dryRun) {
      // Perform curator logic — review all active skills
      const activeSkills = await db.hermesSkill.findMany({
        where: { isActive: true, status: 'active' },
      })

      let skillsStaled = 0
      let skillsArchived = 0
      let skillsPatched = 0

      const now = new Date()
      const staleThreshold = 30 * 24 * 60 * 60 * 1000 // 30 days
      const archiveThreshold = 90 * 24 * 60 * 60 * 1000 // 90 days

      for (const skill of activeSkills) {
        // Skip pinned skills — they are curator-proof
        if (skill.pinnedAt) continue

        const lastUsed = skill.lastUsedAt ? new Date(skill.lastUsedAt).getTime() : 0
        const timeSinceUse = now.getTime() - lastUsed

        if (timeSinceUse > archiveThreshold && skill.usageCount < 3) {
          // Archive very old, barely used skills
          await db.hermesSkill.update({
            where: { id: skill.id },
            data: { status: 'archived', isActive: false },
          })
          skillsArchived++
        } else if (timeSinceUse > staleThreshold) {
          // Mark as stale
          await db.hermesSkill.update({
            where: { id: skill.id },
            data: { status: 'stale' },
          })
          skillsStaled++
        } else if (skill.successRate < 0.3 && skill.usageCount > 5) {
          // Patch low-success skills
          await db.hermesSkill.update({
            where: { id: skill.id },
            data: { status: 'stale' },
          })
          skillsPatched++
        }
      }

      const completedAt = new Date()
      const durationMs = completedAt.getTime() - curatorRun.startedAt.getTime()

      await db.hermesCuratorRun.update({
        where: { id: curatorRun.id },
        data: {
          status: 'completed',
          skillsReviewed: activeSkills.length,
          skillsStaled,
          skillsArchived,
          skillsPatched,
          completedAt,
          durationMs,
          summary: `Reviewed ${activeSkills.length} skills: ${skillsStaled} staled, ${skillsArchived} archived, ${skillsPatched} flagged for patching`,
        },
      })
    }

    // Fetch updated run
    const updatedRun = await db.hermesCuratorRun.findUnique({
      where: { id: curatorRun.id },
    })

    return NextResponse.json({ success: true, data: updatedRun })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
