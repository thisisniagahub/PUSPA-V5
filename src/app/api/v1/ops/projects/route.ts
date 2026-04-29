import { NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

// ─── GET: List all projects with counts ───────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireRole(request, ['developer']);
    // Get distinct project values
    const projectGroups = await db.workItem.groupBy({
      by: ['project'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // For each project, get completed/blocked counts and last activity
    const projects = await Promise.all(
      projectGroups.map(async (group) => {
        const [completedCount, blockedCount, lastActivityItem] = await Promise.all([
          db.workItem.count({
            where: { project: group.project, status: 'completed' },
          }),
          db.workItem.count({
            where: { project: group.project, status: 'blocked' },
          }),
          db.workItem.findFirst({
            where: { project: group.project },
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
          }),
        ]);

        return {
          name: group.project,
          workItemCount: group._count.id,
          completedCount,
          blockedCount,
          lastActivity: lastActivityItem?.updatedAt?.toISOString() || null,
        };
      })
    );

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
