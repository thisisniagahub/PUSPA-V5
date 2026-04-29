import { NextRequest, NextResponse } from 'next/server'
import { createBotApiKey, listBotApiKeys, revokeBotApiKey } from '@/lib/bot-auth'
import { AuthorizationError, requireRole } from '@/lib/auth'

function handleAuthError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    )
  }
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin'])
  } catch (error) {
    return handleAuthError(error)
  }

  try {
    const body = await request.json()
    const { name, role, permissions, expiresInDays } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const botKey = await createBotApiKey({
      name,
      role,
      permissions,
      expiresInDays,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: botKey.id,
        name: botKey.name,
        role: botKey.role,
        permissions: botKey.permissions,
        keyPrefix: botKey.keyPrefix,
        rawKey: botKey.rawKey, // Only returned on creation!
        expiresAt: botKey.expiresAt,
        createdAt: botKey.createdAt,
      },
    })
  } catch (error: any) {
    console.error('[BOT_KEY_CREATE]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bot key' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin'])
  } catch (error) {
    return handleAuthError(error)
  }

  try {
    const keys = await listBotApiKeys()
    return NextResponse.json({
      success: true,
      data: keys,
    })
  } catch (error: any) {
    console.error('[BOT_KEY_LIST]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list bot keys' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['admin'])
  } catch (error) {
    return handleAuthError(error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bot key ID required' },
        { status: 400 }
      )
    }

    await revokeBotApiKey(id)

    return NextResponse.json({
      success: true,
      message: 'Bot key revoked',
    })
  } catch (error: any) {
    console.error('[BOT_KEY_REVOKE]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to revoke bot key' },
      { status: 500 }
    )
  }
}
