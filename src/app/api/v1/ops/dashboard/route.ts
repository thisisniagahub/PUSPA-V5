import { NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

// ─── GET: Aggregated ops dashboard summary ────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireRole(request, ['developer']);
    // Run all queries in parallel for performance
    const [
      workItemsByStatus,
      automationStats,
      recentEvents,
      domainSummary,
      upcomingAutomations,
    ] = await Promise.all([
      // 1. Count work items grouped by status
      db.workItem.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // 2. Automation counts (active + total)
      Promise.all([
        db.automationJob.count({ where: { isEnabled: true } }),
        db.automationJob.count(),
      ]),
      // 3. Recent execution events (last 20)
      db.executionEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          workItem: {
            select: { id: true, workItemNumber: true, title: true },
          },
        },
      }),
      // 4. Domain summary (count per domain)
      db.workItem.groupBy({
        by: ['domain'],
        _count: { domain: true },
        orderBy: { _count: { domain: 'desc' } },
      }),
      // 5. Upcoming automations (nextRunAt in future)
      db.automationJob.findMany({
        where: {
          isEnabled: true,
          nextRunAt: { gte: new Date() },
        },
        orderBy: { nextRunAt: 'asc' },
        take: 10,
      }),
    ]);

    // Build work items status map
    const statusCounts: Record<string, number> = {};
    for (const item of workItemsByStatus) {
      statusCounts[item.status] = item._count.status;
    }

    // Build domain summary map
    const domainCounts: Record<string, number> = {};
    for (const item of domainSummary) {
      domainCounts[item.domain] = item._count.domain;
    }

    const dashboard = {
      workItems: {
        byStatus: statusCounts,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      },
      automations: {
        active: automationStats[0],
        total: automationStats[1],
      },
      recentEvents,
      domainSummary: domainCounts,
      upcomingAutomations,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: dashboard });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching ops dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
