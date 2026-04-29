import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  export: z.enum(['true', 'false']).optional().default('false'),
});

export async function GET(request: NextRequest) {
  try {
    await requireRole(undefined, ['admin', 'developer'])
    const searchParams = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { userId, action, entity, startDate, endDate, page, pageSize, export: isExport } = parsed.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entity) where.entity = { contains: entity, mode: 'insensitive' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    // Export mode — return all matching records
    if (isExport === 'true') {
      const logs = await db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        take: 1000, // Limit export to 1000 records
      });

      const exportData = logs.map((log) => ({
        id: log.id,
        tarikh: log.createdAt.toISOString().split('T')[0],
        masa: log.createdAt.toTimeString().split(' ')[0],
        pengguna: log.user?.name || 'Sistem',
        emel: log.user?.email || '-',
        peranan: log.user?.role || '-',
        tindakan: log.action,
        entiti: log.entity,
        entitiId: log.entityId || '-',
        butiran: log.details || '-',
        ip: log.ipAddress || '-',
      }));

      return NextResponse.json({
        success: true,
        data: {
          exported: true,
          total: exportData.length,
          records: exportData,
        },
      });
    }

    // Paginated mode
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    // Get action summary for stats
    const actionSummary = await db.auditLog.groupBy({
      by: ['action'],
      _count: true,
      where: {
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) } : {}),
          },
        } : {}),
        ...(userId ? { userId } : {}),
        ...(entity ? { entity: { contains: entity } } : {}),
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get entity summary
    const entitySummary = await db.auditLog.groupBy({
      by: ['entity'],
      _count: true,
      where,
      orderBy: { _count: { id: 'desc' } },
    });

    // Most active users
    const activeUsers = await db.auditLog.groupBy({
      by: ['userId'],
      _count: true,
      where: {
        ...where,
        userId: { not: null },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Get user names for active users
    const activeUserIds = activeUsers.map((u) => u.userId).filter(Boolean) as string[];
    const users = activeUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: activeUserIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const mappedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      user: log.user ? {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
        role: log.user.role,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: mappedLogs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          actionSummary: actionSummary.map((a) => ({
            action: a.action,
            count: a._count,
          })),
          entitySummary: entitySummary.map((e) => ({
            entity: e.entity,
            count: e._count,
          })),
          activeUsers: activeUsers.map((u) => ({
            userId: u.userId,
            count: u._count,
            user: u.userId ? userMap.get(u.userId) || null : null,
          })),
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
