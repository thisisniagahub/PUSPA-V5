import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  normalizePartnerRelationship,
  normalizePartnerType,
  normalizePartnerVerifiedStatus,
} from '@/lib/domain';
import { z } from 'zod';

const partnerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  relationship: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  verifiedStatus: z.string().optional(),
  verificationUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const type = normalizePartnerType(searchParams.get('type'));
    const verifiedStatus = normalizePartnerVerifiedStatus(searchParams.get('verifiedStatus'));

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (verifiedStatus) where.verifiedStatus = verifiedStatus;

    const partners = await db.partner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const validated = partnerCreateSchema.parse(body);

    const partner = await db.partner.create({
      data: {
        ...validated,
        type: (normalizePartnerType(validated.type) || 'ngo') as import('@prisma/client').PartnerType,
        relationship: normalizePartnerRelationship(validated.relationship) || null,
        verifiedStatus: (normalizePartnerVerifiedStatus(validated.verifiedStatus) || 'claimed') as import('@prisma/client').VerificationStatus,
        contactEmail: validated.contactEmail || null,
      },
    });

    return NextResponse.json({ success: true, data: partner }, { status: 201 });
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
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
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
        { success: false, error: 'Partner id is required' },
        { status: 400 }
      );
    }

    const existing = await db.partner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    const partialSchema = partnerCreateSchema.partial();
    const validated = partialSchema.parse(updateData);

    const dataToUpdate: Record<string, unknown> = { ...validated };
    if (validated.contactEmail === '') dataToUpdate.contactEmail = null;
    if (validated.type !== undefined) {
      dataToUpdate.type = (normalizePartnerType(validated.type) || 'ngo') as import('@prisma/client').PartnerType;
    }
    if (validated.relationship !== undefined) {
      dataToUpdate.relationship = normalizePartnerRelationship(validated.relationship) || null;
    }
    if (validated.verifiedStatus !== undefined) {
      dataToUpdate.verifiedStatus =
        (normalizePartnerVerifiedStatus(validated.verifiedStatus) || 'claimed') as import('@prisma/client').VerificationStatus;
    }

    const partner = await db.partner.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: partner });
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
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update partner' },
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
        { success: false, error: 'Partner id is required' },
        { status: 400 }
      );
    }

    const existing = await db.partner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    await db.partner.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}
