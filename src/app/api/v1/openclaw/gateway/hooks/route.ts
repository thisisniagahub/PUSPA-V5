import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { getGatewayUrl, getGatewayToken, listHooks, createHook } from '@/lib/openclaw'

// GET /api/v1/openclaw/gateway/hooks — List hooks
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
    const hooks = await listHooks(gatewayUrl, token)
    return NextResponse.json({ success: true, data: hooks })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list hooks',
    }, { status: 502 })
  }
}

// POST /api/v1/openclaw/gateway/hooks — Create a hook
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

    if (!body.name || !body.path) {
      return NextResponse.json({
        success: false,
        error: 'name and path are required',
      }, { status: 400 })
    }

    const hook = await createHook(body, gatewayUrl, token)
    return NextResponse.json({ success: true, data: hook })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create hook',
    }, { status: 502 })
  }
}
