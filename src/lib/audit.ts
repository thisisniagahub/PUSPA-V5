import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

type AuditLogInput = {
  action: string
  entity: string
  entityId?: string | null
  userId?: string | null
  ipAddress?: string | null
  details?: Record<string, unknown> | string | null
}

export async function writeAuditLog(input: AuditLogInput) {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        userId: input.userId || null,
        ipAddress: input.ipAddress || null,
        details:
          typeof input.details === 'string'
            ? input.details
            : input.details
              ? JSON.stringify(input.details)
              : null,
      },
    })
  } catch (error) {
    console.error('Error writing audit log:', error)
  }
}

type SessionLike = {
  user: {
    id: string
    email?: string | null
    name?: string | null
  }
}

export function getSessionActor(session: SessionLike) {
  return session.user.email || session.user.name || session.user.id
}

export function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}
