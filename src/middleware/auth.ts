import { Context, Next } from 'hono'
import { verifyToken, extractTokenFromHeader } from '@/utils/jwt'
import { AuthUser } from '@/types'

// Extend Hono's context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = extractTokenFromHeader(authHeader)
    const payload = verifyToken(token)

    // Set user in context
    c.set('user', {
      id: payload.userId,
      email: payload.email,
      name: '', // Will be populated by the actual user data if needed
      role: payload.role,
    })

    await next()
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
      401
    )
  }
}

export const adminMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user')

  if (!user || user.role !== 'ADMIN') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    )
  }

  await next()
}

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader)
      const payload = verifyToken(token)

      c.set('user', {
        id: payload.userId,
        email: payload.email,
        name: '',
        role: payload.role,
      })
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  await next()
}