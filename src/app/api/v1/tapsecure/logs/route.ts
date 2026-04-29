import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Schemas ───────────────────────────────────────────────────────

const securityLogQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  method: z.string().optional(),
  status: z.enum(['success', 'failed', 'blocked']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  sortBy: z.enum(['createdAt', 'action', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── GET /api/v1/tapsecure/logs ───────────────────────────────────
// List security logs with filtering and pagination

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = securityLogQuerySchema.parse(searchParams);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query.userId && query.userId !== session.user.id) {
      if (session.user.role !== 'admin' && session.user.role !== 'developer') {
        throw new AuthorizationError('Anda tidak boleh melihat log keselamatan pengguna lain', 403)
      }
    }

    if (query.userId) {
      where.userId = query.userId;
    } else if (session.user.role !== 'admin' && session.user.role !== 'developer') {
      where.userId = session.user.id;
    }

    if (query.action) where.action = query.action;
    if (query.method) where.method = query.method;
    if (query.status) where.status = query.status;

    // Date range filtering
    if (query.startDate || query.endDate) {
      const createdAt: Record<string, unknown> = {};
      if (query.startDate) createdAt.gte = new Date(query.startDate);
      if (query.endDate) createdAt.lte = new Date(query.endDate);
      where.createdAt = createdAt;
    }

    const { page, pageSize, sortBy, sortOrder } = query;

    const [logs, total] = await Promise.all([
      db.securityLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      db.securityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
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
    console.error('Error fetching security logs:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan log keselamatan' },
      { status: 500 }
    );
  }
}
