export type UserRole = 'staff' | 'admin' | 'developer'

export type SessionPayload = {
  role: UserRole
  issuedAt: number
  expiresAt: number
}

export const SESSION_COOKIE_NAME = 'puspa_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const ROLE_ORDER: Record<UserRole, number> = {
  staff: 1,
  admin: 2,
  developer: 3,
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlToBytes(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = padded.length % 4
  const normalized = remainder === 0 ? padded : `${padded}${'='.repeat(4 - remainder)}`
  const binary = atob(normalized)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function base64UrlEncode(input: string) {
  return bytesToBase64Url(encoder.encode(input))
}

function base64UrlDecode(input: string) {
  return decoder.decode(base64UrlToBytes(input))
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(secret: string, value: string) {
  const key = await importSigningKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return bytesToBase64Url(new Uint8Array(signature))
}

function normalizeRole(role: string | undefined | null): UserRole {
  if (role === 'staff' || role === 'admin' || role === 'developer') return role
  return 'developer'
}

export function getSessionSecret() {
  return process.env.PUSPA_SESSION_SECRET || process.env.API_SECRET_KEY || ''
}

export function getOperatorPassword() {
  return process.env.PUSPA_OPERATOR_PASSWORD || process.env.API_SECRET_KEY || ''
}

export function getDefaultRole(): UserRole {
  return normalizeRole(process.env.PUSPA_OPERATOR_ROLE)
}

export async function createSessionToken(role: UserRole) {
  const secret = getSessionSecret()
  if (!secret) throw new Error('Missing session secret')

  const now = Date.now()
  const payload: SessionPayload = {
    role,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  }

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const signature = await sign(secret, payloadEncoded)

  return `${payloadEncoded}.${signature}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null

  const secret = getSessionSecret()
  if (!secret) return null

  const [payloadEncoded, providedSignature] = token.split('.')
  if (!payloadEncoded || !providedSignature) return null

  const expectedSignature = await sign(secret, payloadEncoded)
  if (expectedSignature !== providedSignature) return null

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as SessionPayload
    if (!payload?.role || typeof payload.expiresAt !== 'number') return null
    if (payload.expiresAt < Date.now()) return null
    return {
      role: normalizeRole(payload.role),
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
    }
  } catch {
    return null
  }
}

export function hasRequiredRole(role: UserRole, minimumRole: UserRole) {
  return ROLE_ORDER[role] >= ROLE_ORDER[minimumRole]
}

export const API_ROLE_RULES: Array<{ prefix: string; role: UserRole }> = [
  { prefix: '/api/v1/openclaw/', role: 'developer' },
  { prefix: '/api/v1/compliance/', role: 'admin' },
  { prefix: '/api/v1/audit/', role: 'admin' },
  { prefix: '/api/v1/ekyc/', role: 'admin' },
  { prefix: '/api/v1/tapsecure/', role: 'admin' },
]

export function getRequiredRoleForApiPath(pathname: string): UserRole | null {
  const match = API_ROLE_RULES.find((rule) => pathname.startsWith(rule.prefix))
  return match?.role ?? null
}
