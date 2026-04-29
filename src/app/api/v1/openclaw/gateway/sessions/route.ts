import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { getGatewayUrl, getGatewayToken, listSessions, createSession } from '@/lib/openclaw'

// GET /api/v1/openclaw/gateway/sessions — List all sessions
export async function GET(request: Request) {
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
    const sessions = await listSessions(gatewayUrl, token)
    return NextResponse.json({ success: true, data: sessions })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list sessions',
    }, { status: 502 })
  }
}

// POST /api/v1/openclaw/gateway/sessions — Create a new session
export async function POST(request: Request) {
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
    const body = await request.json().catch(() => ({}))
    const session = await createSession(body, gatewayUrl, token)
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session',
    }, { status: 502 })
  }
}
