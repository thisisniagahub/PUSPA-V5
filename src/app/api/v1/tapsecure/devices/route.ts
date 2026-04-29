import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Schemas ───────────────────────────────────────────────────────

const deviceBindSchema = z.object({
  userId: z.string().min(1, 'ID pengguna diperlukan').optional(),
  deviceName: z.string().optional(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  deviceFingerprint: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
});

function resolveTargetUserId(
  session: Awaited<ReturnType<typeof requireAuth>>,
  requestedUserId: string | null | undefined,
) {
  if (!requestedUserId || requestedUserId === session.user.id) {
    return session.user.id
  }

  if (session.user.role !== 'admin' && session.user.role !== 'developer') {
    throw new AuthorizationError('Anda tidak boleh mengakses peranti pengguna lain', 403)
  }

  return requestedUserId
}

// ─── GET /api/v1/tapsecure/devices ────────────────────────────────
// List all active device bindings with user data, optionally filtered by userId

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams;
    const userId = resolveTargetUserId(session, searchParams.get('userId'));

    const where: Record<string, unknown> = {
      isActive: true,
      userId,
    };

    const devices = await db.deviceBinding.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { lastUsedAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: devices });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan senarai peranti' },
      { status: 500 }
    );
  }
}

// ─── POST /api/v1/tapsecure/devices ───────────────────────────────
// Bind a new device to a user

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json();
    const parsed = deviceBindSchema.parse(body);
    const targetUserId = resolveTargetUserId(session, parsed.userId);

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak dijumpai' },
        { status: 404 }
      );
    }

    // Check for duplicate fingerprint on the same user
    if (parsed.deviceFingerprint) {
      const duplicate = await db.deviceBinding.findFirst({
        where: {
          userId: targetUserId,
          deviceFingerprint: parsed.deviceFingerprint,
          isActive: true,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Peranti ini sudah diikat dengan akaun anda' },
          { status: 409 }
        );
      }
    }

    // Count existing active devices for this user
    const activeDeviceCount = await db.deviceBinding.count({
      where: { userId: targetUserId, isActive: true },
    });

    const isFirstDevice = activeDeviceCount === 0;

    // Create device binding
    const device = await db.deviceBinding.create({
      data: {
        userId: targetUserId,
        deviceName: parsed.deviceName || null,
        deviceType: parsed.deviceType || null,
        deviceFingerprint: parsed.deviceFingerprint || null,
        userAgent: parsed.userAgent || null,
        ipAddress: parsed.ipAddress || null,
        location: parsed.location || null,
        isPrimary: isFirstDevice,
        isTrusted: isFirstDevice,
        otpVerified: isFirstDevice,
        lastUsedAt: new Date(),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Create security log
    await db.securityLog.create({
      data: {
        userId: targetUserId,
        action: 'device_bind',
        method: 'device_bind',
        deviceFingerprint: parsed.deviceFingerprint || null,
        ipAddress: parsed.ipAddress || null,
        userAgent: parsed.userAgent || null,
        status: 'success',
        details: JSON.stringify({
          deviceId: device.id,
          deviceName: parsed.deviceName || 'Peranti Tidak Dikenali',
          deviceType: parsed.deviceType || 'unknown',
          isFirstDevice,
        }),
      },
    });

    return NextResponse.json({ success: true, data: device }, { status: 201 });
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
    console.error('Error creating device binding:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengikat peranti baharu' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/v1/tapsecure/devices?id=xxx ──────────────────────
// Soft-delete (deactivate) a device binding

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID peranti diperlukan' },
        { status: 400 }
      );
    }

    const device = await db.deviceBinding.findUnique({ where: { id } });
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Peranti tidak dijumpai' },
        { status: 404 }
      );
    }

    if (
      device.userId !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'developer'
    ) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak boleh menyahaktifkan peranti pengguna lain' },
        { status: 403 }
      );
    }

    if (!device.isActive) {
      return NextResponse.json(
        { success: false, error: 'Peranti sudah dinyahaktifkan' },
        { status: 400 }
      );
    }

    // Soft delete — set isActive to false
    await db.deviceBinding.update({
      where: { id },
      data: { isActive: false, isPrimary: false },
    });

    // If the removed device was primary, promote the most recent active device
    if (device.isPrimary) {
      const nextPrimary = await db.deviceBinding.findFirst({
        where: { userId: device.userId, isActive: true },
        orderBy: { lastUsedAt: 'desc' },
      });

      if (nextPrimary) {
        await db.deviceBinding.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
    }

    // Create security log
    await db.securityLog.create({
      data: {
        userId: device.userId,
        action: 'device_unbind',
        method: 'device_bind',
        deviceFingerprint: device.deviceFingerprint || null,
        ipAddress: device.ipAddress || null,
        userAgent: device.userAgent || null,
        status: 'success',
        details: JSON.stringify({
          deviceId: device.id,
          deviceName: device.deviceName || 'Peranti Tidak Dikenali',
          deviceType: device.deviceType || 'unknown',
          wasPrimary: device.isPrimary,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Peranti berjaya dinyahaktifkan',
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting device binding:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyahaktifkan peranti' },
      { status: 500 }
    );
  }
}
