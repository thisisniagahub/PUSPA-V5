// ============================================================
// Hermes Agent — Tool Execution Engine
// Supports multi-step tool chains, permission checks, and
// the advanced 30+ tool registry
// ============================================================

import { hermesTools, toolMap, getToolsByPermission } from './advanced-tools'
import type { HermesToolDefinition, ToolResult, ToolCallMatch, ActionCallMatch, ToolExecutionContext, HermesClientAction } from './types'
import { ROLE_PERMISSIONS } from './types'

export { hermesTools, toolMap, getToolsByCategory, getToolsByPermission } from './advanced-tools'

// ============================================================
// Tool Call Parsing (supports <<TOOL:name>>{}<</TOOL>> format)
// ============================================================

const TOOL_CALL_REGEX = /<<TOOL:(\w+)>>([\s\S]*?)<<\/TOOL>>/g
const ACTION_CALL_REGEX = /<<ACTION:(\w+)>>([\s\S]*?)<<\/ACTION>>/g

export function parseToolCalls(content: string): ToolCallMatch[] {
  const matches: ToolCallMatch[] = []
  let match: RegExpExecArray | null
  TOOL_CALL_REGEX.lastIndex = 0

  while ((match = TOOL_CALL_REGEX.exec(content)) !== null) {
    const toolName = match[1]
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(match[2].trim())
    } catch {
      args = {}
    }
    matches.push({ toolName, args, rawMatch: match[0] })
  }

  return matches
}

export function parseActionCalls(content: string): ActionCallMatch[] {
  const matches: ActionCallMatch[] = []
  let match: RegExpExecArray | null
  ACTION_CALL_REGEX.lastIndex = 0

  while ((match = ACTION_CALL_REGEX.exec(content)) !== null) {
    const actionType = match[1]
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(match[2].trim())
    } catch {
      args = {}
    }
    matches.push({ actionType, args, rawMatch: match[0] })
  }

  return matches
}

// Remove tool/action tags from content for display
export function cleanToolTags(content: string): string {
  return content
    .replace(TOOL_CALL_REGEX, '')
    .replace(ACTION_CALL_REGEX, '')
    .trim()
}

// ============================================================
// Tool Execution (Single)
// ============================================================

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  context?: ToolExecutionContext,
): Promise<ToolResult> {
  const tool = toolMap.get(toolName)
  if (!tool) {
    return { success: false, error: `Tool tidak diketahui: ${toolName}` }
  }

  // Permission check
  if (context?.userRole) {
    const allowedPermissions = ROLE_PERMISSIONS[context.userRole] || ['read']
    if (!allowedPermissions.includes(tool.permission)) {
      return { success: false, error: `Anda tidak mempunyai kebenaran untuk menggunakan tool ${toolName} (memerlukan: ${tool.permission})` }
    }
  }

  try {
    return await tool.handler(args, context)
  } catch (error: any) {
    console.error(`Hermes tool error [${toolName}]:`, error)
    return { success: false, error: error?.message || 'Pemprosesan tool gagal' }
  }
}

// ============================================================
// Multi-Step Tool Chain Execution
// ============================================================

export interface ToolChainStep {
  toolName: string
  args: Record<string, unknown>
  result?: ToolResult
}

export interface ToolChainResult {
  steps: ToolChainStep[]
  allResults: ToolResult[]
  clientActions: HermesClientAction[]
  success: boolean
  errors: string[]
}

export async function executeToolChain(
  toolCalls: ToolCallMatch[],
  context?: ToolExecutionContext,
  maxSteps: number = 5,
): Promise<ToolChainResult> {
  const steps: ToolChainStep[] = []
  const allResults: ToolResult[] = []
  const clientActions: HermesClientAction[] = []
  const errors: string[] = []

  const callsToProcess = toolCalls.slice(0, maxSteps)

  for (const call of callsToProcess) {
    const step: ToolChainStep = { toolName: call.toolName, args: call.args }
    const result = await executeToolCall(call.toolName, call.args, context)
    step.result = result
    steps.push(step)
    allResults.push(result)

    if (!result.success && result.error) {
      errors.push(`${call.toolName}: ${result.error}`)
    }

    if (result.clientAction) {
      clientActions.push(result.clientAction)
    }
  }

  return {
    steps,
    allResults,
    clientActions,
    success: errors.length === 0,
    errors,
  }
}

// ============================================================
// Tool Descriptions for System Prompt
// ============================================================

export function getToolDescriptions(userRole?: string): string {
  const allowedPermissions = userRole
    ? (ROLE_PERMISSIONS[userRole] || ['read'])
    : ['read', 'write', 'admin']

  const filteredTools = hermesTools.filter(t => {
    const levels: Record<string, number> = { read: 0, write: 1, admin: 2 }
    return levels[t.permission] <= Math.max(...allowedPermissions.map(p => levels[p] ?? 0))
  })

  const byCategory: Record<string, HermesToolDefinition[]> = {}
  for (const tool of filteredTools) {
    if (!byCategory[tool.category]) byCategory[tool.category] = []
    byCategory[tool.category].push(tool)
  }

  const categoryLabels: Record<string, string> = {
    query: '📊 Query & Search',
    crud: '✏️ Create / Update / Delete',
    navigation: '🧭 Navigation & Workflow',
    workflow: '⚡ Workflow & Automation',
    analytics: '📈 Analytics & Reports',
    system: '⚙️ System & Memory',
  }

  return Object.entries(byCategory).map(([cat, tools]) => {
    const label = categoryLabels[cat] || cat
    const toolLines = tools.map(t => {
      const params = Object.entries(t.parameters)
        .filter(([, p]) => p.required)
        .map(([name, p]) => `${name}: ${p.type}`)
        .join(', ')
      const optParams = Object.entries(t.parameters)
        .filter(([, p]) => !p.required)
        .map(([name, p]) => `${name}??: ${p.type}`)
        .join(', ')
      const permBadge = t.permission === 'write' ? ' [WRITE]' : t.permission === 'admin' ? ' [ADMIN]' : ''
      return `  - **${t.name}**${permBadge}: ${t.description}${params ? ` | Required: ${params}` : ''}${optParams ? ` | Optional: ${optParams}` : ''}`
    }).join('\n')
    return `${label}:\n${toolLines}`
  }).join('\n\n')
}

// Get available modules list for prompts
export function getAvailableModules(): string[] {
  return [
    'dashboard', 'members', 'cases', 'donations', 'donors',
    'programmes', 'disbursements', 'volunteers', 'activities',
    'compliance', 'documents', 'reports', 'admin', 'ekyc', 'tapsecure',
  ]
}
