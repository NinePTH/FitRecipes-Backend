import { Hono } from 'hono';
import * as recipeController from '@/controllers/recipeController';
import { authMiddleware, chefOrAdmin } from '@/middlewares/auth';

const recipeRoutes = new Hono();

// POST /recipes - Submit a new recipe (CHEF or ADMIN only)
recipeRoutes.post(
  '/',
  authMiddleware,
  chefOrAdmin,
  recipeController.submitRecipe
);

// GET /recipes/:id - Get recipe by ID (Authenticated users)
recipeRoutes.get('/:id', authMiddleware, recipeController.getRecipeById);

// TODO: GET /recipes/search - Search recipes (to be implemented)
// TODO: GET /recipes - Browse and filter recipes (to be implemented)
// TODO: GET /recipes/recommendations - Personalized recommendations (to be implemented)
// TODO: PUT /recipes/:id - Update recipe (to be implemented)
// TODO: DELETE /recipes/:id - Delete recipe (to be implemented)

export default recipeRoutes;
