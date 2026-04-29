import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { getRequestIp, writeAuditLog } from '@/lib/audit';
import { backfillDonorsFromDonations } from '@/lib/donor-sync';
import { createWithGeneratedUniqueValue } from '@/lib/sequence';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const donorCreateSchema = z.object({
  name: z.string().min(1, 'Nama penderma diperlukan'),
  ic: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Format emel tidak sah').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  segment: z.enum(['major', 'regular', 'occasional', 'lapsed']).optional().default('occasional'),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).optional(),
  isAnonymous: z.boolean().optional().default(false),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function generateDonorNumber(): Promise<string> {
  const lastDonor = await db.donor.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { donorNumber: true },
  });
  let nextNum = 1;
  if (lastDonor?.donorNumber) {
    const match = lastDonor.donorNumber.match(/DNR-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `DNR-${String(nextNum).padStart(4, '0')}`;
}

// ── GET: List donors ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    await backfillDonorsFromDonations(db);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const search = searchParams.get('search') || '';
    const segment = searchParams.get('segment') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ic: { contains: search, mode: 'insensitive' } },
        { donorNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (segment) {
      where.segment = segment;
    }
    if (status) {
      where.status = status;
    }

    const allowedSortFields = ['createdAt', 'name', 'donorNumber', 'totalDonated', 'donationCount', 'lastDonationAt', 'segment', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [donors, total] = await Promise.all([
      db.donor.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { taxReceipts: true, communications: true } },
        },
      }),
      db.donor.count({ where }),
    ]);

    // Aggregate stats
    const [totalDonors, totalAmount, activeCount] = await Promise.all([
      db.donor.count(),
      db.donor.aggregate({ _sum: { totalDonated: true } }),
      db.donor.count({ where: { segment: 'regular' } }),
    ]);

    const stats = {
      totalDonors,
      totalAmount: totalAmount._sum.totalDonated || 0,
      regularDonors: activeCount,
      totalReceipts: await db.taxReceipt.count(),
    };

    return NextResponse.json({
      success: true,
      data: donors,
      stats,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan senarai penderma' },
      { status: 500 }
    );
  }
}

// ── POST: Create donor ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const validated = donorCreateSchema.parse(body);

    const donor = await createWithGeneratedUniqueValue({
      generateValue: generateDonorNumber,
      uniqueFields: ['donorNumber'],
      create: (donorNumber) =>
        db.donor.create({
          data: {
            ...validated,
            email: validated.email || null,
            ic: validated.ic || null,
            phone: validated.phone || null,
            address: validated.address || null,
            city: validated.city || null,
            state: validated.state || null,
            notes: validated.notes || null,
            donorNumber,
          },
          include: {
            _count: { select: { taxReceipts: true, communications: true } },
          },
        }),
    });

    await writeAuditLog({
      action: 'create',
      entity: 'Donor',
      entityId: donor.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donorNumber: donor.donorNumber,
        segment: donor.segment,
        status: donor.status,
      },
    });

    return NextResponse.json({ success: true, data: donor }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan gagal', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating donor:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mendaftar penderma' },
      { status: 500 }
    );
  }
}

// ── PUT: Update donor ───────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID penderma diperlukan' },
        { status: 400 }
      );
    }

    const donorUpdateSchemaLoose = donorCreateSchema.partial();
    const validated = donorUpdateSchemaLoose.parse(updateData);

    const existing = await db.donor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Penderma tidak dijumpai' },
        { status: 404 }
      );
    }

    const donor = await db.donor.update({
      where: { id },
      data: {
        ...validated,
        email: validated.email === '' ? null : (validated.email || existing.email),
        ic: validated.ic === '' ? null : (validated.ic || existing.ic),
        phone: validated.phone === '' ? null : (validated.phone || existing.phone),
        address: validated.address === '' ? null : (validated.address || existing.address),
        city: validated.city === '' ? null : (validated.city || existing.city),
        state: validated.state === '' ? null : (validated.state || existing.state),
        notes: validated.notes === '' ? null : (validated.notes || existing.notes),
      },
      include: {
        _count: { select: { taxReceipts: true, communications: true } },
      },
    });

    await writeAuditLog({
      action: 'update',
      entity: 'Donor',
      entityId: donor.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donorNumber: donor.donorNumber,
        segment: donor.segment,
        status: donor.status,
      },
    });

    return NextResponse.json({ success: true, data: donor });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan gagal', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating donor:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengemaskini penderma' },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete donor ─────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID penderma diperlukan' },
        { status: 400 }
      );
    }

    const existing = await db.donor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Penderma tidak dijumpai' },
        { status: 404 }
      );
    }

    await db.donor.delete({ where: { id } });

    await writeAuditLog({
      action: 'delete',
      entity: 'Donor',
      entityId: existing.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donorNumber: existing.donorNumber,
        segment: existing.segment,
        status: existing.status,
      },
    });

    return NextResponse.json({ success: true, message: 'Penderma berjaya dipadam' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting donor:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memadam penderma' },
      { status: 500 }
    );
  }
}
