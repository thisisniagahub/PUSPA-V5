import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const workItemUpdateSchema = z.object({
  status: z.enum(['queued', 'in_progress', 'waiting_user', 'scheduled', 'blocked', 'completed', 'failed', 'archived']).optional(),
  currentStep: z.string().optional(),
  nextAction: z.string().optional(),
  blockerReason: z.string().optional(),
  resolutionSummary: z.string().optional(),
});

// ─── GET: Single work item with execution events ──────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(_request, ['developer']);
    const { id } = await params;

    const workItem = await db.workItem.findUnique({
      where: { id },
      include: {
        executionEvents: {
          orderBy: { createdAt: 'desc' },
        },
        artifacts: true,
        automationJobs: true,
      },
    });

    if (!workItem) {
      return NextResponse.json(
        { success: false, error: 'Work item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workItem });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching work item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work item' },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update work item ──────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['developer']);
    const { id } = await params;
    const body = await request.json();
    const validated = workItemUpdateSchema.parse(body);

    const existing = await db.workItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Work item not found' },
        { status: 404 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { ...validated };

    // Auto-set timestamps on status transitions
    if (validated.status === 'in_progress' && !existing.startedAt) {
      dataToUpdate.startedAt = new Date();
    }
    if (validated.status === 'completed' && !existing.completedAt) {
      dataToUpdate.completedAt = new Date();
    }
    // Clear blocker when unblocking
    if (validated.status && validated.status !== 'blocked') {
      dataToUpdate.blockerReason = null;
    }

    const workItem = await db.workItem.update({
      where: { id },
      data: dataToUpdate,
      include: {
        executionEvents: {
          orderBy: { createdAt: 'desc' },
        },
        artifacts: true,
        automationJobs: true,
      },
    });

    return NextResponse.json({ success: true, data: workItem });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating work item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update work item' },
      { status: 500 }
    );
  }
}
