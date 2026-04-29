// NOTE: In-memory rate limiting does NOT persist across Vercel serverless invocations.
// Each cold start resets the map, so this provides only single-instance protection.
// For production-grade distributed rate limiting, use Upstash Redis or Vercel KV.
const buckets = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitOptions {
  limit: number
  windowMs: number
  keyPrefix?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

function pruneBuckets(now: number) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

const TRUSTED_PROXY_IPS = new Set(
  process.env.TRUSTED_PROXY_IPS?.split(',').map(ip => ip.trim()) || []
)

export function getClientIp(request: Request): string {
  // Only trust X-Forwarded-For and X-Real-IP if request comes from trusted proxy
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  // Check if the direct connection is from a trusted proxy
  const directIp = request.headers.get('x-forwarded-client-ip') ||
                   request.headers.get('x-vercel-forwarded-for') ||
                   realIp

  if (TRUSTED_PROXY_IPS.size > 0 && directIp && TRUSTED_PROXY_IPS.has(directIp)) {
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
  }

  // Fallback: use real IP without trust (for development/non-proxy setups)
  return realIp || 'unknown'
}

export function rateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  pruneBuckets(now)

  const key = `${options.keyPrefix || 'default'}:${getClientIp(request)}`
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs
    buckets.set(key, { count: 1, resetAt })

    return {
      success: true,
      limit: options.limit,
      remaining: Math.max(options.limit - 1, 0),
      resetAt,
    }
  }

  current.count += 1
  buckets.set(key, current)

  const remaining = Math.max(options.limit - current.count, 0)

  return {
    success: current.count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt: current.resetAt,
  }
}

export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
