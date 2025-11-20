import { Hono } from 'hono';
import * as recipeController from '@/controllers/recipeController';
import * as adminController from '@/controllers/adminController';
import * as analyticsController from '@/controllers/analyticsController';
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

// GET /admin/recipes/stats - Get approval statistics
adminRoutes.get('/recipes/stats', recipeController.getApprovalStats);

// GET /admin/recipes/:id - Get any recipe (admin view)
adminRoutes.get('/recipes/:id', recipeController.getRecipeByIdAdmin);

// DELETE /admin/recipes/:recipeId - Admin delete recipe
adminRoutes.delete('/recipes/:recipeId', adminController.adminDeleteRecipe);

// POST /admin/recipes/bulk-delete - Bulk delete recipes
adminRoutes.post('/recipes/bulk-delete', adminController.bulkDeleteRecipes);

// User Management Routes
// GET /admin/users - Get all users with filtering
adminRoutes.get('/users', adminController.getAllUsers);

// GET /admin/users/:userId - Get user details
adminRoutes.get('/users/:userId', adminController.getUserDetails);

// PUT /admin/users/:userId/ban - Ban a user
adminRoutes.put('/users/:userId/ban', adminController.banUser);

// PUT /admin/users/:userId/unban - Unban a user
adminRoutes.put('/users/:userId/unban', adminController.unbanUser);

// PUT /admin/users/:userId/role - Change user role
adminRoutes.put('/users/:userId/role', adminController.changeUserRole);

// Audit Logs
// GET /admin/audit-logs - Get audit logs
adminRoutes.get('/audit-logs', adminController.getAuditLogs);

// Comment Moderation Routes
// GET /admin/comments - Get all comments with filtering
adminRoutes.get('/comments', adminController.getAllComments);

// POST /admin/comments/bulk-delete - Bulk delete comments
adminRoutes.post('/comments/bulk-delete', adminController.bulkDeleteComments);

// Analytics Routes
// GET /admin/analytics/overview - Get admin dashboard overview
adminRoutes.get('/analytics/overview', analyticsController.getAdminOverview);

// GET /admin/analytics/recipe-trends - Get recipe submission trends
adminRoutes.get(
  '/analytics/recipe-trends',
  analyticsController.getRecipeTrends
);

// GET /admin/analytics/user-growth - Get user growth trends
adminRoutes.get(
  '/analytics/user-growth',
  analyticsController.getUserGrowthTrends
);

export default adminRoutes;
