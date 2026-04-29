import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { getRequestIp, writeAuditLog } from '@/lib/audit';
import { createWithGeneratedUniqueValue } from '@/lib/sequence';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const volunteerCreateSchema = z.object({
  name: z.string().min(1, 'Nama diperlukan'),
  ic: z.string().min(1, 'No. IC diperlukan'),
  phone: z.string().min(1, 'No. telefon diperlukan'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  occupation: z.string().optional(),
  skills: z.array(z.string()).optional(),
  availability: z.enum(['weekday', 'weekend', 'anytime']).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']).optional().default('active'),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function generateVolunteerNumber(): Promise<string> {
  const lastVolunteer = await db.volunteer.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { volunteerNumber: true },
  });
  let nextNum = 1;
  if (lastVolunteer?.volunteerNumber) {
    const match = lastVolunteer.volunteerNumber.match(/VOL-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `VOL-${String(nextNum).padStart(4, '0')}`;
}

// ─── GET — List volunteers with pagination, search, filter, sort ───────────

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { volunteerNumber: { contains: search, mode: 'insensitive' } },
        { ic: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const allowedSortFields = ['createdAt', 'name', 'volunteerNumber', 'status', 'totalHours', 'joinedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [volunteers, total] = await Promise.all([
      db.volunteer.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { deployments: true, hourLogs: true, certificates: true } },
        },
      }),
      db.volunteer.count({ where }),
    ]);

    // Aggregate stats
    const [totalVolunteers, activeThisMonth, totalHours, totalCertificates] = await Promise.all([
      db.volunteer.count(),
      db.volunteer.count({
        where: {
          status: 'active',
          joinedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      db.volunteerHourLog.aggregate({
        where: { status: 'approved' },
        _sum: { hours: true },
      }),
      db.volunteerCertificate.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: volunteers,
      total,
      page,
      pageSize,
      stats: {
        totalVolunteers,
        activeThisMonth,
        totalHours: totalHours._sum.hours || 0,
        totalCertificates,
      },
    });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volunteers' },
      { status: 500 }
    );
  }
}

// ─── POST — Create volunteer ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const validated = volunteerCreateSchema.parse(body);

    const volunteer = await createWithGeneratedUniqueValue({
      generateValue: generateVolunteerNumber,
      uniqueFields: ['volunteerNumber'],
      create: (volunteerNumber) =>
        db.volunteer.create({
          data: {
            ...validated,
            email: validated.email || null,
            volunteerNumber,
            joinedAt: new Date(),
            skills: validated.skills ? JSON.stringify(validated.skills) : null,
          },
          include: {
            _count: { select: { deployments: true, hourLogs: true, certificates: true } },
          },
        }),
    });

    await writeAuditLog({
      action: 'create',
      entity: 'Volunteer',
      entityId: volunteer.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerNumber: volunteer.volunteerNumber,
        status: volunteer.status,
      },
    });

    return NextResponse.json({ success: true, data: volunteer }, { status: 201 });
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
    console.error('Error creating volunteer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create volunteer' },
      { status: 500 }
    );
  }
}

// ─── PUT — Update volunteer ─────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Volunteer id is required' },
        { status: 400 }
      );
    }

    const volunteerUpdateSchema = volunteerCreateSchema.partial();
    const validated = volunteerUpdateSchema.parse(updateData);

    const existing = await db.volunteer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Volunteer not found' },
        { status: 404 }
      );
    }

    const volunteer = await db.volunteer.update({
      where: { id },
      data: {
        ...validated,
        email: validated.email === '' ? null : validated.email,
        skills: validated.skills ? JSON.stringify(validated.skills) : undefined,
      },
      include: {
        _count: { select: { deployments: true, hourLogs: true, certificates: true } },
      },
    });

    await writeAuditLog({
      action: 'update',
      entity: 'Volunteer',
      entityId: volunteer.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerNumber: volunteer.volunteerNumber,
        status: volunteer.status,
      },
    });

    return NextResponse.json({ success: true, data: volunteer });
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
    console.error('Error updating volunteer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update volunteer' },
      { status: 500 }
    );
  }
}

// ─── DELETE — Delete volunteer ──────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Volunteer id is required' },
        { status: 400 }
      );
    }

    const existing = await db.volunteer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Volunteer not found' },
        { status: 404 }
      );
    }

    await db.volunteer.delete({ where: { id } });

    await writeAuditLog({
      action: 'delete',
      entity: 'Volunteer',
      entityId: existing.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerNumber: existing.volunteerNumber,
        status: existing.status,
      },
    });

    return NextResponse.json({ success: true, message: 'Volunteer deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting volunteer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete volunteer' },
      { status: 500 }
    );
  }
}
