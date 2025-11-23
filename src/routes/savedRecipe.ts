import { Hono } from 'hono';
import * as savedRecipeController from '@/controllers/savedRecipeController';
import { authMiddleware } from '@/middlewares/auth';

const savedRecipeRoutes = new Hono();

// POST /recipes/saved/check - Bulk check saved status (must be before /:id routes)
savedRecipeRoutes.post(
  '/saved/check',
  authMiddleware,
  savedRecipeController.bulkCheckSaved
);

// POST /recipes/:id/save - Save a recipe
savedRecipeRoutes.post(
  '/:id/save',
  authMiddleware,
  savedRecipeController.saveRecipe
);

// DELETE /recipes/:id/save - Unsave a recipe
savedRecipeRoutes.delete(
  '/:id/save',
  authMiddleware,
  savedRecipeController.unsaveRecipe
);

// GET /recipes/:id/saved - Check if recipe is saved
savedRecipeRoutes.get(
  '/:id/saved',
  authMiddleware,
  savedRecipeController.checkRecipeSaved
);

export default savedRecipeRoutes;
