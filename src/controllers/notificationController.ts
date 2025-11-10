import { Context } from 'hono';
import * as NotificationService from '@/services/notificationService';
import { createApiResponse } from '@/utils/helpers';
import { AuthenticatedUser } from '@/types';
import { ZodError, z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const registerFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
  browser: z.string().optional(),
  os: z.string().optional(),
});

const unregisterFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
});

const updatePreferencesSchema = z.object({
  webNotifications: z
    .object({
      recipeApproved: z.boolean().optional(),
      recipeRejected: z.boolean().optional(),
      newComment: z.boolean().optional(),
      highRating: z.boolean().optional(),
      newSubmission: z.boolean().optional(),
    })
    .optional(),
  pushNotifications: z
    .object({
      enabled: z.boolean().optional(),
      recipeApproved: z.boolean().optional(),
      recipeRejected: z.boolean().optional(),
      newComment: z.boolean().optional(),
      highRating: z.boolean().optional(),
      newSubmission: z.boolean().optional(),
    })
    .optional(),
  emailNotifications: z
    .object({
      enabled: z.boolean().optional(),
      recipeApproved: z.boolean().optional(),
      recipeRejected: z.boolean().optional(),
      newComment: z.boolean().optional(),
      digestFrequency: z.enum(['never', 'daily', 'weekly']).optional(),
    })
    .optional(),
});

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
export async function getNotifications(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;

    // Parse query parameters
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);
    const unread = c.req.query('unread') === 'true' ? true : undefined;
    const priority = c.req.query('priority') as
      | 'LOW'
      | 'MEDIUM'
      | 'HIGH'
      | undefined;
    const type = c.req.query('type') as
      | 'SUCCESS'
      | 'ERROR'
      | 'WARNING'
      | 'INFO'
      | undefined;

    const result = await NotificationService.getUserNotifications(
      user.id,
      page,
      limit,
      { unread, priority, type }
    );

    return c.json(createApiResponse('success', result));
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Get unread count
 * GET /api/v1/notifications/unread-count
 */
export async function getUnreadCount(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const count = await NotificationService.getUnreadCount(user.id);

    return c.json(createApiResponse('success', { unreadCount: count }));
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 */
export async function markAsRead(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const notificationId = c.req.param('id');

    const notification = await NotificationService.markAsRead(
      notificationId,
      user.id
    );

    return c.json(
      createApiResponse('success', {
        id: notification.id,
        isRead: notification.isRead,
        readAt: notification.readAt,
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 404);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Mark all as read
 * PUT /api/v1/notifications/mark-all-read
 */
export async function markAllAsRead(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const count = await NotificationService.markAllAsRead(user.id);

    return c.json(
      createApiResponse(
        'success',
        { updatedCount: count },
        'All notifications marked as read'
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Delete notification
 * DELETE /api/v1/notifications/:id
 */
export async function deleteNotification(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const notificationId = c.req.param('id');

    await NotificationService.deleteNotification(notificationId, user.id);

    return c.json(
      createApiResponse('success', null, 'Notification deleted successfully')
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 404);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Clear all notifications
 * DELETE /api/v1/notifications
 */
export async function clearAllNotifications(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const count = await NotificationService.clearAllNotifications(user.id);

    return c.json(
      createApiResponse(
        'success',
        { deletedCount: count },
        'All notifications cleared'
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Get notification preferences
 * GET /api/v1/notifications/preferences
 */
export async function getPreferences(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const preferences = await NotificationService.getUserPreferences(user.id);

    // Format response
    const response = {
      webNotifications: {
        recipeApproved: preferences.webRecipeApproved,
        recipeRejected: preferences.webRecipeRejected,
        newComment: preferences.webNewComment,
        highRating: preferences.webHighRating,
        newSubmission: preferences.webNewSubmission,
      },
      pushNotifications: {
        enabled: preferences.pushEnabled,
        recipeApproved: preferences.pushRecipeApproved,
        recipeRejected: preferences.pushRecipeRejected,
        newComment: preferences.pushNewComment,
        highRating: preferences.pushHighRating,
        newSubmission: preferences.pushNewSubmission,
      },
      emailNotifications: {
        enabled: preferences.emailEnabled,
        recipeApproved: preferences.emailRecipeApproved,
        recipeRejected: preferences.emailRecipeRejected,
        newComment: preferences.emailNewComment,
        digestFrequency: preferences.emailDigestFrequency,
      },
    };

    return c.json(createApiResponse('success', response));
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Update notification preferences
 * PUT /api/v1/notifications/preferences
 */
export async function updatePreferences(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const body = await c.req.json();

    // Validate input
    const validatedData = updatePreferencesSchema.parse(body);

    // Flatten the nested structure for database update
    const updates: any = {};

    if (validatedData.webNotifications) {
      if (validatedData.webNotifications.recipeApproved !== undefined) {
        updates.webRecipeApproved =
          validatedData.webNotifications.recipeApproved;
      }
      if (validatedData.webNotifications.recipeRejected !== undefined) {
        updates.webRecipeRejected =
          validatedData.webNotifications.recipeRejected;
      }
      if (validatedData.webNotifications.newComment !== undefined) {
        updates.webNewComment = validatedData.webNotifications.newComment;
      }
      if (validatedData.webNotifications.highRating !== undefined) {
        updates.webHighRating = validatedData.webNotifications.highRating;
      }
      if (validatedData.webNotifications.newSubmission !== undefined) {
        updates.webNewSubmission = validatedData.webNotifications.newSubmission;
      }
    }

    if (validatedData.pushNotifications) {
      if (validatedData.pushNotifications.enabled !== undefined) {
        updates.pushEnabled = validatedData.pushNotifications.enabled;
      }
      if (validatedData.pushNotifications.recipeApproved !== undefined) {
        updates.pushRecipeApproved =
          validatedData.pushNotifications.recipeApproved;
      }
      if (validatedData.pushNotifications.recipeRejected !== undefined) {
        updates.pushRecipeRejected =
          validatedData.pushNotifications.recipeRejected;
      }
      if (validatedData.pushNotifications.newComment !== undefined) {
        updates.pushNewComment = validatedData.pushNotifications.newComment;
      }
      if (validatedData.pushNotifications.highRating !== undefined) {
        updates.pushHighRating = validatedData.pushNotifications.highRating;
      }
      if (validatedData.pushNotifications.newSubmission !== undefined) {
        updates.pushNewSubmission =
          validatedData.pushNotifications.newSubmission;
      }
    }

    if (validatedData.emailNotifications) {
      if (validatedData.emailNotifications.enabled !== undefined) {
        updates.emailEnabled = validatedData.emailNotifications.enabled;
      }
      if (validatedData.emailNotifications.recipeApproved !== undefined) {
        updates.emailRecipeApproved =
          validatedData.emailNotifications.recipeApproved;
      }
      if (validatedData.emailNotifications.recipeRejected !== undefined) {
        updates.emailRecipeRejected =
          validatedData.emailNotifications.recipeRejected;
      }
      if (validatedData.emailNotifications.newComment !== undefined) {
        updates.emailNewComment = validatedData.emailNotifications.newComment;
      }
      if (validatedData.emailNotifications.digestFrequency !== undefined) {
        updates.emailDigestFrequency =
          validatedData.emailNotifications.digestFrequency;
      }
    }

    await NotificationService.updatePreferences(user.id, updates);

    return c.json(
      createApiResponse('success', null, 'Preferences updated successfully')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return c.json(
        createApiResponse('error', null, 'Validation failed', errors),
        400
      );
    }

    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Register FCM token
 * POST /api/v1/notifications/fcm/register
 */
export async function registerFcmToken(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const body = await c.req.json();

    // Validate input
    const validatedData = registerFcmTokenSchema.parse(body);

    const token = await NotificationService.registerFcmToken(
      user.id,
      validatedData.fcmToken,
      validatedData.browser,
      validatedData.os
    );

    return c.json(
      createApiResponse(
        'success',
        { tokenId: token.id },
        'FCM token registered successfully'
      )
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return c.json(
        createApiResponse('error', null, 'Validation failed', errors),
        400
      );
    }

    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Unregister FCM token
 * DELETE /api/v1/notifications/fcm/unregister
 */
export async function unregisterFcmToken(c: Context): Promise<Response> {
  try {
    const user = c.get('user') as AuthenticatedUser;
    const body = await c.req.json();

    // Validate input
    const validatedData = unregisterFcmTokenSchema.parse(body);

    await NotificationService.unregisterFcmToken(
      validatedData.fcmToken,
      user.id
    );

    return c.json(
      createApiResponse('success', null, 'FCM token removed successfully')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return c.json(
        createApiResponse('error', null, 'Validation failed', errors),
        400
      );
    }

    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 404);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}
