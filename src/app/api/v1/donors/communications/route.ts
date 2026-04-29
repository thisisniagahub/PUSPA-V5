import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { getRequestIp, getSessionActor, writeAuditLog } from '@/lib/audit';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const communicationCreateSchema = z.object({
  donorId: z.string().min(1, 'Penderma diperlukan'),
  type: z.enum(['email', 'phone', 'whatsapp']),
  subject: z.string().min(1, 'Subjek diperlukan'),
  content: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'sent', 'failed']).optional().default('sent'),
});

// ── GET: List communications ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const donorId = searchParams.get('donorId') || '';
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};

    if (donorId) {
      where.donorId = donorId;
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { donor: { name: { contains: search, mode: 'insensitive' } } },
        { donor: { donorNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [communications, total] = await Promise.all([
      db.donorCommunication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          donor: { select: { id: true, name: true, donorNumber: true } },
        },
      }),
      db.donorCommunication.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: communications,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan senarai komunikasi' },
      { status: 500 }
    );
  }
}

// ── POST: Create communication record ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const actor = getSessionActor(session);
    const body = await request.json();
    const validated = communicationCreateSchema.parse(body);

    // Verify donor exists
    const donor = await db.donor.findUnique({ where: { id: validated.donorId } });
    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Penderma tidak dijumpai' },
        { status: 404 }
      );
    }

    const communication = await db.donorCommunication.create({
      data: {
        donorId: validated.donorId,
        type: validated.type,
        subject: validated.subject,
        content: validated.content || null,
        status: validated.status,
        sentAt: validated.status === 'sent' ? new Date() : null,
        sentById: validated.status === 'sent' ? session.user.id : null,
      },
      include: {
        donor: { select: { id: true, name: true, donorNumber: true } },
      },
    });

    await writeAuditLog({
      action: 'create',
      entity: 'DonorCommunication',
      entityId: communication.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donorId: communication.donorId,
        type: communication.type,
        status: communication.status,
      },
    });

    return NextResponse.json({ success: true, data: communication }, { status: 201 });
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
    console.error('Error creating communication:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal merekod komunikasi' },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete communication ────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID komunikasi diperlukan' },
        { status: 400 }
      );
    }

    const existing = await db.donorCommunication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Komunikasi tidak dijumpai' },
        { status: 404 }
      );
    }

    await db.donorCommunication.delete({ where: { id } });

    await writeAuditLog({
      action: 'delete',
      entity: 'DonorCommunication',
      entityId: existing.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donorId: existing.donorId,
        type: existing.type,
        status: existing.status,
      },
    });

    return NextResponse.json({ success: true, message: 'Komunikasi berjaya dipadam' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting communication:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memadam komunikasi' },
      { status: 500 }
    );
  }
}
