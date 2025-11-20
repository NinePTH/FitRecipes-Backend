import type { Context } from 'hono';
import * as adminService from '@/services/adminService';
import { createApiResponse } from '@/utils/helpers';
import { UserRole } from '@prisma/client';

/**
 * GET /admin/users - Get all users with filtering
 */
export async function getAllUsers(c: Context) {
  const query = c.req.query();

  const page = query.page ? parseInt(query.page) : 1;
  const limit = Math.min(parseInt(query.limit || '20'), 100);
  const search = query.search;
  const role = query.role as UserRole | undefined;
  const status = query.status as 'active' | 'banned' | undefined;
  const sortBy = (query.sortBy || 'createdAt') as
    | 'createdAt'
    | 'email'
    | 'firstName'
    | 'lastName';
  const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

  try {
    const result = await adminService.getAllUsers(
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder
    );

    return c.json(createApiResponse('success', result), 200);
  } catch (error: any) {
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * GET /admin/users/:userId - Get user details
 */
export async function getUserDetails(c: Context) {
  const userId = c.req.param('userId');

  try {
    const result = await adminService.getUserDetails(userId);
    return c.json(createApiResponse('success', result), 200);
  } catch (error: any) {
    if (error.message === 'User not found') {
      return c.json(createApiResponse('error', null, error.message), 404);
    }
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * PUT /admin/users/:userId/ban - Ban a user
 */
export async function banUser(c: Context) {
  const userId = c.req.param('userId');
  const admin = c.get('user');
  const body = await c.req.json();
  const ipAddress =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  if (!body.reason || body.reason.length < 10) {
    return c.json(
      createApiResponse(
        'error',
        null,
        'Ban reason must be at least 10 characters'
      ),
      400
    );
  }

  try {
    const result = await adminService.banUser(
      userId,
      admin.id,
      body.reason,
      ipAddress
    );

    return c.json(
      createApiResponse('success', result, 'User banned successfully'),
      200
    );
  } catch (error: any) {
    if (error.message === 'User not found') {
      return c.json(createApiResponse('error', null, error.message), 404);
    }
    if (error.message === 'User is already banned') {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * PUT /admin/users/:userId/unban - Unban a user
 */
export async function unbanUser(c: Context) {
  const userId = c.req.param('userId');
  const admin = c.get('user');
  const ipAddress =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  try {
    const result = await adminService.unbanUser(userId, admin.id, ipAddress);

    return c.json(
      createApiResponse('success', result, 'User unbanned successfully'),
      200
    );
  } catch (error: any) {
    if (error.message === 'User not found') {
      return c.json(createApiResponse('error', null, error.message), 404);
    }
    if (error.message === 'User is not banned') {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * PUT /admin/users/:userId/role - Change user role
 */
export async function changeUserRole(c: Context) {
  const userId = c.req.param('userId');
  const admin = c.get('user');
  const body = await c.req.json();
  const ipAddress =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  const validRoles: UserRole[] = ['USER', 'CHEF', 'ADMIN'];
  if (!body.newRole || !validRoles.includes(body.newRole)) {
    return c.json(
      createApiResponse(
        'error',
        null,
        'Invalid role. Must be USER, CHEF, or ADMIN'
      ),
      400
    );
  }

  try {
    const result = await adminService.changeUserRole(
      userId,
      body.newRole as UserRole,
      admin.id,
      body.reason,
      ipAddress
    );

    return c.json(
      createApiResponse('success', result, 'User role updated successfully'),
      200
    );
  } catch (error: any) {
    if (error.message === 'User not found') {
      return c.json(createApiResponse('error', null, error.message), 404);
    }
    if (
      error.message === 'Cannot change your own role' ||
      error.message === 'Cannot demote the last admin' ||
      error.message === 'User already has this role'
    ) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * GET /admin/audit-logs - Get audit logs
 */
export async function getAuditLogs(c: Context) {
  const query = c.req.query();

  const page = query.page ? parseInt(query.page) : 1;
  const limit = Math.min(parseInt(query.limit || '20'), 100);
  const action = query.action;
  const adminId = query.adminId;
  const targetUserId = query.targetUserId;
  const startDate = query.startDate;
  const endDate = query.endDate;
  const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

  try {
    const result = await adminService.getAuditLogs(
      page,
      limit,
      action,
      adminId,
      targetUserId,
      startDate,
      endDate,
      sortOrder
    );

    return c.json(createApiResponse('success', result), 200);
  } catch (error: any) {
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * DELETE /admin/recipes/:recipeId - Admin delete recipe
 */
export async function adminDeleteRecipe(c: Context) {
  const recipeId = c.req.param('recipeId');
  const admin = c.get('user');
  const body = await c.req.json();
  const reason = body.reason;
  const ipAddress =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  if (!reason || reason.trim().length < 10) {
    return c.json(
      createApiResponse(
        'error',
        null,
        'Deletion reason must be at least 10 characters long'
      ),
      400
    );
  }

  try {
    const result = await adminService.adminDeleteRecipe(
      recipeId,
      admin.id,
      reason,
      ipAddress
    );

    return c.json(
      createApiResponse('success', result, 'Recipe deleted successfully'),
      200
    );
  } catch (error: any) {
    const statusCode = error.message === 'Recipe not found' ? 404 : 500;
    return c.json(createApiResponse('error', null, error.message), statusCode);
  }
}

/**
 * POST /admin/recipes/bulk-delete - Bulk delete recipes
 */
export async function bulkDeleteRecipes(c: Context) {
  const admin = c.get('user');
  const body = await c.req.json();
  const { recipeIds, reason } = body;
  const ipAddress =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return c.json(
      createApiResponse('error', null, 'Recipe IDs array is required'),
      400
    );
  }

  if (!reason || reason.trim().length < 10) {
    return c.json(
      createApiResponse(
        'error',
        null,
        'Deletion reason must be at least 10 characters long'
      ),
      400
    );
  }

  try {
    const result = await adminService.bulkDeleteRecipes(
      recipeIds,
      admin.id,
      reason,
      ipAddress
    );

    return c.json(
      createApiResponse('success', result, 'Bulk delete completed'),
      200
    );
  } catch (error: any) {
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * GET /admin/comments - Get all comments
 */
export async function getAllComments(c: Context) {
  const query = c.req.query();

  const page = query.page ? parseInt(query.page) : 1;
  const limit = Math.min(parseInt(query.limit || '20'), 100);
  const recipeId = query.recipeId;
  const userId = query.userId;
  const search = query.search;
  const sortBy = (query.sortBy || 'createdAt') as 'createdAt' | 'updatedAt';
  const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

  try {
    const result = await adminService.getAllComments(
      page,
      limit,
      recipeId,
      userId,
      search,
      sortBy,
      sortOrder
    );

    return c.json(createApiResponse('success', result), 200);
  } catch (error: any) {
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}

/**
 * POST /admin/comments/bulk-delete - Bulk delete comments
 */
export async function bulkDeleteComments(c: Context) {
  const admin = c.get('user');
  const body = await c.req.json();
  const { commentIds, reason } = body;
  const ipAddress =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
    return c.json(
      createApiResponse('error', null, 'Comment IDs array is required'),
      400
    );
  }

  if (!reason || reason.trim().length < 10) {
    return c.json(
      createApiResponse(
        'error',
        null,
        'Deletion reason must be at least 10 characters long'
      ),
      400
    );
  }

  try {
    const result = await adminService.bulkDeleteComments(
      commentIds,
      admin.id,
      reason,
      ipAddress
    );

    return c.json(
      createApiResponse('success', result, 'Bulk delete completed'),
      200
    );
  } catch (error: any) {
    return c.json(createApiResponse('error', null, error.message), 500);
  }
}
