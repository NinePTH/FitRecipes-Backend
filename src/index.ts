import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import env from '@/config/env'
import { corsMiddleware } from '@/middleware/cors'
import { errorHandler } from '@/middleware/errorHandler'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import apiRoutes from '@/routes'

// Create Hono app
const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', corsMiddleware)
app.use('*', errorHandler)
app.use('*', rateLimitMiddleware())

// Mount API routes
app.route('/api', apiRoutes)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to FitRecipes Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth',
      recipes: '/api/recipes',
      categories: '/api/categories',
      admin: '/api/admin',
      health: '/api/health',
    },
  })
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
    },
    404
  )
})

// Start server
const port = env.PORT

console.log(`🚀 FitRecipes Backend starting...`)
console.log(`📡 Server running on port ${port}`)
console.log(`🌍 Environment: ${env.NODE_ENV}`)
console.log(`🔗 API Base URL: http://localhost:${port}/api`)

serve({
  fetch: app.fetch,
  port,
})

export default app