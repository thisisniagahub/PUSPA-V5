// ============================================================
// Hermes Agent V2 — Multi-Platform Gateway
// Platform adapter abstraction for delivering messages
// across multiple messaging platforms
// ============================================================

import { db } from '@/lib/db'

// ── Types ───────────────────────────────────────────────────

export type PlatformType = 'telegram' | 'discord' | 'slack' | 'whatsapp' | 'signal' | 'matrix'

export interface PlatformDefinition {
  id: PlatformType
  name: string
  icon: string
  description: string
  requiredConfig: PlatformConfigField[]
}

export interface PlatformConfigField {
  key: string
  label: string
  type: 'string' | 'secret' | 'url'
  required: boolean
  description: string
}

export interface PlatformConfig {
  platform: PlatformType
  name?: string
  config: Record<string, string>
}

export interface PlatformInfo {
  id: string
  userId: string
  platform: string
  label: string | null
  isEnabled: boolean
  status: string
  lastEventAt: Date | null
  createdAt: Date
}

export interface DeliveryResult {
  success: boolean
  messageId?: string
  error?: string
}

// ── Supported Platforms ─────────────────────────────────────

export const SUPPORTED_PLATFORMS: PlatformDefinition[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    description: 'Send messages via Telegram Bot API',
    requiredConfig: [
      { key: 'botToken', label: 'Bot Token', type: 'secret', required: true, description: 'Telegram Bot API token from @BotFather' },
      { key: 'chatId', label: 'Chat ID', type: 'string', required: true, description: 'Target chat or channel ID' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'discord',
    description: 'Send messages via Discord Webhook',
    requiredConfig: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, description: 'Discord channel webhook URL' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    description: 'Send messages via Slack Webhook',
    requiredConfig: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, description: 'Slack incoming webhook URL' },
      { key: 'channel', label: 'Channel', type: 'string', required: false, description: 'Override channel (#channel-name)' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    description: 'Send messages via WhatsApp Business API',
    requiredConfig: [
      { key: 'apiUrl', label: 'API URL', type: 'url', required: true, description: 'WhatsApp Business API endpoint' },
      { key: 'apiKey', label: 'API Key', type: 'secret', required: true, description: 'API authentication key' },
      { key: 'phoneNumber', label: 'Phone Number', type: 'string', required: true, description: 'Recipient phone number (with country code)' },
    ],
  },
  {
    id: 'signal',
    name: 'Signal',
    icon: 'signal',
    description: 'Send messages via Signal CLI REST API',
    requiredConfig: [
      { key: 'apiUrl', label: 'API URL', type: 'url', required: true, description: 'Signal CLI REST API endpoint' },
      { key: 'phoneNumber', label: 'Phone Number', type: 'string', required: true, description: 'Sender phone number' },
      { key: 'recipient', label: 'Recipient', type: 'string', required: true, description: 'Recipient phone number or group ID' },
    ],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    icon: 'matrix',
    description: 'Send messages via Matrix protocol',
    requiredConfig: [
      { key: 'homeserverUrl', label: 'Homeserver URL', type: 'url', required: true, description: 'Matrix homeserver URL' },
      { key: 'accessToken', label: 'Access Token', type: 'secret', required: true, description: 'Matrix access token' },
      { key: 'roomId', label: 'Room ID', type: 'string', required: true, description: 'Target room ID (!abc:server.com)' },
    ],
  },
]

// ── Platform Management ─────────────────────────────────────

/** List configured platforms for a user */
export async function listPlatforms(userId: string): Promise<PlatformInfo[]> {
  const platforms = await db.hermesPlatform.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return platforms.map(p => ({
    id: p.id,
    userId: p.userId,
    platform: p.platform,
    label: p.label,
    isEnabled: p.isEnabled,
    status: p.status,
    lastEventAt: p.lastEventAt,
    createdAt: p.createdAt,
  }))
}

/** Add a new platform configuration */
export async function addPlatform(userId: string, platform: PlatformType, config: PlatformConfig): Promise<PlatformInfo> {
  const platformDef = SUPPORTED_PLATFORMS.find(p => p.id === platform)
  if (!platformDef) throw new Error(`Unsupported platform: ${platform}`)

  // Validate required config fields
  for (const field of platformDef.requiredConfig) {
    if (field.required && !config.config[field.key]) {
      throw new Error(`Missing required config field: ${field.label}`)
    }
  }

  const record = await db.hermesPlatform.create({
    data: {
      userId,
      platform,
      label: config.name || platformDef.name,
      config: JSON.stringify(config.config),
      isEnabled: true,
      status: 'disconnected',
    },
  })

  return {
    id: record.id,
    userId: record.userId,
    platform: record.platform,
    label: record.label,
    isEnabled: record.isEnabled,
    status: record.status,
    lastEventAt: record.lastEventAt,
    createdAt: record.createdAt,
  }
}

/** Remove a platform configuration */
export async function removePlatform(userId: string, platformId: string): Promise<void> {
  await db.hermesPlatform.delete({
    where: { id: platformId, userId },
  })
}

// ── Connection Testing ──────────────────────────────────────

/** Test a platform connection */
export async function testConnection(platformId: string): Promise<{
  success: boolean
  message: string
  latencyMs: number
}> {
  const platform = await db.hermesPlatform.findUnique({ where: { id: platformId } })
  if (!platform) throw new Error('Platform not found')

  const startTime = Date.now()
  const config = JSON.parse(platform.config) as Record<string, string>

  try {
    let success = false
    let message = ''

    switch (platform.platform as PlatformType) {
      case 'telegram': {
        const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`)
        const data = await res.json()
        success = data.ok === true
        message = success ? `Connected as @${data.result.username}` : data.description || 'Authentication failed'
        break
      }
      case 'discord': {
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: '🔌 Connection test from Hermes' }),
        })
        success = res.status === 204 || res.status === 200
        message = success ? 'Webhook test message sent' : `HTTP ${res.status}`
        break
      }
      case 'slack': {
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '🔌 Connection test from Hermes' }),
        })
        success = res.status === 200
        message = success ? 'Webhook test message sent' : `HTTP ${res.status}`
        break
      }
      default: {
        // For platforms without simple test endpoints
        success = true
        message = 'Configuration saved (direct test not supported)'
      }
    }

    const latencyMs = Date.now() - startTime

    await db.hermesPlatform.update({
      where: { id: platformId },
      data: {
        status: success ? 'connected' : 'error',
      },
    })

    return { success, message, latencyMs }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime

    await db.hermesPlatform.update({
      where: { id: platformId },
      data: { status: 'error' },
    })

    return { success: false, message: error?.message || 'Connection test failed', latencyMs }
  }
}

// ── Message Delivery ────────────────────────────────────────

/** Deliver a message to a platform */
export async function deliverMessage(platformId: string, message: string): Promise<DeliveryResult> {
  const platform = await db.hermesPlatform.findUnique({ where: { id: platformId } })
  if (!platform) return { success: false, error: 'Platform not found' }
  if (!platform.isEnabled) return { success: false, error: 'Platform is disabled' }

  const config = JSON.parse(platform.config) as Record<string, string>

  try {
    let messageId: string | undefined

    switch (platform.platform as PlatformType) {
      case 'telegram': {
        const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        })
        const data = await res.json()
        if (!data.ok) return { success: false, error: data.description }
        messageId = String(data.result?.message_id)
        break
      }
      case 'discord': {
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message }),
        })
        if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
        messageId = res.headers.get('X-Message-ID') || undefined
        break
      }
      case 'slack': {
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message,
            channel: config.channel || undefined,
          }),
        })
        if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
        break
      }
      default: {
        return { success: false, error: `Direct delivery not supported for ${platform.platform}` }
      }
    }

    return { success: true, messageId }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Delivery failed' }
  }
}
