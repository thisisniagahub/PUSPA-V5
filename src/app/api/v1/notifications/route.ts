import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { writeAuditLog, getRequestIp } from '@/lib/audit';
import { db } from '@/lib/db';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const notificationCreateSchema = z.object({
  title: z.string().min(1, 'Tajuk diperlukan'),
  message: z.string().min(1, 'Mesej diperlukan'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  userId: z.string().optional(),
  link: z.string().optional(),
});

const notificationUpdateSchema = z.object({
  id: z.string().min(1, 'ID notifikasi diperlukan'),
  isRead: z.boolean().optional(),
});

const markAllReadSchema = z.object({
  markAllRead: z.literal(true),
  userId: z.string().optional(),
});

function resolveTargetUserId(
  session: Awaited<ReturnType<typeof requireAuth>>,
  requestedUserId?: string | null,
) {
  if (!requestedUserId || requestedUserId === session.user.id) {
    return session.user.id;
  }

  if (session.user.role === 'admin' || session.user.role === 'developer') {
    return requestedUserId;
  }

  throw new AuthorizationError('Anda tidak dibenarkan mengakses notifikasi pengguna lain', 403);
}

// ---------------------------------------------------------------------------
// GET — List notifications with pagination & filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const userId = resolveTargetUserId(session, searchParams.get('userId'));
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = { userId };

    if (isRead !== null && isRead !== '' && isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.notification.count({ where }),
    ]);

    const unreadCount = await db.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      total,
      unreadCount,
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan notifikasi' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create a notification
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const validated = notificationCreateSchema.parse(body);
    const targetUserId =
      validated.userId === undefined
        ? session.user.id
        : resolveTargetUserId(session, validated.userId);

    const notification = await db.notification.create({
      data: {
        title: validated.title,
        message: validated.message,
        type: validated.type,
        userId: targetUserId,
        link: validated.link || null,
      },
    });

    await writeAuditLog({
      action: 'create',
      entity: 'Notification',
      entityId: notification.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        targetUserId,
        type: notification.type,
      },
    });

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
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
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencipta notifikasi' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Mark as read (single) or mark all as read (batch)
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();

    // ── Batch: mark all as read for a user ──
    if (body.markAllRead === true) {
      const validated = markAllReadSchema.parse(body);
      const targetUserId = resolveTargetUserId(session, validated.userId);

      const result = await db.notification.updateMany({
        where: {
          userId: targetUserId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      await writeAuditLog({
        action: 'update',
        entity: 'Notification',
        userId: session.user.id,
        ipAddress: getRequestIp(request),
        details: {
          targetUserId,
          markAllRead: true,
          updatedCount: result.count,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${result.count} notifikasi telah ditanda sebagai dibaca`,
        updatedCount: result.count,
      });
    }

    // ── Single: mark one notification as read ──
    const validated = notificationUpdateSchema.parse(body);

    if (!validated.id) {
      return NextResponse.json(
        { success: false, error: 'ID notifikasi diperlukan' },
        { status: 400 }
      );
    }

    const existing = await db.notification.findUnique({ where: { id: validated.id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Notifikasi tidak dijumpai' },
        { status: 404 }
      );
    }

    if (
      existing.userId &&
      existing.userId !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'developer'
    ) {
      throw new AuthorizationError('Anda tidak dibenarkan mengemas kini notifikasi ini', 403);
    }

    const notification = await db.notification.update({
      where: { id: validated.id },
      data: {
        ...(validated.isRead !== undefined ? { isRead: validated.isRead } : {}),
      },
    });

    await writeAuditLog({
      action: 'update',
      entity: 'Notification',
      entityId: notification.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        isRead: notification.isRead,
      },
    });

    return NextResponse.json({ success: true, data: notification });
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
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengemas kini notifikasi' },
      { status: 500 }
    );
  }
}
