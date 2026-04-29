import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { getGatewayUrl, getGatewayToken, sendMessage } from '@/lib/openclaw'

// POST /api/v1/openclaw/gateway/sessions/[key]/messages — Send message to session
export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireRole(request, ['developer'])
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
  }

  const gatewayUrl = getGatewayUrl()
  const token = getGatewayToken()

  if (!gatewayUrl || !token) {
    return NextResponse.json({
      success: false,
      error: 'OpenClaw Gateway not configured',
    }, { status: 503 })
  }

  try {
    const { key } = await params
    const body = await request.json().catch(() => ({}))

    if (!body.message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required',
      }, { status: 400 })
    }

    const result = await sendMessage(key, body, gatewayUrl, token)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }, { status: 502 })
  }
}
