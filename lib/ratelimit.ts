// lib/ratelimit.ts
// Tiny in-memory sliding-window rate limiter.
//
// NOTE: state lives in-process. Under LiteSpeed the app may run as a few
// worker processes, so the effective limit is (configured limit × workers).
// That's still a solid first line of defence against brute force / email
// flooding. For hard guarantees move this to Redis or a DB-backed counter.

type Hit = { count: number; resetAt: number }

const store = new Map<string, Hit>()

// Opportunistic cleanup so the map doesn't grow unbounded.
function sweep(now: number) {
  if (store.size < 5000) return
  for (const [key, hit] of Array.from(store.entries())) {
    if (now > hit.resetAt) store.delete(key)
  }
}

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfter: number // seconds until the window resets (0 when ok)
}

/**
 * Returns { ok:false } when `key` has been hit more than `max` times within
 * `windowMs`. Each call counts as one hit.
 */
export function rateLimit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now()
  sweep(now)

  const hit = store.get(key)
  if (!hit || now > hit.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfter: 0 }
  }

  hit.count++
  if (hit.count > max) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((hit.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: max - hit.count, retryAfter: 0 }
}

/** Best-effort client IP from proxy headers (LiteSpeed sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
