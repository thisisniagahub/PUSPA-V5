import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import {
  DEFAULT_OPENCLAW_BRIDGE_URL,
  getOpenClawBridgeHeaders,
  getGatewayUrl,
  getGatewayToken,
  fetchGatewayStatus,
  type OpenClawStatus,
} from '@/lib/openclaw'

const DEFAULT_GATEWAY_URL = 'https://operator.gangniaga.my'

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

  // Try direct Gateway API first
  if (gatewayUrl && token) {
    try {
      const status = await fetchGatewayStatus(gatewayUrl, token)
      return NextResponse.json({
        success: true,
        data: {
          gatewayUrl,
          controlUrl: gatewayUrl,
          healthUrl: `${gatewayUrl}/health`,
          connected: status.status === 'ok',
          status: status.status,
          latencyMs: 0,
          checkedAt: new Date().toISOString(),
          version: status.version,
          uptime: status.uptime,
          sessions: status.sessions,
        } as OpenClawStatus & { version?: string; uptime?: number; sessions?: number },
      })
    } catch {
      // Gateway unreachable, fall through to bridge
    }
  }

  // Fallback to bridge
  const bridgeBaseUrl = (process.env.OPENCLAW_BRIDGE_URL || DEFAULT_OPENCLAW_BRIDGE_URL).replace(/\/$/, '')

  try {
    const response = await fetch(`${bridgeBaseUrl}/snapshot`, {
      method: 'GET',
      cache: 'no-store',
      headers: getOpenClawBridgeHeaders(),
    })

    const payload = await response.json().catch(() => null)
    const gateway = payload?.data?.gateway

    if (!response.ok || !payload?.ok || !gateway) {
      return NextResponse.json({
        success: true,
        data: {
          gatewayUrl: DEFAULT_GATEWAY_URL,
          controlUrl: DEFAULT_GATEWAY_URL,
          healthUrl: `${DEFAULT_GATEWAY_URL}/health`,
          connected: false,
          status: 'bridge-error',
          latencyMs: 0,
          checkedAt: new Date().toISOString(),
          error: payload?.error || `Bridge returned HTTP ${response.status}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        gatewayUrl: gateway.gatewayUrl || DEFAULT_GATEWAY_URL,
        controlUrl: payload.data.controlUrl || DEFAULT_GATEWAY_URL,
        healthUrl: gateway.healthUrl || `${DEFAULT_GATEWAY_URL}/health`,
        connected: !!gateway.connected,
        status: gateway.status || 'reachable',
        latencyMs: gateway.latencyMs || 0,
        checkedAt: payload.data.generatedAt || new Date().toISOString(),
        error: gateway.error,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        gatewayUrl: gatewayUrl || DEFAULT_GATEWAY_URL,
        controlUrl: gatewayUrl || DEFAULT_GATEWAY_URL,
        healthUrl: `${gatewayUrl || DEFAULT_GATEWAY_URL}/health`,
        connected: false,
        status: 'offline',
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown bridge error',
      },
    })
  }
}
