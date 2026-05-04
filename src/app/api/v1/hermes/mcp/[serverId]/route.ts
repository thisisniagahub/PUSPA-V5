import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get server details + discovered tools
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { serverId } = await params

    const server = await db.hermesMCPServer.findFirst({
      where: { id: serverId, userId },
    })

    if (!server) {
      return NextResponse.json({ success: false, error: 'MCP server not found' }, { status: 404 })
    }

    // Parse JSON fields for the response
    const serverData = {
      ...server,
      args: server.args ? JSON.parse(server.args) : null,
      env: server.env ? JSON.parse(server.env) : null,
      toolFilter: server.toolFilter ? JSON.parse(server.toolFilter) : null,
      // Discovered tools placeholder — in production, this would connect to the MCP server
      discoveredTools: server.toolFilter
        ? (JSON.parse(server.toolFilter) as string[]).map((name) => ({
            name,
            description: `Tool: ${name}`,
          }))
        : [],
    }

    return NextResponse.json({ success: true, data: serverData })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// DELETE — Remove server
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { serverId } = await params

    const server = await db.hermesMCPServer.findFirst({
      where: { id: serverId, userId },
    })

    if (!server) {
      return NextResponse.json({ success: false, error: 'MCP server not found' }, { status: 404 })
    }

    await db.hermesMCPServer.delete({
      where: { id: serverId },
    })

    return NextResponse.json({ success: true, data: { id: serverId, deleted: true } })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// PATCH — Update server config (enable/disable, toolFilter)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { serverId } = await params
    const body = await request.json()

    const server = await db.hermesMCPServer.findFirst({
      where: { id: serverId, userId },
    })

    if (!server) {
      return NextResponse.json({ success: false, error: 'MCP server not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    if (body.enabled !== undefined) {
      updateData.enabled = body.enabled
    }
    if (body.toolFilter !== undefined) {
      updateData.toolFilter = body.toolFilter ? JSON.stringify(body.toolFilter) : null
    }
    if (body.command !== undefined) {
      updateData.command = body.command
    }
    if (body.url !== undefined) {
      updateData.url = body.url
    }
    if (body.args !== undefined) {
      updateData.args = body.args ? JSON.stringify(body.args) : null
    }
    if (body.env !== undefined) {
      updateData.env = body.env ? JSON.stringify(body.env) : null
    }
    if (body.transport !== undefined) {
      updateData.transport = body.transport
    }

    const updated = await db.hermesMCPServer.update({
      where: { id: serverId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
