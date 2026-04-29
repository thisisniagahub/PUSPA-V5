import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const approvalRequestSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  reason: z.string().min(1, 'Reason is required'),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

// ─── POST: Create an approval request for a work item ─────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['developer']);
    const { id } = await params;
    const body = await request.json();
    const validated = approvalRequestSchema.parse(body);

    // Verify work item exists
    const workItem = await db.workItem.findUnique({ where: { id } });
    if (!workItem) {
      return NextResponse.json(
        { success: false, error: 'Work item not found' },
        { status: 404 }
      );
    }

    // Create approval_requested execution event
    await db.executionEvent.create({
      data: {
        workItemId: id,
        type: 'approval_requested',
        summary: `Approval requested: ${validated.action}`,
        detail: JSON.stringify({
          action: validated.action,
          reason: validated.reason,
          riskLevel: validated.riskLevel,
        }),
        status: 'success',
      },
    });

    // Update work item status to waiting_user
    const updated = await db.workItem.update({
      where: { id },
      data: {
        status: 'waiting_user',
        nextAction: `Pending approval for: ${validated.action}`,
      },
      include: {
        executionEvents: {
          orderBy: { createdAt: 'desc' },
        },
        artifacts: true,
        automationJobs: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
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
    console.error('Error creating approval request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create approval request' },
      { status: 500 }
    );
  }
}
