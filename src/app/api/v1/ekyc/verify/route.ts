import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeAuditLog, getSessionActor } from '@/lib/audit'
import { z } from 'zod'

// ─── Zod Schema ───────────────────────────────────────────────

const verifySchema = z.object({
  id: z.string().optional(),
  memberId: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  screeningNotes: z.string().optional(),
}).refine(data => data.id || data.memberId, {
  message: 'ID pengesahan atau ID ahli diperlukan',
})

// ─── POST: Verify an eKYC submission ──────────────────────────

export async function POST(request: NextRequest) {
  let auditUserId: string | undefined

  try {
    const session = await requireRole(request, ['admin', 'developer'])
    auditUserId = session.user.id
    const actor = getSessionActor(session)
    const body = await request.json()
    const validated = verifySchema.parse(body)

    // Find the EKYC verification record
    let verification
    if (validated.id) {
      verification = await db.eKYCVerification.findUnique({
        where: { id: validated.id },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              ic: true,
              memberNumber: true,
            },
          },
        },
      })
    } else if (validated.memberId) {
      verification = await db.eKYCVerification.findUnique({
        where: { memberId: validated.memberId },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              ic: true,
              memberNumber: true,
            },
          },
        },
      })
    }

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan eKYC tidak dijumpai' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (verification.status === 'verified') {
      return NextResponse.json(
        { success: false, error: 'Pengesahan eKYC telah disahkan sebelum ini' },
        { status: 400 }
      )
    }

    // Check liveness and face match scores
    const livenessScore = verification.livenessScore ?? 0
    const faceMatchScore = verification.faceMatchScore ?? 0

    if (livenessScore < 60) {
      return NextResponse.json(
        {
          success: false,
          error: `Pengesahan ditolak — skor pengesanan liveness (${livenessScore}) terlalu rendah. Minimum 60 diperlukan.`,
        },
        { status: 400 }
      )
    }

    if (faceMatchScore < 60) {
      return NextResponse.json(
        {
          success: false,
          error: `Pengesahan ditolak — skor sepadan muka (${faceMatchScore}) terlalu rendah. Minimum 60 diperlukan.`,
        },
        { status: 400 }
      )
    }

    // Determine wallet limit based on risk level
    const walletLimitByRisk: Record<string, number> = {
      low: 5000,
      medium: 3000,
      high: 1000,
    }
    const newWalletLimit = walletLimitByRisk[validated.riskLevel || 'low'] ?? 5000

    // Perform verification via Prisma
    const updated = await db.eKYCVerification.update({
      where: { id: verification.id },
      data: {
        status: 'verified',
        bnmCompliant: true,
        amlaScreening: 'pass',
        riskLevel: validated.riskLevel || 'low',
        screeningNotes: validated.screeningNotes || null,
        walletLimit: newWalletLimit,
        previousLimit: verification.walletLimit,
        limitUpgradedAt: new Date(),
        walletEnabled: true,
        bankTransferEnabled: validated.riskLevel !== 'high',
        verifiedAt: new Date(),
        verifiedById: session.user.id,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            ic: true,
            memberNumber: true,
          },
        },
      },
    })

    await writeAuditLog({
      action: 'ekyc_verified',
      entity: 'EKYCVerification',
      entityId: verification.id,
      userId: session.user.id,
      details: {
        memberId: verification.memberId,
        riskLevel: validated.riskLevel || 'low',
        walletLimit: newWalletLimit,
        previousLimit: verification.walletLimit,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Pengesahan eKYC berjaya. Had dompet dinaikkan kepada RM${newWalletLimit.toLocaleString()}.`,
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan gagal', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error verifying eKYC:', error)
    await writeAuditLog({
      action: 'ekyc_verify_failed',
      entity: 'EKYCVerification',
      userId: auditUserId,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    })
    return NextResponse.json(
      { success: false, error: 'Gagal mengesahkan eKYC' },
      { status: 500 }
    )
  }
}
