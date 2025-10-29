import { Hono } from 'hono';
import * as recipeController from '@/controllers/recipeController';
import { authMiddleware, chefOrAdmin } from '@/middlewares/auth';
import { uploadRateLimitMiddleware } from '@/middlewares/rateLimit';

const recipeRoutes = new Hono();

// POST /recipes/upload-image - Upload recipe image (CHEF or ADMIN only)
recipeRoutes.post(
  '/upload-image',
  uploadRateLimitMiddleware,
  authMiddleware,
  chefOrAdmin,
  recipeController.uploadImage
);

// POST /recipes - Submit a new recipe (CHEF or ADMIN only)
recipeRoutes.post(
  '/',
  authMiddleware,
  chefOrAdmin,
  recipeController.submitRecipe
);

// GET /recipes/:id - Get recipe by ID (Authenticated users)
recipeRoutes.get('/:id', authMiddleware, recipeController.getRecipeById);

// DELETE /recipes/:id - Delete recipe (CHEF can delete own, ADMIN can delete any)
recipeRoutes.delete(
  '/:id',
  authMiddleware,
  chefOrAdmin,
  recipeController.deleteRecipe
);

// TODO: GET /recipes/search - Search recipes (to be implemented)
// TODO: GET /recipes - Browse and filter recipes (to be implemented)
// TODO: GET /recipes/recommendations - Personalized recommendations (to be implemented)
// TODO: PUT /recipes/:id - Update recipe (to be implemented)
// TODO: DELETE /recipes/:id - Delete recipe (to be implemented)

export default recipeRoutes;
