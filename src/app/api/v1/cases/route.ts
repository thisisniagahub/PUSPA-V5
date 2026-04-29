import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createWithGeneratedUniqueValue } from '@/lib/sequence';
import { z } from 'zod';

const CASE_STATUSES = [
  'draft',
  'submitted',
  'verifying',
  'verified',
  'scoring',
  'scored',
  'approved',
  'disbursing',
  'disbursed',
  'follow_up',
  'closed',
  'rejected',
] as const;

const PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;
const CATEGORIES = ['zakat', 'sedekah', 'wakaf', 'infak', 'government_aid'] as const;

const LEGACY_STATUS_MAP: Record<string, (typeof CASE_STATUSES)[number]> = {
  OPEN: 'submitted',
  IN_PROGRESS: 'verifying',
  PENDING_VERIFICATION: 'verifying',
  APPROVED: 'approved',
  DISBURSED: 'disbursed',
  CLOSED: 'closed',
  REJECTED: 'rejected',
};

const LEGACY_PRIORITY_MAP: Record<string, (typeof PRIORITIES)[number]> = {
  LOW: 'low',
  MEDIUM: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

const LEGACY_CATEGORY_MAP: Record<string, (typeof CATEGORIES)[number]> = {
  FINANCIAL: 'zakat',
  MEDICAL: 'zakat',
  EDUCATION: 'sedekah',
  HOUSING: 'zakat',
  FOOD: 'sedekah',
  COUNSELING: 'sedekah',
  LEGAL: 'sedekah',
  OTHER: 'sedekah',
};

function normalizeEnumValue<T extends readonly [string, ...string[]]>(
  values: T,
  legacyMap: Record<string, T[number]> = {}
) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const lower = trimmed.toLowerCase();
    if ((values as readonly string[]).includes(lower)) return lower;
    return legacyMap[trimmed] ?? legacyMap[trimmed.toUpperCase()] ?? value;
  }, z.enum(values));
}

function getCasesDb(session: Awaited<ReturnType<typeof requireAuth>>) {
  const branchId = (session.user as { branchId?: string | null }).branchId;

  if (branchId) {
    throw new AuthorizationError('Branch-scoped case access is not available', 403);
  }

  return db;
}

const statusSchema = normalizeEnumValue(CASE_STATUSES, LEGACY_STATUS_MAP);
const prioritySchema = normalizeEnumValue(PRIORITIES, LEGACY_PRIORITY_MAP);
const categorySchema = normalizeEnumValue(CATEGORIES, LEGACY_CATEGORY_MAP);

const caseMutableSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  category: categorySchema.optional(),
  amount: z.number().nonnegative().optional(),
  applicantName: z.string().optional(),
  applicantIC: z.string().optional(),
  applicantPhone: z.string().optional(),
  applicantAddress: z.string().optional(),
  memberId: z.string().optional(),
  programmeId: z.string().optional(),
  assigneeId: z.string().optional(),
  verificationScore: z.number().min(0).max(100).optional(),
  welfareScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const caseCreateSchema = caseMutableSchema.extend({
  status: statusSchema.optional().default('draft'),
  priority: prioritySchema.optional().default('normal'),
  category: categorySchema.optional().default('zakat'),
});

const caseUpdateSchema = caseMutableSchema.partial();

async function generateCaseNumber(scopedDb: any = db): Promise<string> {
  const lastCase = await scopedDb.case.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { caseNumber: true },
  });
  let nextNum = 1;
  if (lastCase?.caseNumber) {
    const match = lastCase.caseNumber.match(/CS-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `CS-${String(nextNum).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const scopedDb = getCasesDb(session);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { applicantName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = statusSchema.parse(status);
    if (priority) where.priority = prioritySchema.parse(priority);
    if (category) where.category = categorySchema.parse(category);

    const [cases, total] = await Promise.all([
      scopedDb.case.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          member: { select: { id: true, name: true, memberNumber: true } },
          programme: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          caseNotes: true,
          caseDocuments: true,
        },
      }),
      scopedDb.case.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: cases, total, page, pageSize });
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
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const scopedDb = getCasesDb(session);

    const body = await request.json();
    const validated = caseCreateSchema.parse(body);

    const caseData = await createWithGeneratedUniqueValue({
      generateValue: () => generateCaseNumber(scopedDb),
      uniqueFields: ['caseNumber'],
      create: (caseNumber) =>
        scopedDb.case.create({
          data: {
            ...validated,
            caseNumber,
            creatorId: session.user.id,
          } as any,
          include: {
            member: true,
            programme: true,
            creator: true,
            assignee: true,
            caseNotes: true,
            caseDocuments: true,
          },
        }),
    });

    return NextResponse.json({ success: true, data: caseData }, { status: 201 });
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
    console.error('Error creating case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create case' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const scopedDb = getCasesDb(session);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Case id is required' },
        { status: 400 }
      );
    }

    const existing = await scopedDb.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const validated = caseUpdateSchema.parse(updateData);

    const dataToUpdate: Record<string, unknown> = { ...validated };
    if (validated.status === 'closed' && !existing.closedAt) {
      dataToUpdate.closedAt = new Date();
    }

    const caseData = await scopedDb.case.update({
      where: { id },
      data: dataToUpdate,
      include: {
        member: true,
        programme: true,
        creator: true,
        assignee: true,
        caseNotes: true,
        caseDocuments: true,
      },
    });

    return NextResponse.json({ success: true, data: caseData });
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
    console.error('Error updating case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const scopedDb = getCasesDb(session);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Case id is required' },
        { status: 400 }
      );
    }

    const existing = await scopedDb.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    await scopedDb.case.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}
