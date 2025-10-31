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
      rating: rating.value,
      comment: rating.comment,
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
