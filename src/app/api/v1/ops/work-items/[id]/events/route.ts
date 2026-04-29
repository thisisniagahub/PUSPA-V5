import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const executionEventCreateSchema = z.object({
  type: z.string().min(1, 'Event type is required'),
  summary: z.string().min(1, 'Summary is required'),
  detail: z.string().optional(),
  toolName: z.string().optional(),
  status: z.enum(['success', 'failed', 'pending', 'skipped']).optional().default('success'),
  latencyMs: z.number().int().nonnegative().optional(),
  errorCode: z.string().optional(),
});

// ─── GET: List execution events for a work item ───────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(_request, ['developer']);
    const { id } = await params;

    // Verify work item exists
    const workItem = await db.workItem.findUnique({ where: { id } });
    if (!workItem) {
      return NextResponse.json(
        { success: false, error: 'Work item not found' },
        { status: 404 }
      );
    }

    const events = await db.executionEvent.findMany({
      where: { workItemId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching execution events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch execution events' },
      { status: 500 }
    );
  }
}

// ─── POST: Create an execution event ──────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['developer']);
    const { id } = await params;
    const body = await request.json();
    const validated = executionEventCreateSchema.parse(body);

    // Verify work item exists
    const workItem = await db.workItem.findUnique({ where: { id } });
    if (!workItem) {
      return NextResponse.json(
        { success: false, error: 'Work item not found' },
        { status: 404 }
      );
    }

    const event = await db.executionEvent.create({
      data: {
        workItemId: id,
        type: validated.type,
        summary: validated.summary,
        detail: validated.detail,
        toolName: validated.toolName,
        status: validated.status,
        latencyMs: validated.latencyMs,
        errorCode: validated.errorCode,
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
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
    console.error('Error creating execution event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create execution event' },
      { status: 500 }
    );
  }
}
