import { Hono } from 'hono'
import authRoutes from './authRoutes'
import recipeRoutes from './recipeRoutes'
import adminRoutes from './adminRoutes'
import categoryRoutes from './categoryRoutes'

const apiRoutes = new Hono()

// Mount all route modules
apiRoutes.route('/auth', authRoutes)
apiRoutes.route('/recipes', recipeRoutes)
apiRoutes.route('/admin', adminRoutes)
apiRoutes.route('/categories', categoryRoutes)

// Health check endpoint
apiRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'FitRecipes Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

export default apiRoutes