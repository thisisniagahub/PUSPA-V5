import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const organizationUpdateSchema = z.object({
  legalName: z.string().optional(),
  tradeName: z.string().optional(),
  registrationType: z.string().optional(),
  registrationNumber: z.string().optional(),
  foundedDate: z.string().optional(),
  registeredAddress: z.string().optional(),
  operatingAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankVerified: z.boolean().optional(),
  lhdnApprovalRef: z.string().optional(),
  lhdnApprovalExpiry: z.string().optional(),
  isTaxExempt: z.boolean().optional(),
  rosCertificateUrl: z.string().optional(),
  constitutionUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  missionStatement: z.string().optional(),
  visionStatement: z.string().optional(),
});

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(_request);
    let profile = await db.organizationProfile.findFirst();

    if (!profile) {
      // Auto-create a default profile if none exists
      profile = await db.organizationProfile.create({
        data: {
          legalName: 'PUSPA Organization',
          tradeName: 'PUSPA',
          email: '',
        },
      });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching organization profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const validated = organizationUpdateSchema.parse(body);

    const existing = await db.organizationProfile.findFirst();
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Organization profile not found. Please initialize first.' },
        { status: 404 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { ...validated };
    if (validated.email === '') dataToUpdate.email = null;
    if (validated.foundedDate) dataToUpdate.foundedDate = new Date(validated.foundedDate);
    if (validated.lhdnApprovalExpiry) dataToUpdate.lhdnApprovalExpiry = new Date(validated.lhdnApprovalExpiry);

    const profile = await db.organizationProfile.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: profile });
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
    console.error('Error updating organization profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update organization profile' },
      { status: 500 }
    );
  }
}

// POST and DELETE are not needed for organization profile (singleton pattern)
// but we include them to satisfy the route handler contract
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Use GET to initialize and PUT to update organization profile' },
    { status: 405 }
  );
}

export async function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Organization profile cannot be deleted' },
    { status: 405 }
  );
}
