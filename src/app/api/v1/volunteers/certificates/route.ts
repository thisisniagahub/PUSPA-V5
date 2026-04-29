import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { getRequestIp, getSessionActor, writeAuditLog } from '@/lib/audit';
import { createWithGeneratedUniqueValue } from '@/lib/sequence';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const certificateCreateSchema = z.object({
  volunteerId: z.string().min(1, 'ID sukarelawan diperlukan'),
  title: z.string().min(1, 'Tajuk sijil diperlukan'),
  description: z.string().optional(),
  totalHours: z.number().min(0).optional().default(0),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function generateCertificateNumber(): Promise<string> {
  const lastCert = await db.volunteerCertificate.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { certificateNumber: true },
  });
  let nextNum = 1;
  if (lastCert?.certificateNumber) {
    const match = lastCert.certificateNumber.match(/CERT-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `CERT-${String(nextNum).padStart(4, '0')}`;
}

// ─── GET — List certificates ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const volunteerId = searchParams.get('volunteerId') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const where: Record<string, unknown> = {};
    if (volunteerId) {
      where.volunteerId = volunteerId;
    }

    const [certificates, total] = await Promise.all([
      db.volunteerCertificate.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          volunteer: { select: { id: true, name: true, volunteerNumber: true } },
        },
      }),
      db.volunteerCertificate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: certificates,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

// ─── POST — Generate certificate ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const actor = getSessionActor(session);
    const body = await request.json();
    const validated = certificateCreateSchema.parse(body);

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

    const certificate = await createWithGeneratedUniqueValue({
      generateValue: generateCertificateNumber,
      uniqueFields: ['certificateNumber'],
      create: (certificateNumber) =>
        db.volunteerCertificate.create({
          data: {
            volunteerId: validated.volunteerId,
            certificateNumber,
            title: validated.title,
            description: validated.description || null,
            totalHours: volunteer.totalHours,
            issuedAt: new Date(),
            issuedBy: actor,
          },
          include: {
            volunteer: { select: { id: true, name: true, volunteerNumber: true } },
          },
        }),
    });

    await writeAuditLog({
      action: 'create',
      entity: 'VolunteerCertificate',
      entityId: certificate.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerId: certificate.volunteerId,
        certificateNumber: certificate.certificateNumber,
        title: certificate.title,
      },
    });

    return NextResponse.json({ success: true, data: certificate }, { status: 201 });
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
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}

// ─── DELETE — Delete certificate ────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID sijil diperlukan' },
        { status: 400 }
      );
    }

    const existing = await db.volunteerCertificate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Sijil tidak dijumpai' },
        { status: 404 }
      );
    }

    await db.volunteerCertificate.delete({ where: { id } });

    await writeAuditLog({
      action: 'delete',
      entity: 'VolunteerCertificate',
      entityId: existing.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        volunteerId: existing.volunteerId,
        certificateNumber: existing.certificateNumber,
        title: existing.title,
      },
    });

    return NextResponse.json({ success: true, message: 'Sijil berjaya dipadam' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete certificate' },
      { status: 500 }
    );
  }
}
