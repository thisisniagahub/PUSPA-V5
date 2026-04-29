import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Schemas ───────────────────────────────────────────────────────

const securitySettingsUpdateSchema = z.object({
  userId: z.string().min(1, 'ID pengguna diperlukan').optional(),
  biometricTransactions: z.boolean().optional(),
  boundDeviceOnly: z.boolean().optional(),
  sessionTimeout: z
    .number()
    .int()
    .min(5, 'Masa tamat sesi minimum 5 minit')
    .max(120, 'Masa tamat sesi maksimum 120 minit')
    .optional(),
});

const defaultSettings = {
  biometricTransactions: false,
  boundDeviceOnly: false,
  sessionTimeout: 30,
};

function resolveTargetUserId(
  session: Awaited<ReturnType<typeof requireAuth>>,
  requestedUserId: string | null | undefined,
) {
  if (!requestedUserId || requestedUserId === session.user.id) {
    return session.user.id
  }

  if (session.user.role !== 'admin' && session.user.role !== 'developer') {
    throw new AuthorizationError('Anda tidak boleh mengakses tetapan pengguna lain', 403)
  }

  return requestedUserId
}

// ─── GET /api/v1/tapsecure/settings?userId=xxx ────────────────────
// Retrieve security settings for a user (creates defaults if none exist)

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams;
    const userId = resolveTargetUserId(session, searchParams.get('userId'));

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak dijumpai' },
        { status: 404 }
      );
    }

    // Find existing settings, or create defaults
    let settings = await db.securitySettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.securitySettings.create({
        data: { userId },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        userId: settings.userId,
        biometricTransactions: settings.biometricTransactions,
        boundDeviceOnly: settings.boundDeviceOnly,
        sessionTimeout: settings.sessionTimeout,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan tetapan keselamatan' },
      { status: 500 }
    );
  }
}

// ─── PUT /api/v1/tapsecure/settings ───────────────────────────────
// Update security settings for a user (upsert)

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json();
    const parsed = securitySettingsUpdateSchema.parse(body);
    const userId = resolveTargetUserId(session, parsed.userId);
    const { userId: _ignoredUserId, ...updateData } = parsed;

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak dijumpai' },
        { status: 404 }
      );
    }

    // Fetch previous settings for audit logging
    const previousSettings = await db.securitySettings.findUnique({
      where: { userId },
    });

    // Upsert settings — create if not exist, update if exist
    const settings = await db.securitySettings.upsert({
      where: { userId },
      create: {
        userId,
        ...defaultSettings,
        ...updateData,
      },
      update: {
        ...updateData,
      },
    });

    // Create security log for audit trail
    await db.securityLog.create({
      data: {
        userId,
        action: 'settings_update',
        method: 'password',
        status: 'success',
        details: JSON.stringify({
          message: 'Tetapan keselamatan berjaya dikemaskini',
          previousSettings: previousSettings
            ? {
                biometricTransactions: previousSettings.biometricTransactions,
                boundDeviceOnly: previousSettings.boundDeviceOnly,
                sessionTimeout: previousSettings.sessionTimeout,
              }
            : null,
          newSettings: {
            biometricTransactions: settings.biometricTransactions,
            boundDeviceOnly: settings.boundDeviceOnly,
            sessionTimeout: settings.sessionTimeout,
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tetapan keselamatan berjaya dikemaskini',
      data: {
        id: settings.id,
        userId: settings.userId,
        biometricTransactions: settings.biometricTransactions,
        boundDeviceOnly: settings.boundDeviceOnly,
        sessionTimeout: settings.sessionTimeout,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
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
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengemaskini tetapan keselamatan' },
      { status: 500 }
    );
  }
}
