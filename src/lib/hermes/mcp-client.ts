// ============================================================
// Hermes Agent V2 — MCP Integration
// Connect to MCP (Model Context Protocol) servers
// Discover and execute tools from MCP servers
// ============================================================

import { db } from '@/lib/db'

// ── Types ───────────────────────────────────────────────────

export interface MCPServerConfig {
  name: string
  transport: 'stdio' | 'http' | 'sse'
  command?: string
  url?: string
  args?: string[]
  env?: Record<string, string>
  toolFilter?: string[]
}

export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, unknown>
  serverName: string
}

export interface MCPServerInfo {
  id: string
  name: string
  transport: string
  enabled: boolean
  status: string
  lastConnectedAt: Date | null
  toolCount: number
}

// ── In-memory connection pool ───────────────────────────────

const connectionPool = new Map<string, {
  tools: MCPTool[]
  connectedAt: Date
  lastActivity: Date
}>()

// ── Server Management ───────────────────────────────────────

/** List configured MCP servers for a user */
export async function listMCPServers(userId: string): Promise<MCPServerInfo[]> {
  const servers = await db.hermesMCPServer.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return servers.map(s => {
    const pool = connectionPool.get(s.id)
    return {
      id: s.id,
      name: s.name,
      transport: s.transport,
      enabled: s.enabled,
      status: pool ? 'connected' : s.status,
      lastConnectedAt: s.lastConnectedAt,
      toolCount: pool?.tools.length ?? 0,
    }
  })
}

/** Add a new MCP server configuration */
export async function addMCPServer(userId: string, config: MCPServerConfig): Promise<MCPServerInfo> {
  const server = await db.hermesMCPServer.create({
    data: {
      userId,
      name: config.name,
      transport: config.transport,
      command: config.command ?? null,
      url: config.url ?? null,
      args: config.args ? JSON.stringify(config.args) : null,
      env: config.env ? JSON.stringify(config.env) : null,
      toolFilter: config.toolFilter ? JSON.stringify(config.toolFilter) : null,
      enabled: true,
      status: 'disconnected',
    },
  })

  return {
    id: server.id,
    name: server.name,
    transport: server.transport,
    enabled: server.enabled,
    status: server.status,
    lastConnectedAt: null,
    toolCount: 0,
  }
}

/** Remove an MCP server */
export async function removeMCPServer(userId: string, serverId: string): Promise<void> {
  // Disconnect from pool first
  connectionPool.delete(serverId)

  await db.hermesMCPServer.delete({
    where: { id: serverId, userId },
  })
}

// ── Connection & Discovery ──────────────────────────────────

/** Connect to an MCP server and discover its tools */
export async function connectToServer(serverId: string): Promise<{
  connected: boolean
  tools: MCPTool[]
  error?: string
}> {
  const server = await db.hermesMCPServer.findUnique({ where: { id: serverId } })
  if (!server) {
    return { connected: false, tools: [], error: 'Server not found' }
  }

  if (!server.enabled) {
    return { connected: false, tools: [], error: 'Server is disabled' }
  }

  try {
    // Discover tools based on transport type
    const tools = await discoverTools(server)

    // Update connection pool
    connectionPool.set(serverId, {
      tools,
      connectedAt: new Date(),
      lastActivity: new Date(),
    })

    // Update DB status
    await db.hermesMCPServer.update({
      where: { id: serverId },
      data: {
        status: 'connected',
        lastConnectedAt: new Date(),
      },
    })

    return { connected: true, tools }
  } catch (error: any) {
    await db.hermesMCPServer.update({
      where: { id: serverId },
      data: { status: 'error' },
    })

    return { connected: false, tools: [], error: error?.message || 'Connection failed' }
  }
}

/** Discover tools from an MCP server */
async function discoverTools(server: {
  id: string
  name: string
  transport: string
  command: string | null
  url: string | null
  args: string | null
  env: string | null
  toolFilter: string | null
}): Promise<MCPTool[]> {
  // For stdio transport: we simulate tool discovery
  // In production, this would spawn a process and use MCP protocol
  if (server.transport === 'stdio') {
    // Placeholder: return basic tools based on server name
    const tools: MCPTool[] = [
      {
        name: `${server.name}_execute`,
        description: `Execute a command via ${server.name} MCP server`,
        parameters: {
          command: { type: 'string', description: 'Command to execute' },
        },
        serverName: server.name,
      },
      {
        name: `${server.name}_query`,
        description: `Query information from ${server.name} MCP server`,
        parameters: {
          query: { type: 'string', description: 'Query string' },
        },
        serverName: server.name,
      },
    ]

    // Apply tool filter if set
    if (server.toolFilter) {
      const filter = JSON.parse(server.toolFilter) as string[]
      return tools.filter(t => filter.includes(t.name))
    }

    return tools
  }

  // For HTTP/SSE transport: simulate discovery
  if (server.transport === 'http' || server.transport === 'sse') {
    if (!server.url) return []

    return [
      {
        name: `${server.name}_request`,
        description: `Make a request to ${server.name} via ${server.transport}`,
        parameters: {
          method: { type: 'string', description: 'HTTP method' },
          path: { type: 'string', description: 'API path' },
          body: { type: 'object', description: 'Request body' },
        },
        serverName: server.name,
      },
    ]
  }

  return []
}

// ── Tool Execution ──────────────────────────────────────────

/** Execute an MCP tool */
export async function executeMCPTool(
  serverId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{
  success: boolean
  result?: unknown
  error?: string
}> {
  const poolEntry = connectionPool.get(serverId)
  if (!poolEntry) {
    return { success: false, error: 'Server not connected. Call connectToServer first.' }
  }

  const tool = poolEntry.tools.find(t => t.name === toolName)
  if (!tool) {
    return { success: false, error: `Tool "${toolName}" not found on server` }
  }

  try {
    // Update last activity
    poolEntry.lastActivity = new Date()

    // In production, this would use the MCP protocol to execute the tool
    // For now, return a simulated response
    return {
      success: true,
      result: {
        tool: toolName,
        args,
        output: `Executed ${toolName} via MCP server`,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Tool execution failed' }
  }
}

// ── Prompt Integration ──────────────────────────────────────

/** Get available MCP tools formatted for system prompt injection */
export async function getMCPToolsForPrompt(userId: string): Promise<string> {
  const servers = await db.hermesMCPServer.findMany({
    where: { userId, enabled: true },
  })

  const allTools: MCPTool[] = []
  for (const server of servers) {
    const pool = connectionPool.get(server.id)
    if (pool) {
      allTools.push(...pool.tools)
    }
  }

  if (allTools.length === 0) return ''

  const lines = allTools.map(t =>
    `- **${t.name}**: ${t.description} (from ${t.serverName})`
  )

  return `## MCP Tools (External)
The following MCP tools are available from connected servers:
${lines.join('\n')}

Use these tools when the built-in tools are insufficient. Always check if a built-in tool can handle the request first.`
}
