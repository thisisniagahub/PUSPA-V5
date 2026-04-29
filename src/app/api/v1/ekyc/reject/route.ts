import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeAuditLog, getSessionActor } from '@/lib/audit'
import { z } from 'zod'

// ─── Zod Schema ───────────────────────────────────────────────

const rejectSchema = z.object({
  id: z.string().optional(),
  memberId: z.string().optional(),
  reason: z.string().min(1, 'Sebab penolakan diperlukan').max(1000, 'Sebab penolakan terlalu panjang'),
}).refine(data => data.id || data.memberId, {
  message: 'ID pengesahan atau ID ahli diperlukan',
})

// ─── POST: Reject an eKYC submission ──────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const actor = getSessionActor(session)
    const body = await request.json()
    const validated = rejectSchema.parse(body)

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

    // Check if already verified — cannot reject a verified record
    if (verification.status === 'verified') {
      return NextResponse.json(
        { success: false, error: 'Tidak boleh menolak pengesahan eKYC yang telah disahkan' },
        { status: 400 }
      )
    }

    // Check if already rejected with the same reason
    if (verification.status === 'rejected' && verification.rejectionReason === validated.reason) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan eKYC telah ditolak dengan sebab yang sama' },
        { status: 400 }
      )
    }

    // Reject the verification via Prisma
    const updated = await db.eKYCVerification.update({
      where: { id: verification.id },
      data: {
        status: 'rejected',
        rejectionReason: validated.reason,
        // Disable wallet features on rejection
        walletEnabled: false,
        bankTransferEnabled: false,
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
      action: 'ekyc_rejected',
      entity: 'EKYCVerification',
      entityId: verification.id,
      userId: session.user.id,
      details: {
        memberId: verification.memberId,
        reason: validated.reason,
        previousStatus: verification.status,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Pengesahan eKYC telah ditolak.',
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
    console.error('Error rejecting eKYC:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menolak pengesahan eKYC' },
      { status: 500 }
    )
  }
}
