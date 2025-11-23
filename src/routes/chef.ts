import { Hono } from 'hono';
import * as chefAnalyticsController from '@/controllers/chefAnalyticsController';
import { authMiddleware, chefOrAdmin } from '@/middlewares/auth';

const chefRoutes = new Hono();

// All chef routes require authentication and CHEF or ADMIN role
chefRoutes.use('*', authMiddleware, chefOrAdmin);

// Chef Analytics Routes
// GET /chef/analytics/overview - Get chef's personal dashboard overview
chefRoutes.get('/analytics/overview', chefAnalyticsController.getChefOverview);

// GET /chef/recipes/:recipeId/analytics - Get detailed analytics for a specific recipe
chefRoutes.get(
  '/recipes/:recipeId/analytics',
  chefAnalyticsController.getRecipeAnalytics
);

export default chefRoutes;
