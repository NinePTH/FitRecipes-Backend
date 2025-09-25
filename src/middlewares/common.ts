import { Context, Next } from 'hono';
import { createApiResponse } from '@/utils/helpers';

/**
 * Error handling middleware
 */
export const errorHandler = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  try {
    await next();
  } catch (error) {
    // Log error for debugging (in production, this would be handled by proper logging)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Application Error:', error);
    }

    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 500);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (c: Context): Response => {
  return c.json(createApiResponse('error', null, 'Endpoint not found'), 404);
};

/**
 * CORS middleware
 */
export const corsMiddleware = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  const origin = c.req.header('Origin');
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3001',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  await next();
};
