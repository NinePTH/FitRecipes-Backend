import { Hono } from 'hono';
import * as recipeController from '@/controllers/recipeController';
import * as chefAnalyticsController from '@/controllers/chefAnalyticsController';
import { authMiddleware, chefOrAdmin } from '@/middlewares/auth';
import { uploadRateLimitMiddleware } from '@/middlewares/rateLimit';

const recipeRoutes = new Hono();

// Browse routes (must come before /:id to avoid route conflicts)
recipeRoutes.get('/recommended', recipeController.getRecommendedRecipes);
recipeRoutes.get('/trending', recipeController.getTrendingRecipes);
recipeRoutes.get('/new', recipeController.getNewRecipes);

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

// GET /recipes/my-recipes - Get user's own recipes (CHEF or ADMIN only)
recipeRoutes.get(
  '/my-recipes',
  authMiddleware,
  chefOrAdmin,
  recipeController.getMyRecipes
);

// GET /recipes/:id - Get recipe by ID (Authenticated users)
recipeRoutes.get('/:id', authMiddleware, recipeController.getRecipeById);

// PUT /recipes/:id - Update recipe (CHEF can update own, ADMIN can update any)
recipeRoutes.put(
  '/:id',
  authMiddleware,
  chefOrAdmin,
  recipeController.updateRecipe
);

// DELETE /recipes/:id - Delete recipe (CHEF can delete own, ADMIN can delete any)
// DELETE /recipes/:id - Delete recipe (CHEF can delete own, ADMIN can delete any)
recipeRoutes.delete(
  '/:id',
  authMiddleware,
  chefOrAdmin,
  recipeController.deleteRecipe
);

// POST /recipes/:id/view - Track recipe view (optional auth - allows anonymous)
recipeRoutes.post('/:id/view', chefAnalyticsController.trackRecipeView);

// GET /recipes - Browse recipes with filters (must be last, after specific routes)
recipeRoutes.get('/', recipeController.browseRecipes);

export default recipeRoutes;
