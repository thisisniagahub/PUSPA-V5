import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const artifactCreateSchema = z.object({
  workItemId: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  summary: z.string().optional(),
  pathOrRef: z.string().optional(),
  metadata: z.string().optional(),
});

// ─── GET: List artifacts ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '';
    const workItemId = searchParams.get('workItemId') || '';

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (workItemId) where.workItemId = workItemId;

    const artifacts = await db.artifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        workItem: {
          select: { id: true, workItemNumber: true, title: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: artifacts });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching artifacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch artifacts' },
      { status: 500 }
    );
  }
}

// ─── POST: Create artifact ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const validated = artifactCreateSchema.parse(body);

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

    const artifact = await db.artifact.create({
      data: {
        workItemId: validated.workItemId,
        type: validated.type,
        title: validated.title,
        summary: validated.summary,
        pathOrRef: validated.pathOrRef,
        metadata: validated.metadata,
      },
      include: {
        workItem: {
          select: { id: true, workItemNumber: true, title: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: artifact }, { status: 201 });
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
    console.error('Error creating artifact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create artifact' },
      { status: 500 }
    );
  }
}
