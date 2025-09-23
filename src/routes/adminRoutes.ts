import { Hono } from 'hono'
import { AdminController } from '@/controllers/adminController'
import { authMiddleware, adminMiddleware } from '@/middleware/auth'

const adminRoutes = new Hono()

// All admin routes require authentication and admin role
adminRoutes.use('/*', authMiddleware, adminMiddleware)

// Recipe management routes
adminRoutes.get('/recipes/pending', AdminController.getPendingRecipes)
adminRoutes.post('/recipes/:recipeId/approve', AdminController.approveRecipe)
adminRoutes.post('/recipes/:recipeId/reject', AdminController.rejectRecipe)

export default adminRoutes