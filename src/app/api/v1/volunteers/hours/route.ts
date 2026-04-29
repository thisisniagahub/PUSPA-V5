import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { getRequestIp, getSessionActor, writeAuditLog } from '@/lib/audit';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const hourLogCreateSchema = z.object({
  volunteerId: z.string().min(1, 'ID sukarelawan diperlukan'),
  deploymentId: z.string().optional(),
  date: z.string().min(1, 'Tarikh diperlukan'),
  hours: z.number().positive().max(24, 'Jam mesti antara 0.1 dan 24'),
  activity: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
});

// ─── GET — List hour logs ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const volunteerId = searchParams.get('volunteerId') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const where: Record<string, unknown> = {};
    if (volunteerId) {
      where.volunteerId = volunteerId;
    }
    if (status) {
      where.status = status;
    }

    const [hourLogs, total] = await Promise.all([
      db.volunteerHourLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          volunteer: { select: { id: true, name: true, volunteerNumber: true } },
        },
      }),
      db.volunteerHourLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: hourLogs,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching hour logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hour logs' },
      { status: 500 }
    );
  }
}

// ─── POST — Log volunteer hours ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const actor = getSessionActor(session);
    const body = await request.json();
    const validated = hourLogCreateSchema.parse(body);

    // Verify volunteer exists
    const volunteer = await db.volunteer.findUnique({
      where: { id: validated.volunteerId },
    });
    if (!volunteer) {
      return NextResponse.json(
        { success: false, error: 'Sukarelawan tidak dijumpai' },
        { status: 404 }
      );
    }

    const hourLog = await db.volunteerHourLog.create({
      data: {
        volunteerId: validated.volunteerId,
        deploymentId: validated.deploymentId || null,
        date: new Date(validated.date),
        hours: validated.hours,
        activity: validated.activity || null,
        status: validated.status,
        approvedBy: validated.status === 'approved' ? actor : null,
        approvedAt: validated.status === 'approved' ? new Date() : null,
      },
      include: {
        volunteer: { select: { id: true, name: true, volunteerNumber: true } },
      },
    });

    // Update volunteer totalHours if approved
    if (validated.status === 'approved') {
      await db.volunteer.update({
        where: { id: validated.volunteerId },
        data: { totalHours: { increment: validated.hours } },
      });
    }

    await writeAuditLog({
      action: 'create',
      entity: 'VolunteerHourLog',
      entityId: hourLog.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerId: hourLog.volunteerId,
        hours: hourLog.hours,
        status: hourLog.status,
      },
    });

    return NextResponse.json({ success: true, data: hourLog }, { status: 201 });
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
    console.error('Error creating hour log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hour log' },
      { status: 500 }
    );
  }
}

// ─── PUT — Approve/reject hour log ──────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const actor = getSessionActor(session);
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID dan status diperlukan' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status tidak sah' },
        { status: 400 }
      );
    }

    const existing = await db.volunteerHourLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Log jam tidak dijumpai' },
        { status: 404 }
      );
    }

    // If re-approving or rejecting a previously approved log, adjust totalHours
    if (existing.status === 'approved' && status !== 'approved') {
      await db.volunteer.update({
        where: { id: existing.volunteerId },
        data: { totalHours: { decrement: existing.hours } },
      });
    } else if (existing.status !== 'approved' && status === 'approved') {
      await db.volunteer.update({
        where: { id: existing.volunteerId },
        data: { totalHours: { increment: existing.hours } },
      });
    }

    const hourLog = await db.volunteerHourLog.update({
      where: { id },
      data: {
        status,
        approvedBy: actor,
        approvedAt: status === 'approved' ? new Date() : null,
      },
      include: {
        volunteer: { select: { id: true, name: true, volunteerNumber: true } },
      },
    });

    await writeAuditLog({
      action: 'update',
      entity: 'VolunteerHourLog',
      entityId: hourLog.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerId: hourLog.volunteerId,
        hours: hourLog.hours,
        status: hourLog.status,
      },
    });

    return NextResponse.json({ success: true, data: hourLog });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error updating hour log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hour log' },
      { status: 500 }
    );
  }
}

// ─── DELETE — Delete hour log ───────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log jam id diperlukan' },
        { status: 400 }
      );
    }

    const existing = await db.volunteerHourLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Log jam tidak dijumpai' },
        { status: 404 }
      );
    }

    // Adjust volunteer totalHours if the log was approved
    if (existing.status === 'approved') {
      await db.volunteer.update({
        where: { id: existing.volunteerId },
        data: { totalHours: { decrement: existing.hours } },
      });
    }

    await db.volunteerHourLog.delete({ where: { id } });

    await writeAuditLog({
      action: 'delete',
      entity: 'VolunteerHourLog',
      entityId: existing.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerId: existing.volunteerId,
        hours: existing.hours,
        status: existing.status,
      },
    });

    return NextResponse.json({ success: true, message: 'Log jam berjaya dipadam' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting hour log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete hour log' },
      { status: 500 }
    );
  }
}
