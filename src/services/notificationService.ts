import { prisma } from '@/utils/database';
import { sendFcmNotification } from '@/utils/fcm';
import {
  sendRecipeApprovedEmail,
  sendRecipeRejectedEmail,
  sendNewCommentEmail,
  sendNewSubmissionEmail,
} from '@/utils/email';

// ============================================================================
// TYPES
// ============================================================================

interface CreateNotificationData {
  userId: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recipeId?: string;
  commentId?: string;
  ratingId?: string;
  actorUserId?: string;
  actionType: string;
  actionUrl?: string;
}

// ============================================================================
// CORE NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Create a notification and deliver via enabled channels
 */
export async function createNotification(data: CreateNotificationData) {
  // Create notification record
  const notification = await prisma.notification.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  // Get user preferences
  const preferences = await getUserPreferences(data.userId);

  // Deliver via enabled channels
  await deliverNotification(notification, preferences, data);

  return notification;
}

/**
 * Deliver notification via all enabled channels
 */
async function deliverNotification(
  notification: any,
  preferences: any,
  data: CreateNotificationData
) {
  const eventType = data.actionType;

  // Web notifications are always stored (already done in createNotification)

  // Push notifications (FCM)
  if (preferences.pushEnabled) {
    const shouldSendPush = checkEventPreference(eventType, preferences, 'push');
    if (shouldSendPush) {
      await sendPushNotification(data.userId, notification);
    }
  }

  // Email notifications
  if (preferences.emailEnabled) {
    const shouldSendEmail = checkEventPreference(
      eventType,
      preferences,
      'email'
    );
    if (shouldSendEmail) {
      await sendEmailNotification(notification, data);
    }
  }
}

/**
 * Check if notification should be sent for specific event type
 */
function checkEventPreference(
  eventType: string,
  preferences: any,
  channel: 'push' | 'email'
): boolean {
  const prefix = channel === 'push' ? 'push' : 'email';

  switch (eventType) {
    case 'recipe_approved':
      return preferences[`${prefix}RecipeApproved`];
    case 'recipe_rejected':
      return preferences[`${prefix}RecipeRejected`];
    case 'new_comment':
      return preferences[`${prefix}NewComment`];
    case 'high_rating':
      return preferences[`${prefix}HighRating`];
    case 'new_submission':
      return preferences[`${prefix}NewSubmission`];
    default:
      return false;
  }
}

/**
 * Send push notification via FCM
 */
async function sendPushNotification(userId: string, notification: any) {
  try {
    // Get active FCM tokens for user
    const tokens = await prisma.fcmToken.findMany({
      where: { userId, isActive: true },
      select: { fcmToken: true, id: true },
    });

    if (tokens.length === 0) return;

    // Send to all tokens
    const results = await Promise.allSettled(
      tokens.map(token =>
        sendFcmNotification(token.fcmToken, {
          title: notification.title,
          body: notification.description,
          data: {
            notificationId: notification.id,
            type: notification.type,
            recipeId: notification.recipeId,
            actionUrl: notification.actionUrl,
            priority: notification.priority,
          },
        })
      )
    );

    // Deactivate invalid tokens
    const invalidTokenIds = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          return tokens[index].id;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (invalidTokenIds.length > 0) {
      await prisma.fcmToken.updateMany({
        where: { id: { in: invalidTokenIds } },
        data: { isActive: false },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  notification: any,
  data: CreateNotificationData
) {
  try {
    const user = notification.user;

    switch (data.actionType) {
      case 'recipe_approved':
        if (data.recipeId) {
          const recipe = await prisma.recipe.findUnique({
            where: { id: data.recipeId },
            select: { title: true },
          });
          if (recipe) {
            await sendRecipeApprovedEmail(
              user.email,
              user.firstName,
              recipe.title,
              data.recipeId
            );
          }
        }
        break;

      case 'recipe_rejected':
        if (data.recipeId) {
          const recipe = await prisma.recipe.findUnique({
            where: { id: data.recipeId },
            select: { title: true, rejectionReason: true },
          });
          if (recipe) {
            await sendRecipeRejectedEmail(
              user.email,
              user.firstName,
              recipe.title,
              recipe.rejectionReason || 'No reason provided',
              data.recipeId
            );
          }
        }
        break;

      case 'new_comment':
        if (data.recipeId && data.commentId && data.actorUserId) {
          const [recipe, comment, actor] = await Promise.all([
            prisma.recipe.findUnique({
              where: { id: data.recipeId },
              select: { title: true },
            }),
            prisma.comment.findUnique({
              where: { id: data.commentId },
              select: { content: true },
            }),
            prisma.user.findUnique({
              where: { id: data.actorUserId },
              select: { firstName: true, lastName: true },
            }),
          ]);

          if (recipe && comment && actor) {
            await sendNewCommentEmail(
              user.email,
              user.firstName,
              `${actor.firstName} ${actor.lastName}`,
              recipe.title,
              comment.content,
              data.recipeId,
              data.commentId
            );
          }
        }
        break;

      case 'new_submission':
        if (data.recipeId && data.actorUserId) {
          const [recipe, chef] = await Promise.all([
            prisma.recipe.findUnique({
              where: { id: data.recipeId },
              select: { title: true, mainIngredient: true, cuisineType: true },
            }),
            prisma.user.findUnique({
              where: { id: data.actorUserId },
              select: { firstName: true, lastName: true },
            }),
          ]);

          if (recipe && chef) {
            await sendNewSubmissionEmail(
              user.email,
              `${chef.firstName} ${chef.lastName}`,
              recipe.title,
              recipe.mainIngredient,
              recipe.cuisineType || 'N/A',
              data.recipeId
            );
          }
        }
        break;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send email notification:', error);
  }
}

// ============================================================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================================================

/**
 * Notify recipe author when recipe is approved
 */
export async function notifyRecipeApproved(
  recipeId: string,
  authorId: string,
  recipeTitle: string,
  adminId: string
) {
  await createNotification({
    userId: authorId,
    type: 'SUCCESS',
    title: 'Recipe Approved! 🎉',
    description: `Your recipe "${recipeTitle}" has been approved and is now live.`,
    priority: 'HIGH',
    recipeId,
    actorUserId: adminId,
    actionType: 'recipe_approved',
    actionUrl: `/recipe/${recipeId}`,
  });
}

/**
 * Notify recipe author when recipe is rejected
 */
export async function notifyRecipeRejected(
  recipeId: string,
  authorId: string,
  recipeTitle: string,
  rejectionReason: string,
  adminId: string
) {
  await createNotification({
    userId: authorId,
    type: 'ERROR',
    title: 'Recipe Rejected',
    description: `Your recipe "${recipeTitle}" was rejected. Reason: ${rejectionReason}`,
    priority: 'HIGH',
    recipeId,
    actorUserId: adminId,
    actionType: 'recipe_rejected',
    actionUrl: `/my-recipes`,
  });
}

/**
 * Notify recipe author when someone comments
 */
export async function notifyNewComment(
  recipeId: string,
  commentId: string,
  authorId: string,
  commenterId: string,
  commenterName: string,
  recipeTitle: string
) {
  // Don't notify if user comments on their own recipe
  if (authorId === commenterId) return;

  await createNotification({
    userId: authorId,
    type: 'INFO',
    title: 'New Comment',
    description: `${commenterName} commented on your recipe "${recipeTitle}"`,
    priority: 'MEDIUM',
    recipeId,
    commentId,
    actorUserId: commenterId,
    actionType: 'new_comment',
    actionUrl: `/recipe/${recipeId}#comment-${commentId}`,
  });
}

/**
 * Notify recipe author when someone gives 5-star rating
 */
export async function notifyHighRating(
  recipeId: string,
  ratingId: string,
  authorId: string,
  raterId: string,
  raterName: string,
  recipeTitle: string
) {
  // Don't notify if user rates their own recipe (shouldn't happen)
  if (authorId === raterId) return;

  await createNotification({
    userId: authorId,
    type: 'SUCCESS',
    title: '5-Star Rating! ⭐',
    description: `${raterName} gave your recipe "${recipeTitle}" 5 stars!`,
    priority: 'LOW',
    recipeId,
    ratingId,
    actorUserId: raterId,
    actionType: 'high_rating',
    actionUrl: `/recipe/${recipeId}`,
  });
}

/**
 * Notify all admins when new recipe is submitted
 */
export async function notifyNewRecipeSubmission(
  recipeId: string,
  recipeTitle: string,
  chefId: string,
  chefName: string
) {
  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  // Create notification for each admin
  await Promise.all(
    admins.map(admin =>
      createNotification({
        userId: admin.id,
        type: 'INFO',
        title: 'New Recipe Submitted',
        description: `${chefName} submitted "${recipeTitle}" for approval`,
        priority: 'HIGH',
        recipeId,
        actorUserId: chefId,
        actionType: 'new_submission',
        actionUrl: `/admin`,
      })
    )
  );
}

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  filters?: {
    unread?: boolean;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  }
) {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
    isDeleted: false,
  };

  if (filters?.unread !== undefined) {
    where.isRead = !filters.unread;
  }

  if (filters?.priority) {
    where.priority = filters.priority;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false, isDeleted: false },
    }),
  ]);

  // Fetch related data
  const notificationsWithData = await Promise.all(
    notifications.map(async notification => {
      const result: any = {
        ...notification,
        recipe: null,
        actor: null,
      };

      // Fetch recipe if exists
      if (notification.recipeId) {
        result.recipe = await prisma.recipe.findUnique({
          where: { id: notification.recipeId },
          select: { id: true, title: true, imageUrls: true },
        });
      }

      // Fetch actor if exists
      if (notification.actorUserId) {
        result.actor = await prisma.user.findUnique({
          where: { id: notification.actorUserId },
          select: { id: true, firstName: true, lastName: true },
        });
      }

      return result;
    })
  );

  return {
    notifications: notificationsWithData,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    unreadCount,
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false, isDeleted: false },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false, isDeleted: false },
    data: { isRead: true, readAt: new Date() },
  });

  return result.count;
}

/**
 * Delete notification (soft delete)
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isDeleted: true },
  });
}

/**
 * Clear all notifications (soft delete)
 */
export async function clearAllNotifications(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isDeleted: false },
    data: { isDeleted: true },
  });

  return result.count;
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getUserPreferences(userId: string) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if none exist
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: { userId },
    });
  }

  return preferences;
}

/**
 * Update notification preferences
 */
export async function updatePreferences(userId: string, updates: any) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates },
  });
}

// ============================================================================
// FCM TOKEN MANAGEMENT
// ============================================================================

/**
 * Register FCM token for user
 */
export async function registerFcmToken(
  userId: string,
  fcmToken: string,
  browser?: string,
  os?: string
) {
  // Check if token already exists
  const existing = await prisma.fcmToken.findUnique({
    where: { fcmToken },
  });

  if (existing) {
    // Update existing token
    return prisma.fcmToken.update({
      where: { fcmToken },
      data: {
        userId,
        browser,
        os,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
  }

  // Create new token
  return prisma.fcmToken.create({
    data: {
      userId,
      fcmToken,
      browser,
      os,
    },
  });
}

/**
 * Unregister FCM token
 */
export async function unregisterFcmToken(fcmToken: string, userId: string) {
  const token = await prisma.fcmToken.findUnique({
    where: { fcmToken },
  });

  if (!token || token.userId !== userId) {
    throw new Error('Token not found');
  }

  return prisma.fcmToken.delete({
    where: { fcmToken },
  });
}

/**
 * Cleanup expired FCM tokens (run periodically)
 */
export async function cleanupExpiredTokens() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return prisma.fcmToken.deleteMany({
    where: {
      OR: [{ isActive: false }, { lastUsedAt: { lt: thirtyDaysAgo } }],
    },
  });
}
