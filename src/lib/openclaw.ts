// ── OpenClaw Gateway Integration Library ─────────────────────────────────────
// Based on docs.openclaw.ai Gateway REST API
// Default gateway port: 18789

// ── Configuration ────────────────────────────────────────────────────────────

export const DEFAULT_OPENCLAW_BRIDGE_URL = 'https://operator.gangniaga.my/puspa-bridge'
export const DEFAULT_OPENCLAW_GATEWAY_PORT = 18789
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

export function getGatewayUrl(): string {
  return (process.env.OPENCLAW_GATEWAY_URL || `http://localhost:${DEFAULT_OPENCLAW_GATEWAY_PORT}`).replace(/\/$/, '')
}

export function getGatewayToken(): string | null {
  return process.env.OPENCLAW_GATEWAY_TOKEN || null
}

export function isOpenClawGatewayConfigured(): boolean {
  return Boolean(process.env.OPENCLAW_GATEWAY_URL || process.env.OPENCLAW_GATEWAY_TOKEN)
}

function gatewayHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  const authToken = token || getGatewayToken()
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  return headers
}

// ── Gateway Status ───────────────────────────────────────────────────────────

export interface OpenClawGatewayStatus {
  status: string
  version: string
  uptime: number
  sessions: number
}

export async function fetchGatewayStatus(gatewayUrl?: string, token?: string): Promise<OpenClawGatewayStatus> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/status`, {
    method: 'GET',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`Gateway status check failed: HTTP ${response.status}`)
  }

  return response.json()
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export interface OpenClawSession {
  key: string
  model?: string
  lastMessageAt?: number
  messageCount?: number
  source?: string
}

export async function listSessions(gatewayUrl?: string, token?: string): Promise<OpenClawSession[]> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/sessions`, {
    method: 'GET',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`List sessions failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.sessions || []
}

export interface CreateSessionPayload {
  key?: string
  model?: string
  systemPrompt?: string
}

export async function createSession(payload: CreateSessionPayload = {}, gatewayUrl?: string, token?: string): Promise<OpenClawSession> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/sessions`, {
    method: 'POST',
    cache: 'no-store',
    headers: gatewayHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Create session failed: HTTP ${response.status}`)
  }

  return response.json()
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  message: string
  model?: string
  systemPrompt?: string
  temperature?: number
}

export interface SendMessageResponse {
  id: string
  session: string
  response: string
  model: string
  tokens?: number
}

export async function sendMessage(
  sessionKey: string,
  payload: SendMessagePayload,
  gatewayUrl?: string,
  token?: string,
): Promise<SendMessageResponse> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/sessions/${encodeURIComponent(sessionKey)}/messages`, {
    method: 'POST',
    cache: 'no-store',
    headers: gatewayHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Send message failed: HTTP ${response.status}`)
  }

  return response.json()
}

export interface HistoryMessage {
  id?: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
  model?: string
  tokens?: number
}

export async function getSessionHistory(
  sessionKey: string,
  gatewayUrl?: string,
  token?: string,
): Promise<HistoryMessage[]> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/sessions/${encodeURIComponent(sessionKey)}/history`, {
    method: 'GET',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`Get history failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.messages || data.history || []
}

// ── Cron Jobs ────────────────────────────────────────────────────────────────

export interface OpenClawCronJob {
  id: string
  name?: string
  enabled: boolean
  schedule: string
  task: string
  session?: string
  lastRunAt?: number | null
  lastRunStatus?: string | null
  nextRunAt?: number | null
}

export async function listCronJobs(gatewayUrl?: string, token?: string): Promise<OpenClawCronJob[]> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/cron`, {
    method: 'GET',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`List cron jobs failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.cron || []
}

export interface CreateCronJobPayload {
  name: string
  schedule: string
  task: string
  session?: string
  enabled?: boolean
}

export async function createCronJob(
  payload: CreateCronJobPayload,
  gatewayUrl?: string,
  token?: string,
): Promise<OpenClawCronJob> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/cron`, {
    method: 'POST',
    cache: 'no-store',
    headers: gatewayHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Create cron job failed: HTTP ${response.status}`)
  }

  return response.json()
}

export async function deleteCronJob(
  jobId: string,
  gatewayUrl?: string,
  token?: string,
): Promise<void> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/cron/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`Delete cron job failed: HTTP ${response.status}`)
  }
}

// ── Hooks / Webhooks ─────────────────────────────────────────────────────────

export interface OpenClawHook {
  id: string
  name?: string
  path: string
  session?: string
  enabled?: boolean
  secret?: string
}

export async function listHooks(gatewayUrl?: string, token?: string): Promise<OpenClawHook[]> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/hooks`, {
    method: 'GET',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`List hooks failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.hooks || []
}

export interface CreateHookPayload {
  name: string
  path: string
  session?: string
  secret?: string
  enabled?: boolean
}

export async function createHook(
  payload: CreateHookPayload,
  gatewayUrl?: string,
  token?: string,
): Promise<OpenClawHook> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/hooks`, {
    method: 'POST',
    cache: 'no-store',
    headers: gatewayHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Create hook failed: HTTP ${response.status}`)
  }

  return response.json()
}

// ── Skills ───────────────────────────────────────────────────────────────────

export interface OpenClawSkill {
  id: string
  name?: string
  description?: string
  enabled?: boolean
  path?: string
}

export async function listSkills(gatewayUrl?: string, token?: string): Promise<OpenClawSkill[]> {
  const url = gatewayUrl || getGatewayUrl()
  const response = await fetch(`${url}/api/skills`, {
    method: 'GET',
    cache: 'no-store',
    headers: gatewayHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`List skills failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.skills || []
}

// ── OpenClaw Chat Completion (via Gateway /v1/chat/completions) ──────────────

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

export async function createOpenClawChatCompletion(
  messages: OpenClawChatMessage[],
  options?: { temperature?: number; model?: string; signal?: AbortSignal },
): Promise<OpenClawChatCompletion> {
  const gatewayUrl = getGatewayUrl()
  const token = getGatewayToken()
  const model = options?.model || process.env.OPENCLAW_AGENT_MODEL || DEFAULT_OPENCLAW_AGENT_MODEL

  if (!gatewayUrl || !token) {
    throw new Error('OpenClaw Gateway is not configured. Set OPENCLAW_GATEWAY_URL and OPENCLAW_GATEWAY_TOKEN.')
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

// ── Snapshot (Bridge-based) ──────────────────────────────────────────────────

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
