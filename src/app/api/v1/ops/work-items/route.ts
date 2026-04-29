import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createWithGeneratedUniqueValue } from '@/lib/sequence';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const workItemCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project: z.string().optional().default('PUSPA'),
  domain: z.string().min(1, 'Domain is required'),
  requestText: z.string().min(1, 'Request text is required'),
  intent: z.string().min(1, 'Intent is required'),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).optional().default('normal'),
  tags: z.array(z.string()).optional(),
});

async function generateWorkItemNumber() {
  let nextNum = 1;
  const lastWorkItem = await db.workItem.findFirst({
    orderBy: { workItemNumber: 'desc' },
    select: { workItemNumber: true },
  });

  if (lastWorkItem?.workItemNumber) {
    const match = lastWorkItem.workItemNumber.match(/WI-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return `WI-${String(nextNum).padStart(4, '0')}`;
}

// ─── GET: List work items ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const status = searchParams.get('status') || '';
    const domain = searchParams.get('domain') || '';
    const intent = searchParams.get('intent') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (domain) where.domain = domain;
    if (intent) where.intent = intent;

    const [workItems, total] = await Promise.all([
      db.workItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          executionEvents: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          artifacts: true,
          automationJobs: true,
        },
      }),
      db.workItem.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: workItems, total, page, pageSize });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching work items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work items' },
      { status: 500 }
    );
  }
}

// ─── POST: Create work item ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const validated = workItemCreateSchema.parse(body);

    const workItem = await createWithGeneratedUniqueValue({
      generateValue: generateWorkItemNumber,
      uniqueFields: ['workItemNumber'],
      create: (workItemNumber) =>
        db.workItem.create({
          data: {
            workItemNumber,
            title: validated.title,
            project: validated.project,
            domain: validated.domain,
            requestText: validated.requestText,
            intent: validated.intent,
            priority: validated.priority,
            tags: validated.tags ? JSON.stringify(validated.tags) : null,
          },
          include: {
            executionEvents: true,
            artifacts: true,
            automationJobs: true,
          },
        }),
    });

    return NextResponse.json({ success: true, data: workItem }, { status: 201 });
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
    console.error('Error creating work item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create work item' },
      { status: 500 }
    );
  }
}
