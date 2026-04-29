import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  normalizeProgrammeCategory,
  normalizeProgrammeStatus,
} from '@/lib/domain';
import { z } from 'zod';

const programmeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  targetBeneficiaries: z.number().int().positive().optional(),
  actualBeneficiaries: z.number().int().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  totalSpent: z.number().nonnegative().optional().default(0),
  partners: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const category = normalizeProgrammeCategory(searchParams.get('category'));
    const status = normalizeProgrammeStatus(searchParams.get('status'));
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const programmes = await db.programme.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cases: { select: { id: true } },
        activities: { select: { id: true, title: true } },
        impactMetrics: { select: { id: true, metricName: true, selfReportedValue: true } },
        _count: {
          select: {
            cases: true,
            activities: true,
            impactMetrics: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: programmes });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching programmes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programmes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const validated = programmeCreateSchema.parse(body);
    const normalizedCategory = normalizeProgrammeCategory(validated.category) || 'community';
    const normalizedStatus = normalizeProgrammeStatus(validated.status) || 'planned';
    const { category: _category, status: _status, ...rest } = validated;

    if (validated.category && !normalizeProgrammeCategory(validated.category)) {
      return NextResponse.json(
        { success: false, error: 'Kategori program tidak sah' },
        { status: 400 }
      );
    }

    if (validated.status && !normalizeProgrammeStatus(validated.status)) {
      return NextResponse.json(
        { success: false, error: 'Status program tidak sah' },
        { status: 400 }
      );
    }

    const programme = await db.programme.create({
      data: {
        ...rest,
        category: normalizedCategory,
        status: normalizedStatus,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      } as any,
      include: {
        _count: {
          select: { cases: true, activities: true, impactMetrics: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: programme }, { status: 201 });
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
    console.error('Error creating programme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create programme' },
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
        { success: false, error: 'Programme id is required' },
        { status: 400 }
      );
    }

    const existing = await db.programme.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Programme not found' },
        { status: 404 }
      );
    }

    const partialSchema = programmeCreateSchema.partial();
    const validated = partialSchema.parse(updateData);
    const normalizedCategory =
      validated.category === undefined ? undefined : normalizeProgrammeCategory(validated.category);
    const normalizedStatus =
      validated.status === undefined ? undefined : normalizeProgrammeStatus(validated.status);
    const { category: _category, status: _status, ...rest } = validated;

    if (validated.category !== undefined && !normalizedCategory) {
      return NextResponse.json(
        { success: false, error: 'Kategori program tidak sah' },
        { status: 400 }
      );
    }

    if (validated.status !== undefined && !normalizedStatus) {
      return NextResponse.json(
        { success: false, error: 'Status program tidak sah' },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { ...rest };
    if (normalizedCategory) dataToUpdate.category = normalizedCategory;
    if (normalizedStatus) dataToUpdate.status = normalizedStatus;
    if (validated.startDate) dataToUpdate.startDate = new Date(validated.startDate);
    if (validated.endDate) dataToUpdate.endDate = new Date(validated.endDate);

    const programme = await db.programme.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: { cases: true, activities: true, impactMetrics: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: programme });
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
    console.error('Error updating programme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update programme' },
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
        { success: false, error: 'Programme id is required' },
        { status: 400 }
      );
    }

    const existing = await db.programme.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Programme not found' },
        { status: 404 }
      );
    }

    await db.programme.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Programme deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting programme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete programme' },
      { status: 500 }
    );
  }
}
