import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const activityCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['event', 'meeting', 'training', 'outreach', 'fundraiser', 'volunteer', 'audit', 'visit', 'other']).optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional().default('planned'),
  date: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  programmeId: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  notes: z.string().optional(),
  order: z.number().int().nonnegative().optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const activities = await db.activity.findMany({
      where,
      orderBy: [{ order: 'asc' }, { date: 'desc' }],
      include: {
        programme: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const validated = activityCreateSchema.parse(body);

    const activity = await db.activity.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        status: validated.status,
        date: validated.date ? new Date(validated.date) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        location: validated.location,
        programmeId: validated.programmeId,
        assignees: validated.assignees ? JSON.stringify(validated.assignees) : null,
        notes: validated.notes,
        order: validated.order,
      },
      include: {
        programme: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
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
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Activity id is required' },
        { status: 400 }
      );
    }

    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    const partialSchema = activityCreateSchema.partial();
    const validated = partialSchema.parse(updateData);

    const dataToUpdate: Record<string, unknown> = { ...validated };
    if (validated.date) dataToUpdate.date = new Date(validated.date);
    if (validated.endDate) dataToUpdate.endDate = new Date(validated.endDate);

    const activity = await db.activity.update({
      where: { id },
      data: dataToUpdate,
      include: {
        programme: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: activity });
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
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Activity id is required' },
        { status: 400 }
      );
    }

    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    await db.activity.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
