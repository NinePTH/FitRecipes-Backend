import { Context } from 'hono';
import * as analyticsService from '../services/analyticsService';
import { createApiResponse } from '../utils/helpers';

/**
 * Admin Analytics Controller
 * Handles HTTP endpoints for admin dashboard analytics
 */

/**
 * GET /api/v1/admin/analytics/overview
 * Get comprehensive admin dashboard overview statistics
 *
 * Query Parameters:
 * - timeRange: string (optional) - Time range for filtering (e.g., "7d", "30d", "90d", "1y")
 *
 * Response:
 * - users: User statistics by role and status
 * - recipes: Recipe statistics by status
 * - engagement: Engagement metrics (comments, ratings)
 * - topChefs: Top performing chefs by views
 * - recentActivity: Recent platform activities
 */
export const getAdminOverview = async (c: Context) => {
  try {
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

    const overview = await analyticsService.getAdminOverview(
      timeRange as '7d' | '30d' | '90d' | 'all'
    );

    return c.json(
      createApiResponse(
        'success',
        overview,
        'Admin overview retrieved successfully'
      ),
      200
    );
  } catch (error) {
    console.error('Error in getAdminOverview:', error);
    return c.json(
      createApiResponse(
        'error',
        undefined,
        'Failed to retrieve admin overview'
      ),
      500
    );
  }
};

/**
 * GET /api/v1/admin/analytics/recipe-trends
 * Get time-series data for recipe submissions, approvals, and rejections
 *
 * Query Parameters:
 * - timeRange: string (optional) - Time range for filtering (e.g., "7d", "30d", "90d", "1y")
 * - groupBy: "day" | "week" | "month" (optional) - How to group the data (default: "day")
 *
 * Response:
 * - trends: Array of time-series data points
 * - summary: Overall statistics for the period
 */
export const getRecipeTrends = async (c: Context) => {
  try {
    const timeRange = c.req.query('timeRange') || '30d';
    const groupBy =
      (c.req.query('groupBy') as 'day' | 'week' | 'month') || 'day';

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

    // Validate groupBy
    if (!['day', 'week', 'month'].includes(groupBy)) {
      return c.json(
        createApiResponse(
          'error',
          undefined,
          'Invalid groupBy value. Use: day, week, or month'
        ),
        400
      );
    }

    const trends = await analyticsService.getRecipeTrends(
      timeRange as '7d' | '30d' | '90d' | '1y',
      groupBy
    );

    return c.json(
      createApiResponse(
        'success',
        trends,
        'Recipe trends retrieved successfully'
      ),
      200
    );
  } catch (error) {
    console.error('Error in getRecipeTrends:', error);
    return c.json(
      createApiResponse('error', undefined, 'Failed to retrieve recipe trends'),
      500
    );
  }
};

/**
 * GET /api/v1/admin/analytics/user-growth
 * Get time-series data for user registrations and growth
 *
 * Query Parameters:
 * - timeRange: string (optional) - Time range for filtering (e.g., "7d", "30d", "90d", "1y")
 * - groupBy: "day" | "week" | "month" (optional) - How to group the data (default: "day")
 *
 * Response:
 * - trends: Array of time-series data points
 * - summary: Overall growth statistics
 */
export const getUserGrowthTrends = async (c: Context) => {
  try {
    const timeRange = c.req.query('timeRange') || '30d';
    const groupBy =
      (c.req.query('groupBy') as 'day' | 'week' | 'month') || 'day';

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

    // Validate groupBy
    if (!['day', 'week', 'month'].includes(groupBy)) {
      return c.json(
        createApiResponse(
          'error',
          undefined,
          'Invalid groupBy value. Use: day, week, or month'
        ),
        400
      );
    }

    const trends = await analyticsService.getUserGrowthTrends(
      timeRange as '7d' | '30d' | '90d' | '1y',
      groupBy
    );

    return c.json(
      createApiResponse(
        'success',
        trends,
        'User growth trends retrieved successfully'
      ),
      200
    );
  } catch (error) {
    console.error('Error in getUserGrowthTrends:', error);
    return c.json(
      createApiResponse(
        'error',
        undefined,
        'Failed to retrieve user growth trends'
      ),
      500
    );
  }
};
