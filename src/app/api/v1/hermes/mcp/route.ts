import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — List configured MCP servers
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    const servers = await db.hermesMCPServer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: servers })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Add new MCP server (body: name, transport, command/url, args, env, toolFilter)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { name, transport, command, url, args, env, toolFilter } = body

    if (!name || !transport) {
      return NextResponse.json(
        { success: false, error: 'name and transport are required' },
        { status: 400 },
      )
    }

    if (!['stdio', 'http', 'sse'].includes(transport)) {
      return NextResponse.json(
        { success: false, error: 'transport must be "stdio", "http", or "sse"' },
        { status: 400 },
      )
    }

    // Check for duplicate name
    const existing = await db.hermesMCPServer.findUnique({
      where: { userId_name: { userId, name } },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: `MCP server "${name}" already exists` },
        { status: 409 },
      )
    }

    const server = await db.hermesMCPServer.create({
      data: {
        userId,
        name,
        transport,
        command: command || null,
        url: url || null,
        args: args ? JSON.stringify(args) : null,
        env: env ? JSON.stringify(env) : null,
        toolFilter: toolFilter ? JSON.stringify(toolFilter) : null,
        enabled: true,
        status: 'disconnected',
      },
    })

    return NextResponse.json({ success: true, data: server })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
