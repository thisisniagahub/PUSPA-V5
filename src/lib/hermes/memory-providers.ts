// ============================================================
// Hermes Agent V2 — External Memory Provider Abstraction
// Support for external memory providers: builtin, honcho, mem0, hindsight
// Sync and search across providers
// ============================================================

import { db } from '@/lib/db'

// ── Types ───────────────────────────────────────────────────

export type MemoryProviderType = 'builtin' | 'honcho' | 'mem0' | 'hindsight'

export interface MemoryProviderDefinition {
  id: MemoryProviderType
  name: string
  description: string
  requiredConfig: MemoryProviderConfigField[]
}

export interface MemoryProviderConfigField {
  key: string
  label: string
  type: 'string' | 'secret' | 'url'
  required: boolean
  description: string
}

export interface MemoryProviderInfo {
  id: string
  userId: string
  provider: string
  config: Record<string, string> | null
  isActive: boolean
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ExternalSearchResult {
  key: string
  value: string
  category: string
  confidence: number
  source: string
  provider: string
}

// ── Supported Providers ─────────────────────────────────────

export const SUPPORTED_MEMORY_PROVIDERS: MemoryProviderDefinition[] = [
  {
    id: 'builtin',
    name: 'Built-in (Hermes)',
    description: 'Default built-in memory system using PostgreSQL via Prisma',
    requiredConfig: [],
  },
  {
    id: 'honcho',
    name: 'Honcho',
    description: 'Honcho AI memory service for persistent user context',
    requiredConfig: [
      { key: 'apiUrl', label: 'API URL', type: 'url', required: true, description: 'Honcho API endpoint' },
      { key: 'apiKey', label: 'API Key', type: 'secret', required: true, description: 'Honcho API key' },
      { key: 'appId', label: 'App ID', type: 'string', required: true, description: 'Honcho application ID' },
    ],
  },
  {
    id: 'mem0',
    name: 'Mem0',
    description: 'Mem0 AI memory layer for personalized interactions',
    requiredConfig: [
      { key: 'apiUrl', label: 'API URL', type: 'url', required: true, description: 'Mem0 API endpoint' },
      { key: 'apiKey', label: 'API Key', type: 'secret', required: true, description: 'Mem0 API key' },
    ],
  },
  {
    id: 'hindsight',
    name: 'Hindsight',
    description: 'Hindsight memory service for contextual recall',
    requiredConfig: [
      { key: 'apiUrl', label: 'API URL', type: 'url', required: true, description: 'Hindsight API endpoint' },
      { key: 'apiKey', label: 'API Key', type: 'secret', required: true, description: 'Hindsight API key' },
      { key: 'projectId', label: 'Project ID', type: 'string', required: true, description: 'Hindsight project ID' },
    ],
  },
]

// ── Provider Management ─────────────────────────────────────

/** Get the active memory provider for a user */
export async function getMemoryProvider(userId: string): Promise<MemoryProviderInfo | null> {
  const provider = await db.hermesMemoryProvider.findUnique({
    where: { userId },
  })

  if (!provider) return null

  let config: Record<string, string> | null = null
  if (provider.config) {
    try {
      config = JSON.parse(provider.config)
    } catch { /* ignore */ }
  }

  return {
    id: provider.id,
    userId: provider.userId,
    provider: provider.provider,
    config,
    isActive: provider.isActive,
    lastSyncAt: provider.lastSyncAt,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  }
}

/** Set the memory provider for a user */
export async function setMemoryProvider(
  userId: string,
  provider: MemoryProviderType,
  config?: Record<string, string>
): Promise<MemoryProviderInfo> {
  const providerDef = SUPPORTED_MEMORY_PROVIDERS.find(p => p.id === provider)
  if (!providerDef) throw new Error(`Unsupported provider: ${provider}`)

  // Validate required fields
  if (config) {
    for (const field of providerDef.requiredConfig) {
      if (field.required && !config[field.key]) {
        throw new Error(`Missing required config: ${field.label}`)
      }
    }
  }

  const record = await db.hermesMemoryProvider.upsert({
    where: { userId },
    create: {
      userId,
      provider,
      config: config ? JSON.stringify(config) : null,
      isActive: true,
    },
    update: {
      provider,
      config: config ? JSON.stringify(config) : null,
      isActive: true,
      updatedAt: new Date(),
    },
  })

  let parsedConfig: Record<string, string> | null = null
  if (record.config) {
    try { parsedConfig = JSON.parse(record.config) } catch { /* ignore */ }
  }

  return {
    id: record.id,
    userId: record.userId,
    provider: record.provider,
    config: parsedConfig,
    isActive: record.isActive,
    lastSyncAt: record.lastSyncAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

// ── Sync ────────────────────────────────────────────────────

/** Sync built-in memories to the external provider */
export async function syncMemories(userId: string): Promise<{
  synced: number
  errors: number
  provider: string
}> {
  const providerInfo = await getMemoryProvider(userId)
  if (!providerInfo || !providerInfo.isActive) {
    throw new Error('No active memory provider configured')
  }

  if (providerInfo.provider === 'builtin') {
    // Built-in provider — no sync needed
    return { synced: 0, errors: 0, provider: 'builtin' }
  }

  // Get all active memories for the user
  const memories = await db.hermesMemory.findMany({
    where: { userId, isActive: true },
  })

  let synced = 0
  let errors = 0

  const config = providerInfo.config || {}

  for (const memory of memories) {
    try {
      switch (providerInfo.provider as MemoryProviderType) {
        case 'honcho': {
          await syncToHoncho(config, userId, memory.key, memory.value, memory.category)
          break
        }
        case 'mem0': {
          await syncToMem0(config, userId, memory.key, memory.value, memory.category)
          break
        }
        case 'hindsight': {
          await syncToHindsight(config, userId, memory.key, memory.value, memory.category)
          break
        }
      }
      synced++
    } catch {
      errors++
    }
  }

  // Update last synced timestamp
  await db.hermesMemoryProvider.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  })

  return { synced, errors, provider: providerInfo.provider }
}

// ── Search ──────────────────────────────────────────────────

/** Search memories via the external provider */
export async function searchExternalMemories(userId: string, query: string): Promise<ExternalSearchResult[]> {
  const providerInfo = await getMemoryProvider(userId)
  if (!providerInfo || !providerInfo.isActive) {
    return []
  }

  const config = providerInfo.config || {}

  switch (providerInfo.provider as MemoryProviderType) {
    case 'honcho':
      return searchHoncho(config, userId, query)
    case 'mem0':
      return searchMem0(config, userId, query)
    case 'hindsight':
      return searchHindsight(config, userId, query)
    case 'builtin':
    default:
      return [] // Built-in search is handled by the memory.ts module
  }
}

// ── Provider-specific Implementations ───────────────────────

async function syncToHoncho(config: Record<string, string>, userId: string, key: string, value: string, category: string): Promise<void> {
  const { apiUrl, apiKey, appId } = config
  await fetch(`${apiUrl}/apps/${appId}/users/${userId}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ key, value, metadata: { category } }),
  })
}

async function syncToMem0(config: Record<string, string>, userId: string, key: string, value: string, category: string): Promise<void> {
  const { apiUrl, apiKey } = config
  await fetch(`${apiUrl}/memories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${apiKey}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: `${key}: ${value}` }], user_id: userId, metadata: { category } }),
  })
}

async function syncToHindsight(config: Record<string, string>, userId: string, key: string, value: string, category: string): Promise<void> {
  const { apiUrl, apiKey, projectId } = config
  await fetch(`${apiUrl}/projects/${projectId}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ user_id: userId, key, value, category }),
  })
}

async function searchHoncho(config: Record<string, string>, userId: string, query: string): Promise<ExternalSearchResult[]> {
  const { apiUrl, apiKey, appId } = config
  try {
    const res = await fetch(`${apiUrl}/apps/${appId}/users/${userId}/memories/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      key: r.key || '',
      value: r.value || r.content || '',
      category: r.metadata?.category || 'general',
      confidence: r.score || 1.0,
      source: 'external',
      provider: 'honcho',
    }))
  } catch {
    return []
  }
}

async function searchMem0(config: Record<string, string>, userId: string, query: string): Promise<ExternalSearchResult[]> {
  const { apiUrl, apiKey } = config
  try {
    const res = await fetch(`${apiUrl}/memories/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${apiKey}` },
      body: JSON.stringify({ query, user_id: userId }),
    })
    const data = await res.json()
    return (data.results || data.memories || []).map((r: any) => ({
      key: r.id || '',
      value: r.memory || r.content || '',
      category: r.metadata?.category || 'general',
      confidence: r.score || 1.0,
      source: 'external',
      provider: 'mem0',
    }))
  } catch {
    return []
  }
}

async function searchHindsight(config: Record<string, string>, userId: string, query: string): Promise<ExternalSearchResult[]> {
  const { apiUrl, apiKey, projectId } = config
  try {
    const res = await fetch(`${apiUrl}/projects/${projectId}/memories/search?q=${encodeURIComponent(query)}&user_id=${userId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      key: r.key || '',
      value: r.value || r.content || '',
      category: r.category || 'general',
      confidence: r.score || 1.0,
      source: 'external',
      provider: 'hindsight',
    }))
  } catch {
    return []
  }
}
