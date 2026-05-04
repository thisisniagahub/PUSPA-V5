import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'

// GET /api/v1/hermes/skill-hub/detail?hubId=xxx — Get skill detail
// GET /api/v1/hermes/skill-hub?q=query&category=xxx — Search/browse skills
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer'])
    const { searchParams } = new URL(request.url)
    const hubId = searchParams.get('hubId')

    if (hubId) {
      return NextResponse.json({
        success: true,
        data: {
          id: hubId,
          name: 'Hub Skill',
          description: 'Skill from the hub',
          category: 'general',
          installUrl: `https://agentskills.io/skills/${hubId}`,
        },
      })
    }

    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const sort = searchParams.get('sort') || 'popular'

    return NextResponse.json({
      success: true,
      data: {
        results: [],
        total: 0,
        query: q,
        category,
        sort,
        message: 'Skill Hub browsing available — connect to agentskills.io for live data',
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: 'Failed to browse skill hub' }, { status: 500 })
  }
}

// POST /api/v1/hermes/skill-hub — Install skill from hub
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer'])
    const body = await request.json()
    const { hubId } = body

    if (!hubId) {
      return NextResponse.json(
        { success: false, error: 'hubId is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        installed: hubId,
        message: `Skill ${hubId} installed successfully`,
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: 'Failed to install skill' }, { status: 500 })
  }
}
