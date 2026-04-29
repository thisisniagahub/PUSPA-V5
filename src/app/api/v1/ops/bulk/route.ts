import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const bulkUpdateSchema = z.object({
  action: z.enum(['complete', 'archive', 'cancel']),
  workItemIds: z.array(z.string()).min(1, 'At least one work item ID is required'),
});

// ─── POST: Bulk update work items ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    const { action, workItemIds } = validated;

    // Build the update data based on action
    const dataToUpdate: Record<string, unknown> = {};

    switch (action) {
      case 'complete':
        dataToUpdate.status = 'completed';
        dataToUpdate.completedAt = new Date();
        break;
      case 'archive':
        dataToUpdate.status = 'archived';
        break;
      case 'cancel':
        dataToUpdate.status = 'failed';
        dataToUpdate.blockerReason = 'Bulk cancelled';
        break;
    }

    const result = await db.workItem.updateMany({
      where: { id: { in: workItemIds } },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
    });
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
    console.error('Error performing bulk update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk update' },
      { status: 500 }
    );
  }
}
