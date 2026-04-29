import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const automationUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  kind: z.enum(['one_time', 'fixed_rate', 'cron']).optional(),
  expr: z.string().optional(),
  domain: z.string().optional(),
  relatedProject: z.string().optional(),
  isEnabled: z.boolean().optional(),
  lastResult: z.string().optional(),
  workItemId: z.string().nullable().optional(),
});

// ─── PATCH: Update automation ─────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['developer']);
    const { id } = await params;
    const body = await request.json();
    const validated = automationUpdateSchema.parse(body);

    const existing = await db.automationJob.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { ...validated };

    const automation = await db.automationJob.update({
      where: { id },
      data: dataToUpdate,
      include: {
        workItem: {
          select: { id: true, workItemNumber: true, title: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: automation });
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
    console.error('Error updating automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete automation ────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(_request, ['developer']);
    const { id } = await params;

    const existing = await db.automationJob.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    await db.automationJob.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Automation deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
}
