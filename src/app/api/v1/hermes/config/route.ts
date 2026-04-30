import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PROVIDERS, type ProviderId } from '@/lib/hermes/provider-types'

export const runtime = 'nodejs'

// GET — Get user's provider config
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id

    const config = await db.hermesProviderConfig.findUnique({ where: { userId } })

    return NextResponse.json({
      success: true,
      data: {
        provider: config?.provider || 'zai',
        model: config?.model || 'default',
        hasApiKey: !!config?.apiKey,
        apiKeyPrefix: config?.apiKey ? config.apiKey.slice(0, 8) + '...' : null,
        baseUrl: config?.baseUrl || null,
        availableProviders: Object.values(PROVIDERS),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    )
  }
}

// PUT — Update provider config
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id

    const body = await request.json()
    const { provider, model, apiKey, baseUrl } = body as {
      provider: ProviderId
      model: string
      apiKey?: string
      baseUrl?: string
    }

    // Validate provider
    if (!PROVIDERS[provider]) {
      return NextResponse.json(
        { success: false, error: `Provider tidak sah: ${provider}` },
        { status: 400 },
      )
    }

    // Validate API key requirement
    if (provider === 'openrouter' && !apiKey) {
      const existing = await db.hermesProviderConfig.findUnique({ where: { userId } })
      if (!existing?.apiKey) {
        return NextResponse.json(
          { success: false, error: 'OpenRouter memerlukan API key' },
          { status: 400 },
        )
      }
    }

    // Validate base URL requirement
    if (provider === 'ollama' && !baseUrl) {
      const existing = await db.hermesProviderConfig.findUnique({ where: { userId } })
      if (!existing?.baseUrl) {
        return NextResponse.json(
          { success: false, error: 'Ollama memerlukan base URL' },
          { status: 400 },
        )
      }
    }

    // Upsert config
    const config = await db.hermesProviderConfig.upsert({
      where: { userId },
      create: {
        userId,
        provider,
        model: model || PROVIDERS[provider].defaultModel,
        apiKey: apiKey || null,
        baseUrl: baseUrl || null,
      },
      update: {
        provider,
        model: model || PROVIDERS[provider].defaultModel,
        ...(apiKey !== undefined ? { apiKey } : {}),
        ...(baseUrl !== undefined ? { baseUrl } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        provider: config.provider,
        model: config.model,
        hasApiKey: !!config.apiKey,
        apiKeyPrefix: config.apiKey ? config.apiKey.slice(0, 8) + '...' : null,
        baseUrl: config.baseUrl,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    )
  }
}
