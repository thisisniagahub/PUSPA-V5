import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const automationCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  kind: z.enum(['one_time', 'fixed_rate', 'cron']).optional().default('one_time'),
  expr: z.string().optional(),
  domain: z.string().optional().default('general'),
  relatedProject: z.string().optional().default('PUSPA'),
  workItemId: z.string().optional(),
});

// ─── GET: List automation jobs ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const searchParams = request.nextUrl.searchParams;
    const enabled = searchParams.get('enabled');

    const where: Record<string, unknown> = {};
    if (enabled !== null && enabled !== undefined && enabled !== '') {
      where.isEnabled = enabled === 'true';
    }

    const automations = await db.automationJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        workItem: {
          select: { id: true, workItemNumber: true, title: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: automations });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching automations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}

// ─── POST: Create automation job ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const validated = automationCreateSchema.parse(body);

    // Validate work item exists if provided
    if (validated.workItemId) {
      const workItem = await db.workItem.findUnique({
        where: { id: validated.workItemId },
      });
      if (!workItem) {
        return NextResponse.json(
          { success: false, error: 'Referenced work item not found' },
          { status: 400 }
        );
      }
    }

    const automation = await db.automationJob.create({
      data: {
        title: validated.title,
        description: validated.description,
        kind: validated.kind,
        expr: validated.expr,
        domain: validated.domain,
        relatedProject: validated.relatedProject,
        workItemId: validated.workItemId,
      },
      include: {
        workItem: {
          select: { id: true, workItemNumber: true, title: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: automation }, { status: 201 });
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
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}
