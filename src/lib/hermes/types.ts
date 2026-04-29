// ============================================================
// Hermes Agent — Enhanced Type System
// Full CRUD access to ALL PuspaCare modules
// Inspired by NousResearch Hermes Agent architecture
// ============================================================

export type HermesMessageRole = 'user' | 'assistant' | 'system'

export type ToolCategory = 'query' | 'crud' | 'navigation' | 'workflow' | 'analytics' | 'system'
export type ToolPermission = 'read' | 'write' | 'admin'

export interface HermesChatMessage {
  role: HermesMessageRole
  content: string
}

export interface HermesChatRequest {
  messages: HermesChatMessage[]
  currentView: string
  userRole: string
  locale: 'ms' | 'en'
  stream?: boolean
  conversationId?: string
}

export interface HermesClientAction {
  type: 'navigate' | 'create' | 'update' | 'delete' | 'export' | 'refresh' | 'notification'
  viewId?: string
  module?: string
  recordId?: string
  prefill?: Record<string, unknown>
  message?: string
}

export interface HermesToolParam {
  type: 'string' | 'number' | 'boolean'
  description: string
  required?: boolean
  enum?: string[]
  default?: unknown
}

export interface HermesToolDefinition {
  name: string
  description: string
  category: ToolCategory
  permission: ToolPermission
  parameters: Record<string, HermesToolParam>
  handler: (args: Record<string, unknown>, context?: ToolExecutionContext) => Promise<ToolResult>
}

export interface ToolExecutionContext {
  userId: string
  userRole: string
  currentView: string
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: {
    module: string
    action: string
    recordCount?: number
    recordId?: string
    latencyMs?: number
  }
  clientAction?: HermesClientAction
}

export interface HermesChatResponse {
  success: boolean
  data: {
    message: { role: 'assistant'; content: string }
    clientAction?: HermesClientAction
    toolResults?: { name: string; result: ToolResult }[]
    suggestions?: string[]
  }
  error?: string
}

export interface ToolCallMatch {
  toolName: string
  args: Record<string, unknown>
  rawMatch: string
}

export interface ActionCallMatch {
  actionType: string
  args: Record<string, unknown>
  rawMatch: string
}

// Permission matrix based on roles
export const ROLE_PERMISSIONS: Record<string, ToolPermission[]> = {
  staff: ['read'],
  admin: ['read', 'write'],
  developer: ['read', 'write', 'admin'],
}
