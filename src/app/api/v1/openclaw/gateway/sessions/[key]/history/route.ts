import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { getGatewayUrl, getGatewayToken, getSessionHistory } from '@/lib/openclaw'

// GET /api/v1/openclaw/gateway/sessions/[key]/history — Get session history
export async function GET(
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
    const history = await getSessionHistory(key, gatewayUrl, token)
    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    }, { status: 502 })
  }
}
