import { NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { getGatewayUrl, getGatewayToken, listCronJobs, createCronJob } from '@/lib/openclaw'

// GET /api/v1/openclaw/gateway/cron — List cron jobs
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
    const jobs = await listCronJobs(gatewayUrl, token)
    return NextResponse.json({ success: true, data: jobs })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list cron jobs',
    }, { status: 502 })
  }
}

// POST /api/v1/openclaw/gateway/cron — Create a cron job
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

    if (!body.name || !body.schedule || !body.task) {
      return NextResponse.json({
        success: false,
        error: 'name, schedule, and task are required',
      }, { status: 400 })
    }

    const job = await createCronJob(body, gatewayUrl, token)
    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create cron job',
    }, { status: 502 })
  }
}
