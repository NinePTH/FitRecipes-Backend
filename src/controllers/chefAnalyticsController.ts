import { Context } from 'hono';
import * as chefAnalyticsService from '../services/chefAnalyticsService';
import { createApiResponse } from '../utils/helpers';
import { AuthenticatedUser } from '../types';

/**
 * Chef Analytics Controller
 * Handles HTTP endpoints for chef dashboard analytics
 */

/**
 * GET /api/v1/chef/analytics/overview
 * Get chef's personal dashboard overview statistics
 *
 * Query Parameters:
 * - timeRange: string (optional) - Time range for filtering (e.g., "7d", "30d", "90d", "1y")
 *
 * Response:
 * - myRecipes: Chef's recipe statistics by status
 * - performance: Performance metrics (views, ratings, comments)
 * - topRecipes: Chef's top performing recipes
 * - rankings: Chef's rankings among all chefs
 * - recentActivity: Recent activities on chef's recipes
 */
export const getChefOverview = async (c: Context) => {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const chefId = user.id;
    const timeRange = c.req.query('timeRange') || '30d';

    // Validate timeRange format
    if (!/^\d+[dmy]$/.test(timeRange)) {
      return c.json(
        createApiResponse(
          'error',
          undefined,
          'Invalid time range format. Use format: 7d, 30d, 90d, 1y'
        ),
        400
      );
    }

    const overview = await chefAnalyticsService.getChefOverview(
      chefId,
      timeRange as '7d' | '30d' | '90d' | 'all'
    );

    return c.json(
      createApiResponse(
        'success',
        overview,
        'Chef overview retrieved successfully'
      ),
      200
    );
  } catch (error) {
    console.error('Error in getChefOverview:', error);
    return c.json(
      createApiResponse('error', undefined, 'Failed to retrieve chef overview'),
      500
    );
  }
};

/**
 * GET /api/v1/chef/recipes/:recipeId/analytics
 * Get detailed analytics for a specific recipe
 *
 * Path Parameters:
 * - recipeId: string - Recipe ID to get analytics for
 *
 * Query Parameters:
 * - timeRange: string (optional) - Time range for filtering (e.g., "7d", "30d", "90d", "1y")
 *
 * Response:
 * - recipe: Basic recipe information
 * - views: View statistics and trends
 * - ratings: Rating statistics and distribution
 * - comments: Comment statistics and recent comments
 * - engagement: Engagement rates (view-to-rating, view-to-comment)
 */
export const getRecipeAnalytics = async (c: Context) => {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const chefId = user.id;
    const recipeId = c.req.param('recipeId');
    const timeRange = c.req.query('timeRange') || '30d';

    // Validate recipeId
    if (!recipeId) {
      return c.json(
        createApiResponse('error', undefined, 'Recipe ID is required'),
        400
      );
    }

    // Validate timeRange format
    if (!/^\d+[dmy]$/.test(timeRange)) {
      return c.json(
        createApiResponse(
          'error',
          undefined,
          'Invalid time range format. Use format: 7d, 30d, 90d, 1y'
        ),
        400
      );
    }

    const analytics = await chefAnalyticsService.getRecipeAnalytics(
      recipeId,
      chefId,
      timeRange as '7d' | '30d' | '90d' | 'all'
    );

    if (!analytics) {
      return c.json(
        createApiResponse(
          'error',
          undefined,
          'Recipe not found or you do not have permission to view its analytics'
        ),
        404
      );
    }

    return c.json(
      createApiResponse(
        'success',
        analytics,
        'Recipe analytics retrieved successfully'
      ),
      200
    );
  } catch (error) {
    console.error('Error in getRecipeAnalytics:', error);
    return c.json(
      createApiResponse(
        'error',
        undefined,
        'Failed to retrieve recipe analytics'
      ),
      500
    );
  }
};

/**
 * POST /api/v1/recipes/:recipeId/view
 * Track a recipe view (idempotent - 1 view per user/IP per day)
 *
 * Path Parameters:
 * - recipeId: string - Recipe ID to track view for
 *
 * Response:
 * - recorded: boolean - Whether the view was recorded (false if already viewed today)
 * - message: string - Description of the result
 */
export const trackRecipeView = async (c: Context) => {
  try {
    const user = c.get('user') as AuthenticatedUser | undefined;
    const recipeId = c.req.param('id'); // Fixed: route uses :id not :recipeId
    const ipAddress =
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    // Validate recipeId
    if (!recipeId) {
      return c.json(
        createApiResponse('error', undefined, 'Recipe ID is required'),
        400
      );
    }

    const userId = user?.id;
    const result = await chefAnalyticsService.trackRecipeView(
      recipeId,
      userId,
      ipAddress
    );

    return c.json(createApiResponse('success', result, result.message), 200);
  } catch (error) {
    console.error('Error in trackRecipeView:', error);
    return c.json(
      createApiResponse('error', undefined, 'Failed to track recipe view'),
      500
    );
  }
};
