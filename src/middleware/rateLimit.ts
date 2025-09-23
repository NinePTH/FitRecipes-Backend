import { Context, Next } from 'hono'
import env from '@/config/env'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

export const rateLimitMiddleware = (windowMs = env.RATE_LIMIT_WINDOW_MS, maxRequests = env.RATE_LIMIT_MAX_REQUESTS) => {
  return async (c: Context, next: Next) => {
    const clientId = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const resetTime = now + windowMs

    // Clean up expired entries
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key)
      }
    }

    const entry = rateLimitStore.get(clientId)

    if (!entry) {
      rateLimitStore.set(clientId, { count: 1, resetTime })
    } else if (entry.resetTime <= now) {
      rateLimitStore.set(clientId, { count: 1, resetTime })
    } else {
      entry.count++
      if (entry.count > maxRequests) {
        return c.json(
          {
            success: false,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            resetTime: entry.resetTime,
          },
          429
        )
      }
    }

    // Set rate limit headers
    const currentEntry = rateLimitStore.get(clientId)!
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - currentEntry.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(currentEntry.resetTime / 1000).toString())

    await next()
  }
}