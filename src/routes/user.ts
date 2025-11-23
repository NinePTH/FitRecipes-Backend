import { Hono } from 'hono';
import * as savedRecipeController from '@/controllers/savedRecipeController';
import { authMiddleware } from '@/middlewares/auth';

const userRoutes = new Hono();

// GET /users/me/saved-recipes - Get user's saved recipes
userRoutes.get(
  '/me/saved-recipes',
  authMiddleware,
  savedRecipeController.getSavedRecipes
);

export default userRoutes;
