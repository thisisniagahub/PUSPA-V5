import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createWithGeneratedUniqueValue } from '@/lib/sequence';
import { z } from 'zod';

const disbursementCreateSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  purpose: z.string().min(1, 'Purpose is required'),
  status: z.enum(['pending', 'approved', 'processing', 'disbursed', 'cancelled', 'failed']).optional().default('pending'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientIC: z.string().optional(),
  recipientBank: z.string().optional(),
  recipientAcc: z.string().optional(),
  scheduledDate: z.string().optional(),
  processedDate: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  caseId: z.string().optional(),
  programmeId: z.string().optional(),
  memberId: z.string().optional(),
});

async function generateDisbursementNumber(): Promise<string> {
  const lastDisbursement = await db.disbursement.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { disbursementNumber: true },
  });
  let nextNum = 1;
  if (lastDisbursement?.disbursementNumber) {
    const match = lastDisbursement.disbursementNumber.match(/DB-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `DB-${String(nextNum).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { disbursementNumber: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { recipientIC: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [disbursements, total] = await Promise.all([
      db.disbursement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          programme: { select: { id: true, name: true } },
          member: { select: { id: true, name: true, memberNumber: true } },
        },
      }),
      db.disbursement.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: disbursements, total, page, pageSize });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching disbursements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disbursements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const validated = disbursementCreateSchema.parse(body);

    const disbursement = await createWithGeneratedUniqueValue({
      generateValue: generateDisbursementNumber,
      uniqueFields: ['disbursementNumber'],
      create: (disbursementNumber) =>
        db.disbursement.create({
          data: {
            disbursementNumber,
            amount: validated.amount,
            purpose: validated.purpose,
            status: validated.status,
            recipientName: validated.recipientName,
            recipientIC: validated.recipientIC || null,
            recipientBank: validated.recipientBank || null,
            recipientAcc: validated.recipientAcc || null,
            scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : null,
            processedDate: validated.processedDate ? new Date(validated.processedDate) : null,
            receiptUrl: validated.receiptUrl || null,
            notes: validated.notes || null,
            caseId: validated.caseId || null,
            programmeId: validated.programmeId || null,
            memberId: validated.memberId || null,
          },
          include: {
            case: true,
            programme: true,
            member: true,
          },
        }),
    });

    return NextResponse.json({ success: true, data: disbursement }, { status: 201 });
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
    console.error('Error creating disbursement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create disbursement' },
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
        { success: false, error: 'Disbursement id is required' },
        { status: 400 }
      );
    }

    const existing = await db.disbursement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Disbursement not found' },
        { status: 404 }
      );
    }

    const partialSchema = disbursementCreateSchema.partial();
    const validated = partialSchema.parse(updateData);

    const dataToUpdate: Record<string, unknown> = { ...validated };
    if (validated.scheduledDate) dataToUpdate.scheduledDate = new Date(validated.scheduledDate);
    if (validated.processedDate) dataToUpdate.processedDate = new Date(validated.processedDate);

    const disbursement = await db.disbursement.update({
      where: { id },
      data: dataToUpdate,
      include: {
        case: true,
        programme: true,
        member: true,
      },
    });

    return NextResponse.json({ success: true, data: disbursement });
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
    console.error('Error updating disbursement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update disbursement' },
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
        { success: false, error: 'Disbursement id is required' },
        { status: 400 }
      );
    }

    const existing = await db.disbursement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Disbursement not found' },
        { status: 404 }
      );
    }

    await db.disbursement.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Disbursement deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting disbursement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete disbursement' },
      { status: 500 }
    );
  }
}
