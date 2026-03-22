import sql from '@/lib/db'

// Simple in-memory sliding window rate limiter.
// Fallback when DB-backed limiter is unavailable.
const store = new Map<string, number[]>()

function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  // Evict stale keys to prevent unbounded Map growth
  if (timestamps.length === 0) store.delete(key)

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0]
    return { allowed: false, retryAfterMs: oldest + windowMs - now }
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true, retryAfterMs: 0 }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = headers.get('x-real-ip')
  return realIp?.trim() || 'unknown'
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = Date.now()
  const windowStartMs = Math.floor(now / windowMs) * windowMs
  const windowStart = new Date(windowStartMs)

  try {
    const rows = await sql`
      INSERT INTO rate_limits (rate_key, window_start, count, updated_at)
      VALUES (${key}, ${windowStart}, 1, NOW())
      ON CONFLICT (rate_key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start = EXCLUDED.window_start THEN rate_limits.count + 1
          ELSE 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start = EXCLUDED.window_start THEN rate_limits.window_start
          ELSE EXCLUDED.window_start
        END,
        updated_at = NOW()
      RETURNING count, window_start
    `

    const count = Number(rows[0]?.count ?? 0)
    const activeWindow = rows[0]?.window_start
    const activeWindowMs = activeWindow ? new Date(activeWindow).getTime() : windowStartMs
    const allowed = count <= maxRequests
    const retryAfterMs = allowed ? 0 : Math.max(0, activeWindowMs + windowMs - now)
    return { allowed, retryAfterMs }
  } catch (err) {
    console.error('Rate limit DB error:', err)
    return checkRateLimitMemory(key, maxRequests, windowMs)
  }
}
