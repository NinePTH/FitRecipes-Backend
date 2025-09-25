import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Configuration
import config from '@/config';

// Routes
import authRoutes from '@/routes/auth';
import recipeRoutes from '@/routes/recipe';
import adminRoutes from '@/routes/admin';
import communityRoutes from '@/routes/community';

// Middlewares
import { errorHandler, notFoundHandler } from '@/middlewares/common';
import { rateLimitMiddleware } from '@/middlewares/rateLimit';
import { authMiddleware, adminOnly } from '@/middlewares/auth';

// Utils
import { createApiResponse } from '@/utils/helpers';

const app = new Hono();

// Global middlewares
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', errorHandler);

// CORS configuration
app.use(
  '*',
  cors({
    origin: origin => {
      const allowedOrigins = config.security.corsOrigin.split(',') || [
        'http://localhost:3001',
      ];
      return allowedOrigins.includes(origin || '') ? origin : null;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Rate limiting
app.use(
  '*',
  rateLimitMiddleware(
    config.security.rateLimitWindowMs,
    config.security.rateLimitMaxRequests
  )
);

// Health check endpoint
app.get('/health', async c => {
  return c.json(
    createApiResponse('success', {
      status: 'healthyzzzzzzzz',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  );
});

// API versioning
const v1 = new Hono();

// Mount routes
v1.route('/auth', authRoutes);
v1.route('/recipes', recipeRoutes);
v1.route('/community', communityRoutes);

// Protected admin routes
v1.use('/admin/*', authMiddleware);
v1.use('/admin/*', adminOnly);
v1.route('/admin', adminRoutes);

// Mount v1 API
app.route('/api/v1', v1);

// 404 handler
app.notFound(notFoundHandler);

export default {
  port: config.port,
  fetch: app.fetch,
};

// Start server if this file is run directly
// Note: Bun will handle the server startup
// eslint-disable-next-line no-console
console.log(`🚀 FitRecipes Backend API starting on port ${config.port}`);
// eslint-disable-next-line no-console
console.log(`📊 Health check: http://localhost:${config.port}/health`);
// eslint-disable-next-line no-console
console.log(`🔗 API base URL: http://localhost:${config.port}/api/v1`);
