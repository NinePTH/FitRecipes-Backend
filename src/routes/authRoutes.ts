import { Hono } from 'hono'
import { AuthController } from '@/controllers/authController'
import { authMiddleware } from '@/middleware/auth'

const authRoutes = new Hono()

// Public routes
authRoutes.post('/register', AuthController.register)
authRoutes.post('/login', AuthController.login)

// Protected routes
authRoutes.use('/profile', authMiddleware)
authRoutes.get('/profile', AuthController.getProfile)
authRoutes.put('/profile', AuthController.updateProfile)

authRoutes.use('/logout', authMiddleware)
authRoutes.post('/logout', AuthController.logout)

export default authRoutes