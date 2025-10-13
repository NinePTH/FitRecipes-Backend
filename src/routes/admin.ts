import { Hono } from 'hono';
import * as recipeController from '@/controllers/recipeController';
import { authMiddleware, adminOnly } from '@/middlewares/auth';

const adminRoutes = new Hono();

// All admin routes require authentication and ADMIN role
adminRoutes.use('*', authMiddleware, adminOnly);

// GET /admin/recipes/pending - Get pending recipes for approval
adminRoutes.get('/recipes/pending', recipeController.getPendingRecipes);

// PUT /admin/recipes/:id/approve - Approve a recipe
adminRoutes.put('/recipes/:id/approve', recipeController.approveRecipe);

// PUT /admin/recipes/:id/reject - Reject a recipe
adminRoutes.put('/recipes/:id/reject', recipeController.rejectRecipe);

// TODO: GET /admin/users - User management (to be implemented)
// TODO: PUT /admin/users/:id/role - Update user role (to be implemented)
// TODO: GET /admin/stats - Platform statistics (to be implemented)

export default adminRoutes;
