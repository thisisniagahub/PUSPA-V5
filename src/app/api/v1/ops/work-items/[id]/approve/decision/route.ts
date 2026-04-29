import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const approvalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'revise']),
  comment: z.string().optional(),
});

// ─── POST: Process approval decision ──────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['developer']);
    const { id } = await params;
    const body = await request.json();
    const validated = approvalDecisionSchema.parse(body);

    // Verify work item exists
    const workItem = await db.workItem.findUnique({ where: { id } });
    if (!workItem) {
      return NextResponse.json(
        { success: false, error: 'Work item not found' },
        { status: 404 }
      );
    }

    // Build update and event data based on decision
    let newStatus: string;
    let eventType: string;
    let eventSummary: string;

    switch (validated.decision) {
      case 'approve':
        newStatus = 'in_progress';
        eventType = 'approval_approved';
        eventSummary = 'Approval granted — work item resumed';
        break;
      case 'reject':
        newStatus = 'failed';
        eventType = 'approval_rejected';
        eventSummary = 'Approval rejected';
        break;
      case 'revise':
        newStatus = 'queued';
        eventType = 'approval_revise';
        eventSummary = 'Revision requested — work item sent back to queue';
        break;
    }

    // Create the corresponding execution event
    await db.executionEvent.create({
      data: {
        workItemId: id,
        type: eventType,
        summary: eventSummary,
        detail: validated.comment
          ? JSON.stringify({ decision: validated.decision, comment: validated.comment })
          : JSON.stringify({ decision: validated.decision }),
        status: 'success',
      },
    });

    // Update work item status
    const dataToUpdate: Record<string, unknown> = {
      status: newStatus,
      nextAction: null,
    };

    if (validated.decision === 'reject') {
      dataToUpdate.blockerReason = validated.comment || 'Approval rejected';
    }

    // Auto-set startedAt when approving (moving to in_progress)
    if (validated.decision === 'approve' && !workItem.startedAt) {
      dataToUpdate.startedAt = new Date();
    }

    const updated = await db.workItem.update({
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
    console.error('Error processing approval decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval decision' },
      { status: 500 }
    );
  }
}
