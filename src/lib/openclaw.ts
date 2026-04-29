export interface OpenClawSnapshot {
  generatedAt: string
  controlUrl: string
  gateway: {
    connected: boolean
    status: string
    latencyMs: number
    gatewayUrl: string
    healthUrl: string
    error?: string
  }
  channels: {
    total: number
    connected: number
    items: Array<{
      channelId: string
      accountId: string
      enabled: boolean
      running: boolean
      connected: boolean
      healthState: string
      mode: string | null
      label: string | null
      lastEventAt: number | null
      detail: string | null
    }>
  }
  models: {
    defaultModel: string | null
    resolvedDefault: string | null
    fallbacks: string[]
    aliases: Record<string, string>
    allowedCount: number
    oauthProviders: Array<{
      provider: string
      profileCount: number
      oauthCount: number
      apiKeyCount: number
      tokenCount: number
    }>
  }
  agents: Array<{
    id: string
    sessionCount: number
    lastUpdatedAt: number | null
    lastModel: string | null
    lastKey: string | null
  }>
  automation: {
    cron: Array<{
      id: string
      name: string
      enabled: boolean
      schedule: string | null
      nextRunAtMs: number | null
      lastRunStatus: string | null
    }>
    tasks: {
      total: number
      byStatus: Record<string, number>
      byRuntime: Record<string, number>
      recent: Array<{
        taskId: string
        runtime: string
        status: string
        task: string | null
        lastEventAt: number | null
        endedAt: number | null
      }>
    }
  }
  plugins: {
    entries: Array<{
      key: string
      enabled: boolean
    }>
    webhookRoutes: Array<{
      key: string
      path: string | null
    }>
  }
  mcp: {
    servers: Array<{
      name: string
      transport: string
      enabled: boolean
      source: string | null
    }>
  }
}

export interface OpenClawStatus {
  gatewayUrl: string
  controlUrl: string
  healthUrl: string
  connected: boolean
  status: string
  latencyMs: number
  checkedAt: string
  error?: string
}

export type OpenClawChatRole = 'system' | 'user' | 'assistant'

export interface OpenClawChatMessage {
  role: OpenClawChatRole
  content: string
}

export interface OpenClawChatCompletion {
  content: string
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface OpenClawChatChoice {
  message?: {
    content?: string
  }
}

interface OpenClawChatCompletionPayload {
  choices?: OpenClawChatChoice[]
  usage?: OpenClawChatCompletion['usage']
  model?: string
  error?: {
    message?: string
  }
}

export const DEFAULT_OPENCLAW_BRIDGE_URL = 'https://operator.gangniaga.my/puspa-bridge'
export const DEFAULT_OPENCLAW_AGENT_MODEL = 'openclaw/puspacare'

export function getOpenClawBridgeHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
  }
  const token = process.env.OPENCLAW_BRIDGE_TOKEN

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function isOpenClawGatewayConfigured() {
  return Boolean(process.env.OPENCLAW_GATEWAY_URL && process.env.OPENCLAW_GATEWAY_TOKEN)
}

export async function createOpenClawChatCompletion(
  messages: OpenClawChatMessage[],
  options?: { temperature?: number; signal?: AbortSignal }
): Promise<OpenClawChatCompletion> {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL?.replace(/\/$/, '')
  const token = process.env.OPENCLAW_GATEWAY_TOKEN
  const model = process.env.OPENCLAW_AGENT_MODEL || DEFAULT_OPENCLAW_AGENT_MODEL

  if (!gatewayUrl || !token) {
    throw new Error('OpenClaw Gateway is not configured')
  }

  const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.2,
    }),
    signal: options?.signal,
  })

  const payload = await response.json().catch(() => null) as OpenClawChatCompletionPayload | null

  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenClaw Gateway returned HTTP ${response.status}`)
  }

  const content = payload?.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('OpenClaw Gateway returned an empty response')
  }

  return {
    content,
    model: payload?.model || model,
    usage: payload?.usage,
  }
}
