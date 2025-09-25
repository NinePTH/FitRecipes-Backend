import { Context, Next } from 'hono';
import { createApiResponse } from '@/utils/helpers';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxRequests = 100
) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const clientIp =
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < windowStart) {
        delete store[key];
      }
    });

    // Initialize or get current client data
    if (!store[clientIp]) {
      store[clientIp] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const clientData = store[clientIp];

    // Reset if window has passed
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + windowMs;
    }

    // Check rate limit
    if (clientData.count >= maxRequests) {
      const resetIn = Math.ceil((clientData.resetTime - now) / 1000);

      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', resetIn.toString());

      return c.json(
        createApiResponse('error', null, 'Rate limit exceeded'),
        429
      );
    }

    // Increment counter
    clientData.count++;

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header(
      'X-RateLimit-Remaining',
      (maxRequests - clientData.count).toString()
    );
    c.header(
      'X-RateLimit-Reset',
      Math.ceil((clientData.resetTime - now) / 1000).toString()
    );

    await next();
  };
};
