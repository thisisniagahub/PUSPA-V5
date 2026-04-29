import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { listSkills, getSkill, createSkill, seedDefaultSkills } from '@/lib/hermes/skills'

export const runtime = 'nodejs'

// GET — List skills or get a specific skill
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id
    const url = new URL(request.url)

    const skillId = url.searchParams.get('id')
    if (skillId) {
      const skill = await getSkill(skillId)
      return NextResponse.json({ success: true, data: skill })
    }

    const category = url.searchParams.get('category') || undefined
    const skills = await listSkills({ category, userId, activeOnly: true })

    return NextResponse.json({ success: true, data: skills })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Create a new skill or seed defaults
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id
    const body = await request.json()

    // Special action: seed defaults
    if (body.action === 'seed_defaults') {
      await seedDefaultSkills()
      return NextResponse.json({ success: true, message: 'Default skills seeded' })
    }

    const skill = await createSkill({
      name: body.name,
      description: body.description,
      category: body.category,
      instructions: body.instructions,
      triggerPatterns: body.triggerPatterns,
      source: 'manual',
      userId,
    })

    return NextResponse.json({ success: true, data: skill })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
