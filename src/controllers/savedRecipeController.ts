import type { Context } from 'hono';
import * as savedRecipeService from '@/services/savedRecipeService';
import { createApiResponse } from '@/utils/helpers';
import { bulkCheckSavedSchema, paginationSchema } from '@/utils/validation';

/**
 * POST /recipes/:recipeId/save - Save a recipe
 */
export async function saveRecipe(c: Context) {
  const user = c.get('user');
  const recipeId = c.req.param('id');

  try {
    const result = await savedRecipeService.saveRecipe(user.id, recipeId);

    return c.json(
      createApiResponse(
        'success',
        result,
        result.alreadySaved
          ? 'Recipe already saved'
          : 'Recipe saved successfully'
      ),
      200
    );
  } catch (error: any) {
    if (error.message === 'Recipe not found') {
      return c.json(createApiResponse('error', null, 'Recipe not found'), 404);
    }
    throw error;
  }
}

/**
 * DELETE /recipes/:recipeId/save - Unsave a recipe
 */
export async function unsaveRecipe(c: Context) {
  const user = c.get('user');
  const recipeId = c.req.param('id');

  try {
    const result = await savedRecipeService.unsaveRecipe(user.id, recipeId);

    return c.json(
      createApiResponse('success', result, 'Recipe removed from saved'),
      200
    );
  } catch (error: any) {
    if (error.message === 'Recipe not found in saved collection') {
      return c.json(
        createApiResponse(
          'error',
          null,
          'Recipe not found in saved collection'
        ),
        404
      );
    }
    throw error;
  }
}

/**
 * GET /users/me/saved-recipes - Get user's saved recipes
 */
export async function getSavedRecipes(c: Context) {
  const user = c.get('user');
  const query = c.req.query();

  const validated = paginationSchema.parse({
    page: query.page ? parseInt(query.page) : 1,
    limit: query.limit ? parseInt(query.limit) : 20,
  });

  const sortBy = query.sortBy || 'savedAt';
  const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

  const result = await savedRecipeService.getSavedRecipes(
    user.id,
    validated.page,
    validated.limit,
    sortBy,
    sortOrder
  );

  return c.json(createApiResponse('success', result), 200);
}

/**
 * GET /recipes/:recipeId/saved - Check if recipe is saved
 */
export async function checkRecipeSaved(c: Context) {
  const user = c.get('user');
  const recipeId = c.req.param('id');

  const result = await savedRecipeService.checkRecipeSaved(user.id, recipeId);

  return c.json(createApiResponse('success', result), 200);
}

/**
 * POST /recipes/saved/check - Bulk check saved status
 */
export async function bulkCheckSaved(c: Context) {
  const user = c.get('user');
  const body = await c.req.json();

  const validated = bulkCheckSavedSchema.parse(body);

  const result = await savedRecipeService.bulkCheckSaved(
    user.id,
    validated.recipeIds
  );

  return c.json(createApiResponse('success', { savedRecipes: result }), 200);
}
