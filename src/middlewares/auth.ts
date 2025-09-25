import { Context, Next } from 'hono';
import { createApiResponse } from '@/utils/helpers';
import { verifyToken } from '@/utils/auth';
import { UserRole } from '@/types';

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  try {
    const authorization = c.req.header('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return c.json(
        createApiResponse('error', null, 'Authentication required'),
        401
      );
    }

    const token = authorization.split(' ')[1];
    const user = verifyToken(token);

    if (!user) {
      return c.json(
        createApiResponse('error', null, 'Invalid or expired token'),
        401
      );
    }

    // Add user to context
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json(
      createApiResponse('error', null, 'Authentication failed'),
      401
    );
  }
};

/**
 * Authorization middleware for specific roles
 */
export const requireRole = (roles: UserRole[]) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        createApiResponse('error', null, 'Authentication required'),
        401
      );
    }

    if (!roles.includes(user.role)) {
      return c.json(
        createApiResponse('error', null, 'Insufficient permissions'),
        403
      );
    }

    await next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = requireRole([UserRole.ADMIN]);

/**
 * Chef or Admin middleware
 */
export const chefOrAdmin = requireRole([UserRole.CHEF, UserRole.ADMIN]);
