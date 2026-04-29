import { NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

// ─── GET: Comprehensive ops statistics ────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireRole(request, ['developer']);
    const now = new Date();

    // Start of today (midnight)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of this week (Monday)
    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel for performance
    const [
      totalWorkItems,
      completedToday,
      completedThisWeek,
      completedThisMonth,
      completedItems,
      failedCount,
      topDomains,
      topIntents,
      activeAutomations,
      recentActivity,
    ] = await Promise.all([
      // Total work items
      db.workItem.count(),

      // Completed today
      db.workItem.count({
        where: {
          status: 'completed',
          completedAt: { gte: startOfToday },
        },
      }),

      // Completed this week
      db.workItem.count({
        where: {
          status: 'completed',
          completedAt: { gte: startOfWeek },
        },
      }),

      // Completed this month
      db.workItem.count({
        where: {
          status: 'completed',
          completedAt: { gte: startOfMonth },
        },
      }),

      // Completed items with timestamps (for avg resolution time)
      db.workItem.findMany({
        where: {
          status: 'completed',
          completedAt: { not: null },
        },
        select: { createdAt: true, completedAt: true },
      }),

      // Failed count (for failure rate)
      db.workItem.count({ where: { status: 'failed' } }),

      // Top domains
      db.workItem.groupBy({
        by: ['domain'],
        _count: { domain: true },
        orderBy: { _count: { domain: 'desc' } },
        take: 10,
      }),

      // Top intents
      db.workItem.groupBy({
        by: ['intent'],
        _count: { intent: true },
        orderBy: { _count: { intent: 'desc' } },
        take: 10,
      }),

      // Active automations count
      db.automationJob.count({ where: { isEnabled: true } }),

      // Recent activity (last 10 execution events across all work items)
      db.executionEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          workItem: {
            select: { id: true, workItemNumber: true, title: true },
          },
        },
      }),
    ]);

    // Calculate average resolution time
    let avgResolutionTime = 0;
    if (completedItems.length > 0) {
      const totalMs = completedItems.reduce((sum, item) => {
        if (item.createdAt && item.completedAt) {
          return sum + (item.completedAt.getTime() - item.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = Math.round(totalMs / completedItems.length);
    }

    // Failure rate
    const failureRate = totalWorkItems > 0
      ? Math.round((failedCount / totalWorkItems) * 100 * 100) / 100
      : 0;

    const stats = {
      totalWorkItems,
      completedToday,
      completedThisWeek,
      completedThisMonth,
      avgResolutionTime,
      topDomains: topDomains.map((d) => ({ domain: d.domain, count: d._count.domain })),
      topIntents: topIntents.map((i) => ({ intent: i.intent, count: i._count.intent })),
      failureRate,
      activeAutomations,
      recentActivity,
      generatedAt: now.toISOString(),
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching ops stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ops statistics' },
      { status: 500 }
    );
  }
}
