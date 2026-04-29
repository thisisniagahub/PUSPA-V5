import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Schemas ───────────────────────────────────────────────────────

const biometricSetupSchema = z.object({
  userId: z.string().min(1, 'ID pengguna diperlukan').optional(),
  type: z.enum(['setup', 'verify']).default('setup'),
  deviceFingerprint: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

function resolveTargetUserId(
  session: Awaited<ReturnType<typeof requireAuth>>,
  requestedUserId: string | null | undefined,
) {
  if (!requestedUserId || requestedUserId === session.user.id) {
    return session.user.id;
  }

  if (session.user.role === 'admin' || session.user.role === 'developer') {
    return requestedUserId;
  }

  throw new AuthorizationError('Anda tidak boleh mengurus biometrik pengguna lain', 403);
}

// ─── POST /api/v1/tapsecure/biometric ─────────────────────────────
// Handle biometric setup and verification

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validated = biometricSetupSchema.parse(body);
    const userId = resolveTargetUserId(session, validated.userId);
    const ipAddress =
      validated.ipAddress ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;
    const userAgent = validated.userAgent || request.headers.get('user-agent') || null;

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak dijumpai' },
        { status: 404 }
      );
    }

    if (validated.type === 'verify') {
      return handleBiometricVerify({
        ...validated,
        userId,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      });
    }

    // ── Biometric Setup ──
    await db.securityLog.create({
      data: {
        userId,
        action: 'biometric_setup',
        method: 'webauthn',
        deviceFingerprint: validated.deviceFingerprint || null,
        ipAddress,
        userAgent,
        status: 'success',
        details: JSON.stringify({
          message: 'Pengesahan biometrik berjaya dikonfigurasikan',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengesahan biometrik berjaya dikonfigurasikan',
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
    console.error('Error setting up biometric:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengkonfigurasi pengesahan biometrik' },
      { status: 500 }
    );
  }
}

// ─── Biometric Verification ────────────────────────────────────────
// Simulates biometric verification (in production, integrates with WebAuthn)

async function handleBiometricVerify(
  validated: z.infer<typeof biometricSetupSchema> & { userId: string }
) {
  // Check for recent failed attempts (rate limiting)
  const recentFailures = await db.securityLog.count({
    where: {
      userId: validated.userId,
      action: 'biometric_verify',
      status: 'failed',
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // last 5 minutes
    },
  });

  if (recentFailures >= 5) {
    await db.securityLog.create({
      data: {
        userId: validated.userId,
        action: 'biometric_verify',
        method: 'webauthn',
        deviceFingerprint: validated.deviceFingerprint || null,
        ipAddress: validated.ipAddress || null,
        userAgent: validated.userAgent || null,
        status: 'failed',
        details: JSON.stringify({
          message: 'Terlalu banyak percubaan gagal. Sila cuba lagi dalam 5 minit.',
          recentFailures,
        }),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Terlalu banyak percubaan gagal. Sila cuba lagi dalam 5 minit.',
      },
      { status: 429 }
    );
  }

  // Simulate biometric verification with 90% success rate
  // In production, this would call WebAuthn API
  const isSuccess = Math.random() > 0.1;
  const status = isSuccess ? 'success' : 'failed';

  await db.securityLog.create({
    data: {
      userId: validated.userId,
      action: 'biometric_verify',
      method: 'webauthn',
      deviceFingerprint: validated.deviceFingerprint || null,
      ipAddress: validated.ipAddress || null,
      userAgent: validated.userAgent || null,
      status,
      details: JSON.stringify({
        message: isSuccess
          ? 'Pengesahan biometrik berjaya'
          : 'Pengesahan biometrik gagal. Sila cuba lagi.',
      }),
    },
  });

  if (isSuccess) {
    return NextResponse.json({
      success: true,
      message: 'Pengesahan biometrik berjaya',
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Pengesahan biometrik gagal. Sila cuba lagi.',
    },
    { status: 401 }
  );
}
