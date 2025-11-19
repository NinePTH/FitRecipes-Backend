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
import notificationRoutes from '@/routes/notification';
import savedRecipeRoutes from '@/routes/savedRecipe';
import userRoutes from '@/routes/user';

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
      const corsConfig = config.security.corsOrigin;

      // If wildcard is set, allow all origins
      if (corsConfig === '*') return '*';

      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return '*';

      const allowedOrigins = corsConfig.split(',').map(o => o.trim());
      return allowedOrigins.includes(origin) ? origin : null;
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
      status: 'healthy',
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
v1.route('/recipes', savedRecipeRoutes);
v1.route('/users', userRoutes);
v1.route('/community', communityRoutes);
v1.route('/notifications', notificationRoutes);

// Protected admin routes
v1.use('/admin/*', authMiddleware);
v1.use('/admin/*', adminOnly);
v1.route('/admin', adminRoutes);

// Mount v1 API
app.route('/api/v1', v1);

// 404 handler
app.notFound(notFoundHandler);

// Export app for testing
export { app };

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
