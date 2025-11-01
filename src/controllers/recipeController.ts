import { Context } from 'hono';
import * as RecipeService from '@/services/recipeService';
import {
  recipeSchema,
  approveRecipeSchema,
  rejectRecipeSchema,
} from '@/utils/validation';
import { createApiResponse } from '@/utils/helpers';
import { ZodError } from 'zod';
import { AuthenticatedUser } from '@/types';
import { uploadRecipeImage } from '@/utils/imageUpload';

/**
 * Submit a new recipe (CHEF or ADMIN only)
 */
export async function submitRecipe(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const body = await c.req.json();

    // Validate input
    const validatedData = recipeSchema.parse(body);

    // Submit recipe
    const recipe = await RecipeService.submitRecipe(user.id, validatedData);

    return c.json(
      createApiResponse(
        'success',
        { recipe },
        'Recipe submitted successfully and pending approval'
      ),
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
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Update an existing recipe (CHEF can update own, ADMIN can update any)
 * PUT /api/v1/recipes/:id
 */
export async function updateRecipe(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('id');
    const body = await c.req.json();

    // Validate input
    const validatedData = recipeSchema.parse(body);

    // Update recipe
    const recipe = await RecipeService.updateRecipe(
      recipeId,
      user.id,
      user.role,
      validatedData
    );

    return c.json(
      createApiResponse('success', { recipe }, 'Recipe updated successfully'),
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
      if (error.message.includes('Unauthorized')) {
        return c.json(createApiResponse('error', null, error.message), 403);
      }
      if (error.message === 'Recipe not found') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      if (error.message.includes('Cannot update approved recipes')) {
        return c.json(createApiResponse('error', null, error.message), 400);
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
 * Get recipe by ID
 */
export async function getRecipeById(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('id');

    const recipe = await RecipeService.getRecipeById(
      recipeId,
      user.id,
      user.role
    );

    // Format ratings for response
    const ratings = recipe.ratings.map(rating => ({
      id: rating.id,
      userId: rating.userId,
      userName: `${rating.user.firstName} ${rating.user.lastName}`,
      rating: rating.rating,
      createdAt: rating.createdAt,
    }));

    const response = {
      ...recipe,
      ratings,
    };

    return c.json(
      createApiResponse(
        'success',
        { recipe: response },
        'Recipe retrieved successfully'
      ),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Recipe not found') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      if (error.message.includes("don't have permission")) {
        return c.json(createApiResponse('error', null, error.message), 403);
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
 * Get pending recipes (ADMIN only)
 */
export async function getPendingRecipes(c: Context): Promise<Response> {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 100);
    const sortBy = (c.req.query('sortBy') || 'createdAt') as
      | 'createdAt'
      | 'title';
    const sortOrder = (c.req.query('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await RecipeService.getPendingRecipes(
      page,
      limit,
      sortBy,
      sortOrder
    );

    return c.json(
      createApiResponse(
        'success',
        result,
        'Pending recipes retrieved successfully'
      ),
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
 * Approve a recipe (ADMIN only)
 */
export async function approveRecipe(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    // Validate input (optional adminNote)
    const validatedData = approveRecipeSchema.parse(body);

    const recipe = await RecipeService.approveRecipe(
      recipeId,
      user.id,
      validatedData.adminNote
    );

    return c.json(
      createApiResponse('success', { recipe }, 'Recipe approved successfully'),
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
      if (error.message === 'Recipe not found') {
        return c.json(createApiResponse('error', null, error.message), 404);
      }
      if (error.message === 'Recipe is already approved') {
        return c.json(createApiResponse('error', null, error.message), 400);
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
 * Reject a recipe (ADMIN only)
 */
export async function rejectRecipe(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('id');
    const body = await c.req.json();

    // Validate input (reason is required)
    const validatedData = rejectRecipeSchema.parse(body);

    const recipe = await RecipeService.rejectRecipe(
      recipeId,
      user.id,
      validatedData.reason
    );

    return c.json(
      createApiResponse('success', { recipe }, 'Recipe rejected'),
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
      if (error.message === 'Unauthorized: Admin access required') {
        return c.json(createApiResponse('error', null, error.message), 403);
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
 * Upload recipe image (CHEF or ADMIN only)
 * POST /api/v1/recipes/upload-image
 */
export async function uploadImage(c: Context): Promise<Response> {
  try {
    // Get the uploaded file from form data
    const formData = await c.req.formData();
    const imageFile = formData.get('image');

    // Validate that file exists
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json(
        createApiResponse('error', null, 'No image file provided'),
        400
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file metadata
    const mimeType = imageFile.type;
    const filename = imageFile.name;

    // Upload with validation and optimization
    const result = await uploadRecipeImage(buffer, filename, mimeType);

    return c.json(
      createApiResponse('success', result, 'Image uploaded successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a validation error
      if (
        error.message.includes('Invalid file type') ||
        error.message.includes('File size exceeds') ||
        error.message.includes('dimensions')
      ) {
        return c.json(createApiResponse('error', null, error.message), 400);
      }

      // Upload failed
      return c.json(
        createApiResponse(
          'error',
          null,
          'Failed to upload image. Please try again'
        ),
        500
      );
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Delete a recipe (CHEF can delete own, ADMIN can delete any)
 * DELETE /api/v1/recipes/:id
 */
export async function deleteRecipe(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const recipeId = c.req.param('id');

    // Delete recipe (authorization checked in service)
    await RecipeService.deleteRecipe(recipeId, user.id, user.role);

    return c.json(
      createApiResponse('success', null, 'Recipe deleted successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return c.json(createApiResponse('error', null, error.message), 403);
      }
      if (error.message === 'Recipe not found') {
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
 * Get user's own recipes (My Recipes page)
 * GET /api/v1/recipes/my-recipes
 */
export async function getMyRecipes(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const status = c.req.query('status') as
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | undefined;

    // Get user's recipes
    const result = await RecipeService.getMyRecipes(user.id, status);

    return c.json(
      createApiResponse(
        'success',
        result,
        'User recipes retrieved successfully'
      ),
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
 * Get approval statistics (ADMIN only)
 */
export async function getApprovalStats(c: Context): Promise<Response> {
  try {
    const period =
      (c.req.query('period') as 'today' | 'week' | 'month' | 'all') || 'today';

    const stats = await RecipeService.getApprovalStats(period);

    return c.json(
      createApiResponse('success', stats, 'Statistics retrieved successfully'),
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
 * Get recipe by ID - Admin view (can see any status)
 */
export async function getRecipeByIdAdmin(c: Context): Promise<Response> {
  try {
    const recipeId = c.req.param('id');

    const recipe = await RecipeService.getRecipeByIdAdmin(recipeId);

    return c.json(
      createApiResponse('success', { recipe }, 'Recipe retrieved successfully'),
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Recipe not found') {
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
// BROWSE RECIPES
// ============================================================================

export async function browseRecipes(c: Context): Promise<Response> {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '12', 10), 50);
    const sortBy = c.req.query('sortBy') || 'rating';
    const sortOrder = (c.req.query('sortOrder') || 'desc') as 'asc' | 'desc';

    const filters: any = {};
    const mealTypeParam = c.req.queries('mealType');
    if (mealTypeParam && mealTypeParam.length > 0)
      filters.mealType = mealTypeParam;

    const difficultyParam = c.req.queries('difficulty');
    if (difficultyParam && difficultyParam.length > 0)
      filters.difficulty = difficultyParam;

    const cuisineType = c.req.query('cuisineType');
    if (cuisineType) filters.cuisineType = cuisineType;

    const mainIngredient = c.req.query('mainIngredient');
    if (mainIngredient) filters.mainIngredient = mainIngredient;

    const maxPrepTime = c.req.query('maxPrepTime');
    if (maxPrepTime) filters.maxPrepTime = parseInt(maxPrepTime, 10);

    const isVegetarian = c.req.query('isVegetarian');
    if (isVegetarian) filters.isVegetarian = isVegetarian === 'true';

    const isVegan = c.req.query('isVegan');
    if (isVegan) filters.isVegan = isVegan === 'true';

    const isGlutenFree = c.req.query('isGlutenFree');
    if (isGlutenFree) filters.isGlutenFree = isGlutenFree === 'true';

    const isDairyFree = c.req.query('isDairyFree');
    if (isDairyFree) filters.isDairyFree = isDairyFree === 'true';

    const isKeto = c.req.query('isKeto');
    if (isKeto) filters.isKeto = isKeto === 'true';

    const isPaleo = c.req.query('isPaleo');
    if (isPaleo) filters.isPaleo = isPaleo === 'true';

    const result = await RecipeService.browseRecipes(
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    );
    return c.json(
      createApiResponse('success', result, 'Recipes retrieved successfully'),
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

export async function getRecommendedRecipes(c: Context): Promise<Response> {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '12', 10), 50);
    const user = c.get('user') as AuthenticatedUser | undefined;
    const result = await RecipeService.getRecommendedRecipes(limit, user?.id);
    return c.json(
      createApiResponse(
        'success',
        result,
        'Recommendations retrieved successfully'
      ),
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

export async function getTrendingRecipes(c: Context): Promise<Response> {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '12', 10), 50);
    const period = (c.req.query('period') || '7d') as '7d' | '30d';
    const result = await RecipeService.getTrendingRecipes(limit, period);
    return c.json(
      createApiResponse(
        'success',
        result,
        'Trending recipes retrieved successfully'
      ),
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

export async function getNewRecipes(c: Context): Promise<Response> {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '12', 10), 50);
    const result = await RecipeService.getNewRecipes(limit);
    return c.json(
      createApiResponse(
        'success',
        result,
        'New recipes retrieved successfully'
      ),
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
