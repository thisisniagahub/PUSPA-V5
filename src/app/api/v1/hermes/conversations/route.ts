import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — List conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)

    const conversations = await db.hermesConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: conversations })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// DELETE — Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id
    const url = new URL(request.url)
    const conversationId = url.searchParams.get('id')

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'ID perbualan diperlukan' }, { status: 400 })
    }

    // Verify ownership
    const conv = await db.hermesConversation.findFirst({
      where: { id: conversationId, userId },
    })

    if (!conv) {
      return NextResponse.json({ success: false, error: 'Perbualan tidak dijumpai' }, { status: 404 })
    }

    await db.hermesConversation.delete({ where: { id: conversationId } })

    return NextResponse.json({ success: true, message: 'Perbualan dipadam' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
