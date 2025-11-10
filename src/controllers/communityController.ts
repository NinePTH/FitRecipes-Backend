import { Context } from 'hono';
import * as CommunityService from '@/services/communityService';
import { ratingSchema, commentSchema } from '@/utils/validation';
import { createApiResponse } from '@/utils/helpers';
import { ZodError } from 'zod';
import { AuthenticatedUser } from '@/types';

// ============================================================================
// RATING CONTROLLERS
// ============================================================================

/**
 * Submit or update a rating for a recipe
 * POST /api/v1/recipes/:recipeId/ratings
 */
export async function submitRating(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('recipeId');
    const body = await c.req.json();

    // Validate input
    const validatedData = ratingSchema.parse(body);

    const result = await CommunityService.submitRating(
      user.id,
      recipeId,
      validatedData.rating
    );

    return c.json(
      createApiResponse('success', result, 'Rating submitted successfully'),
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return c.json(
        createApiResponse('error', null, 'Validation failed', errors),
        400
      );
    }

    if (error instanceof Error) {
      if (error.message === 'You cannot rate your own recipe') {
        return c.json(createApiResponse('error', null, error.message), 403);
      }
      if (error.message === 'Recipe not found or not available for rating') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Get user's rating for a specific recipe
 * GET /api/v1/recipes/:recipeId/ratings/me
 */
export async function getUserRating(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('recipeId');

    const rating = await CommunityService.getUserRating(user.id, recipeId);

    if (!rating) {
      return c.json(
        createApiResponse('success', null, 'No rating found for this recipe'),
        200
      );
    }

    return c.json(
      createApiResponse('success', { rating }, 'Rating retrieved successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Get all ratings for a recipe with pagination
 * GET /api/v1/recipes/:recipeId/ratings
 */
export async function getRecipeRatings(c: Context): Promise<Response> {
  try {
    const recipeId = c.req.param('recipeId');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);

    const result = await CommunityService.getRecipeRatings(
      recipeId,
      page,
      limit
    );

    return c.json(
      createApiResponse('success', result, 'Ratings retrieved successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Delete user's rating for a recipe
 * DELETE /api/v1/recipes/:recipeId/ratings/me
 */
export async function deleteRating(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('recipeId');

    const stats = await CommunityService.deleteRating(user.id, recipeId);

    return c.json(
      createApiResponse(
        'success',
        { recipeStats: stats },
        'Rating deleted successfully'
      ),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No rating found to delete') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

// ============================================================================
// COMMENT CONTROLLERS
// ============================================================================

/**
 * Add a comment to a recipe
 * POST /api/v1/recipes/:recipeId/comments
 */
export async function addComment(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('recipeId');
    const body = await c.req.json();

    // Validate input
    const validatedData = commentSchema.parse(body);

    const comment = await CommunityService.addComment(
      user.id,
      recipeId,
      validatedData.content
    );

    return c.json(
      createApiResponse('success', { comment }, 'Comment added successfully'),
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return c.json(
        createApiResponse('error', null, 'Validation failed', errors),
        400
      );
    }

    if (error instanceof Error) {
      if (
        error.message === 'Recipe not found or not available for commenting'
      ) {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Get comments for a recipe with pagination
 * GET /api/v1/recipes/:recipeId/comments
 */
export async function getRecipeComments(c: Context): Promise<Response> {
  try {
    const recipeId = c.req.param('recipeId');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 50);
    const sortBy = c.req.query('sortBy') || 'createdAt';
    const sortOrder = (c.req.query('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await CommunityService.getRecipeComments(
      recipeId,
      page,
      limit,
      sortBy,
      sortOrder
    );

    return c.json(
      createApiResponse('success', result, 'Comments retrieved successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Update a comment
 * PUT /api/v1/recipes/:recipeId/comments/:commentId
 */
export async function updateComment(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const commentId = c.req.param('commentId');
    const body = await c.req.json();

    // Validate input
    const validatedData = commentSchema.parse(body);

    const comment = await CommunityService.updateComment(
      commentId,
      user.id,
      validatedData.content
    );

    return c.json(
      createApiResponse('success', { comment }, 'Comment updated successfully'),
      200
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return c.json(
        createApiResponse('error', null, 'Validation failed', errors),
        400
      );
    }

    if (error instanceof Error) {
      if (error.message === 'You can only update your own comments') {
        return c.json(createApiResponse('error', null, error.message), 403);
      }
      if (error.message === 'Comment not found') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Delete a comment
 * DELETE /api/v1/recipes/:recipeId/comments/:commentId
 */
export async function deleteComment(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const commentId = c.req.param('commentId');

    // Check if user is admin
    const isAdmin = user.role === 'ADMIN';

    await CommunityService.deleteComment(commentId, user.id, isAdmin);

    return c.json(
      createApiResponse('success', null, 'Comment deleted successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'You can only delete your own comments') {
        return c.json(createApiResponse('error', null, error.message), 403);
      }
      if (error.message === 'Comment not found') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}
