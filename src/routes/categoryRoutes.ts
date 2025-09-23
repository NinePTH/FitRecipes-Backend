import { Hono } from 'hono'
import { CategoryController } from '@/controllers/categoryController'
import { authMiddleware, adminMiddleware } from '@/middleware/auth'

const categoryRoutes = new Hono()

// Public routes
categoryRoutes.get('/', CategoryController.getCategories)
categoryRoutes.get('/:id', CategoryController.getCategoryById)

// Admin-only routes
categoryRoutes.use('/*', authMiddleware, adminMiddleware)
categoryRoutes.post('/', CategoryController.createCategory)
categoryRoutes.put('/:id', CategoryController.updateCategory)
categoryRoutes.delete('/:id', CategoryController.deleteCategory)

export default categoryRoutes