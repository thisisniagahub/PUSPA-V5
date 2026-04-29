import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Schemas ───────────────────────────────────────────────────────

const setPrimarySchema = z.object({
  id: z.string().min(1, 'ID peranti diperlukan'),
});

// ─── PUT /api/v1/tapsecure/devices/primary ────────────────────────
// Set a specific device as the primary device for its user

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { id } = setPrimarySchema.parse(body);

    // Find the target device
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
      throw new AuthorizationError('Anda tidak boleh menetapkan peranti utama pengguna lain', 403);
    }

    if (!device.isActive) {
      return NextResponse.json(
        { success: false, error: 'Peranti tidak aktif. Sila aktifkan peranti terlebih dahulu.' },
        { status: 400 }
      );
    }

    // If already primary, return early
    if (device.isPrimary) {
      return NextResponse.json({
        success: true,
        data: device,
        message: 'Peranti ini sudah ditetapkan sebagai peranti utama',
      });
    }

    // Use a transaction to atomically swap primary status
    const updatedDevice = await db.$transaction(async (tx) => {
      // Unset primary on all other active devices for this user
      await tx.deviceBinding.updateMany({
        where: {
          userId: device.userId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });

      // Set the specified device as primary
      return tx.deviceBinding.update({
        where: { id },
        data: { isPrimary: true },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });
    });

    // Create security log
    await db.securityLog.create({
      data: {
        userId: device.userId,
        action: 'set_primary_device',
        method: 'device_bind',
        deviceFingerprint: device.deviceFingerprint || null,
        ipAddress: device.ipAddress || null,
        userAgent: device.userAgent || null,
        status: 'success',
        details: JSON.stringify({
          deviceId: device.id,
          deviceName: device.deviceName || 'Peranti Tidak Dikenali',
          deviceType: device.deviceType || 'unknown',
          setAsPrimary: true,
        }),
      },
    });

    return NextResponse.json({ success: true, data: updatedDevice });
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
    console.error('Error setting primary device:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menetapkan peranti utama' },
      { status: 500 }
    );
  }
}
