import { Context, Next } from 'hono';
import { createApiResponse } from '@/utils/helpers';
import { verifyToken } from '@/utils/auth';
import { getUserById, validateSession } from '@/services/authService';
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

    // First check if session exists and is valid
    const isSessionValid = await validateSession(token);
    if (!isSessionValid) {
      return c.json(
        createApiResponse('error', null, 'Session expired or invalid'),
        401
      );
    }

    // Then verify JWT token
    const decodedUser = verifyToken(token);
    if (!decodedUser) {
      return c.json(
        createApiResponse('error', null, 'Invalid or expired token'),
        401
      );
    }

    // Fetch user from database to ensure they still exist and get latest data
    const user = await getUserById(decodedUser.id);
    if (!user) {
      return c.json(createApiResponse('error', null, 'User not found'), 404);
    }

    // Add user and token to context
    c.set('user', user);
    c.set('token', token as any); // Fix: Cast token to any for Hono context
    await next();
  } catch {
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
