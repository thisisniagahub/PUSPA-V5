import { NextRequest, NextResponse } from 'next/server'
import { verifyBotApiKey, type BotPermissions } from '@/lib/bot-auth'

export interface BotContext {
  id: string
  name: string
  role: string
  permissions: BotPermissions
}

export class BotAuthError extends Error {
  constructor(message: string, public status: 401 | 403) {
    super(message)
    this.name = 'BotAuthError'
  }
}

export async function requireBotAuth(
  request: NextRequest,
  requiredPermission?: keyof BotPermissions
): Promise<BotContext> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new BotAuthError('Missing or invalid Authorization header', 401)
  }

  const rawKey = authHeader.slice(7).trim()

  if (!rawKey) {
    throw new BotAuthError('Missing bot API key', 401)
  }

  const result = await verifyBotApiKey(rawKey)

  if (!result) {
    throw new BotAuthError('Bot authentication failed: invalid key', 401)
  }

  if (!result.valid) {
    throw new BotAuthError(
      `Bot authentication failed: ${result.reason ?? 'invalid key'}`,
      401
    )
  }

  if (!result.bot) {
    throw new BotAuthError('Bot not found', 401)
  }

  if (requiredPermission && !result.bot.permissions[requiredPermission]) {
    throw new BotAuthError(`Bot lacks required permission: ${requiredPermission}`, 403)
  }

  return result.bot as BotContext
}

export function botAuthErrorResponse(error: unknown) {
  if (error instanceof BotAuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    )
  }

  return NextResponse.json(
    { success: false, error: 'Internal bot auth error' },
    { status: 500 }
  )
}

export function botAuthMiddleware(requiredPermission?: keyof BotPermissions) {
  return async (request: NextRequest) => {
    try {
      const bot = await requireBotAuth(request, requiredPermission)
      return { bot, error: null }
    } catch (error: unknown) {
      return {
        bot: null,
        error: botAuthErrorResponse(error),
      }
    }
  }
}