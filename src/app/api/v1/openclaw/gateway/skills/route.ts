import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { getGatewayUrl, getGatewayToken, listSkills } from '@/lib/openclaw'

// GET /api/v1/openclaw/gateway/skills — List skills
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
    const skills = await listSkills(gatewayUrl, token)
    return NextResponse.json({ success: true, data: skills })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list skills',
    }, { status: 502 })
  }
}
