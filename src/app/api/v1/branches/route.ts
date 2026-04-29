import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthorizationError } from '@/lib/auth';
import { writeAuditLog, getRequestIp } from '@/lib/audit';
import { db } from '@/lib/db';
import { z } from 'zod';

const branchCreateSchema = z.object({
  name: z.string().min(1, 'Nama cawangan diperlukan'),
  code: z.string().min(1, 'Kod cawangan diperlukan').max(10, 'Kod maksimum 10 aksara'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format emel tidak sah').optional().or(z.literal('')),
  headName: z.string().optional(),
  headPhone: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const branchUpdateSchema = branchCreateSchema.partial().extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer']);
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';

    const where: Record<string, unknown> = {};

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    const branches = await db.branch.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const total = branches.length;
    const activeCount = branches.filter((b) => b.isActive).length;
    const inactiveCount = total - activeCount;

    // Group by state
    const stateGroups: Record<string, number> = {};
    for (const b of branches) {
      if (b.state) {
        stateGroups[b.state] = (stateGroups[b.state] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        branches,
        total,
        activeCount,
        inactiveCount,
        stateGroups,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer']);
    const body = await request.json();
    const validated = branchCreateSchema.parse(body);

    // Check for duplicate code
    const existingCode = await db.branch.findUnique({
      where: { code: validated.code },
    });
    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'Kod cawangan sudah wujud' },
        { status: 409 }
      );
    }

    const branch = await db.branch.create({
      data: {
        ...validated,
        email: validated.email || null,
      },
    });

    await writeAuditLog({
      action: 'create',
      entity: 'Branch',
      entityId: branch.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: { code: branch.code, isActive: branch.isActive },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        title: 'Cawangan baharu dicipta',
        message: `Cawangan "${branch.name}" berjaya ditambah.`,
        type: 'success',
        link: '/reports',
      },
    });

    return NextResponse.json({ success: true, data: branch }, { status: 201 });
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
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer']);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Branch id is required' },
        { status: 400 }
      );
    }

    const validated = branchUpdateSchema.parse({ id, ...updateData });

    const existing = await db.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cawangan tidak dijumpai' },
        { status: 404 }
      );
    }

    // Check for duplicate code if code is being updated
    if (validated.code && validated.code !== existing.code) {
      const duplicateCode = await db.branch.findUnique({
        where: { code: validated.code },
      });
      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: 'Kod cawangan sudah wujud' },
          { status: 409 }
        );
      }
    }

    const branch = await db.branch.update({
      where: { id },
      data: {
        ...validated,
        email: validated.email === '' ? null : (validated.email || undefined),
      },
    });

    await writeAuditLog({
      action: 'update',
      entity: 'Branch',
      entityId: branch.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: { code: branch.code, isActive: branch.isActive },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        title: 'Maklumat cawangan dikemas kini',
        message: `Perubahan untuk cawangan "${branch.name}" telah disimpan.`,
        type: 'info',
        link: '/reports',
      },
    });

    return NextResponse.json({ success: true, data: branch });
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
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer']);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Branch id is required' },
        { status: 400 }
      );
    }

    const existing = await db.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cawangan tidak dijumpai' },
        { status: 404 }
      );
    }

    // Soft delete — deactivate instead of hard delete
    const branch = await db.branch.update({
      where: { id },
      data: { isActive: false },
    });

    await writeAuditLog({
      action: 'update',
      entity: 'Branch',
      entityId: branch.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: { code: branch.code, isActive: false },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        title: 'Cawangan dinyahaktifkan',
        message: `Cawangan "${branch.name}" telah dinyahaktifkan.`,
        type: 'warning',
        link: '/reports',
      },
    });

    return NextResponse.json({
      success: true,
      data: branch,
      message: 'Cawangan telah dinyahaktifkan',
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deactivating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate branch' },
      { status: 500 }
    );
  }
}
