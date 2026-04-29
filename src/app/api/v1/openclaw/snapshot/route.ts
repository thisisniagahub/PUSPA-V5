import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import {
  DEFAULT_OPENCLAW_BRIDGE_URL,
  getOpenClawBridgeHeaders,
  getGatewayUrl,
  getGatewayToken,
  type OpenClawSnapshot,
} from '@/lib/openclaw'

export async function GET(request: Request) {
  try {
    await requireRole(request, ['developer'])
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
  }

  const baseUrl = (process.env.OPENCLAW_BRIDGE_URL || DEFAULT_OPENCLAW_BRIDGE_URL).replace(/\/$/, '')

  try {
    const response = await fetch(`${baseUrl}/snapshot`, {
      method: 'GET',
      cache: 'no-store',
      headers: getOpenClawBridgeHeaders(),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok || !payload?.data) {
      return NextResponse.json({
        success: false,
        error: payload?.error || `Bridge returned HTTP ${response.status}`,
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      data: payload.data as OpenClawSnapshot,
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reach OpenClaw bridge',
    }, { status: 502 })
  }
}
