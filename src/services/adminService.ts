import { prisma } from '@/utils/database';
import { UserRole } from '@prisma/client';

/**
 * Create audit log entry for admin actions
 */
async function createAuditLog(
  action: string,
  adminId: string,
  targetType: 'user' | 'recipe' | 'comment',
  targetId: string,
  targetName?: string,
  reason?: string,
  details?: object,
  ipAddress?: string
) {
  return prisma.auditLog.create({
    data: {
      action,
      adminId,
      targetType,
      targetId,
      targetName,
      reason,
      details: details || {},
      ipAddress,
    },
  });
}

/**
 * Get all users with filtering, search, and pagination
 */
export async function getAllUsers(
  page = 1,
  limit = 20,
  search?: string,
  role?: UserRole,
  status?: 'active' | 'banned',
  sortBy: 'createdAt' | 'email' | 'firstName' | 'lastName' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status === 'banned') {
    where.isBanned = true;
  } else if (status === 'active') {
    where.isBanned = false;
  }

  // Fetch users and total count in parallel
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        termsAccepted: true,
        isBanned: true,
        bannedAt: true,
        bannedBy: true,
        banReason: true,
        createdAt: true,
        lastLoginAt: true,
        googleId: true,
        oauthProvider: true,
        _count: {
          select: {
            recipes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Format response
  const formattedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isOAuthUser: !!user.googleId || !!user.oauthProvider,
    termsAccepted: user.termsAccepted,
    emailVerified: user.isEmailVerified,
    isBanned: user.isBanned,
    bannedAt: user.bannedAt?.toISOString(),
    bannedBy: user.bannedBy,
    banReason: user.banReason,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    recipeCount: user._count.recipes,
    commentCount: user._count.comments,
  }));

  return {
    users: formattedUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get detailed user information
 */
export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true,
      termsAccepted: true,
      isBanned: true,
      bannedAt: true,
      bannedBy: true,
      banReason: true,
      createdAt: true,
      lastLoginAt: true,
      googleId: true,
      oauthProvider: true,
      recipes: {
        select: {
          id: true,
          status: true,
          averageRating: true,
          totalRatings: true,
        },
      },
      comments: {
        select: { id: true },
      },
      ratings: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate statistics
  const recipesSubmitted = user.recipes.length;
  const recipesApproved = user.recipes.filter(
    r => r.status === 'APPROVED'
  ).length;
  const recipesPending = user.recipes.filter(
    r => r.status === 'PENDING'
  ).length;
  const recipesRejected = user.recipes.filter(
    r => r.status === 'REJECTED'
  ).length;
  // Only calculate average from recipes that have ratings
  const recipesWithRatings = user.recipes.filter(r => r.totalRatings > 0);
  const averageRecipeRating =
    recipesWithRatings.length > 0
      ? recipesWithRatings.reduce((sum, r) => sum + r.averageRating, 0) /
        recipesWithRatings.length
      : 0;

  // Get recent activity
  const recentComments = await prisma.comment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      recipe: { select: { title: true } },
    },
  });

  const recentRatings = await prisma.rating.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      rating: true,
      recipe: { select: { title: true } },
    },
  });

  const recentRecipes = user.recipes.slice(0, 5);

  const recentActivity = [
    ...recentRecipes.map(r => ({
      type: 'recipe_submitted' as const,
      timestamp: user.createdAt.toISOString(), // Simplified, should use actual submission time
      details: `Submitted recipe ${r.id}`,
    })),
    ...recentComments.map(c => ({
      type: 'comment_posted' as const,
      timestamp: c.createdAt.toISOString(),
      details: `Commented on "${c.recipe.title}"`,
    })),
    ...recentRatings.map(r => ({
      type: 'rating_given' as const,
      timestamp: r.createdAt.toISOString(),
      details: `Rated "${r.recipe.title}" ${r.rating}/5`,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isOAuthUser: !!user.googleId || !!user.oauthProvider,
      termsAccepted: user.termsAccepted,
      emailVerified: user.isEmailVerified,
      isBanned: user.isBanned,
      bannedAt: user.bannedAt?.toISOString(),
      bannedBy: user.bannedBy,
      banReason: user.banReason,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    },
    statistics: {
      recipesSubmitted,
      recipesApproved,
      recipesPending,
      recipesRejected,
      commentsPosted: user.comments.length,
      ratingsGiven: user.ratings.length,
      averageRecipeRating: parseFloat(averageRecipeRating.toFixed(2)),
    },
    recentActivity,
  };
}

/**
 * Ban a user
 */
export async function banUser(
  userId: string,
  adminId: string,
  reason: string,
  ipAddress?: string
) {
  // Validate reason length
  if (reason.length < 10) {
    throw new Error('Ban reason must be at least 10 characters');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isBanned: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isBanned) {
    throw new Error('User is already banned');
  }

  // Ban the user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      bannedAt: new Date(),
      bannedBy: adminId,
      banReason: reason,
    },
  });

  // Create audit log
  await createAuditLog(
    'user_banned',
    adminId,
    'user',
    userId,
    `${user.firstName} ${user.lastName} (${user.email})`,
    reason,
    { userId, userEmail: user.email },
    ipAddress
  );

  // TODO: Invalidate user's JWT tokens (if token blacklist implemented)
  // TODO: Send notification to banned user

  return {
    userId: updatedUser.id,
    isBanned: updatedUser.isBanned,
    bannedAt: updatedUser.bannedAt?.toISOString(),
    bannedBy: updatedUser.bannedBy,
    banReason: updatedUser.banReason,
  };
}

/**
 * Unban a user
 */
export async function unbanUser(
  userId: string,
  adminId: string,
  ipAddress?: string
) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isBanned: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isBanned) {
    throw new Error('User is not banned');
  }

  // Unban the user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
    },
  });

  // Create audit log
  await createAuditLog(
    'user_unbanned',
    adminId,
    'user',
    userId,
    `${user.firstName} ${user.lastName} (${user.email})`,
    undefined,
    { userId, userEmail: user.email },
    ipAddress
  );

  // TODO: Send notification to unbanned user

  return {
    userId: updatedUser.id,
    isBanned: updatedUser.isBanned,
    unbannedAt: new Date().toISOString(),
    unbannedBy: adminId,
  };
}

/**
 * Change user role
 */
export async function changeUserRole(
  userId: string,
  newRole: UserRole,
  adminId: string,
  reason?: string,
  ipAddress?: string
) {
  // Prevent admin from changing own role
  if (userId === adminId) {
    throw new Error('Cannot change your own role');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === newRole) {
    throw new Error('User already has this role');
  }

  // If demoting from admin, check that there's at least one other admin
  if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount <= 1) {
      throw new Error('Cannot demote the last admin');
    }
  }

  const oldRole = user.role;

  // Update user role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // Create audit log
  await createAuditLog(
    'role_changed',
    adminId,
    'user',
    userId,
    `${user.firstName} ${user.lastName} (${user.email})`,
    reason,
    { userId, userEmail: user.email, oldRole, newRole },
    ipAddress
  );

  // TODO: Send notification to user about role change

  return {
    userId: updatedUser.id,
    oldRole,
    newRole: updatedUser.role,
    changedAt: new Date().toISOString(),
    changedBy: adminId,
  };
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  page = 1,
  limit = 20,
  action?: string,
  adminId?: string,
  targetUserId?: string,
  startDate?: string,
  endDate?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (action) {
    where.action = action;
  }

  if (adminId) {
    where.adminId = adminId;
  }

  if (targetUserId) {
    where.targetId = targetUserId;
    where.targetType = 'user';
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = new Date(startDate);
    }
    if (endDate) {
      where.timestamp.lte = new Date(endDate);
    }
  }

  // Fetch logs and total count
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: sortOrder },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Format response
  const formattedLogs = logs.map(log => ({
    id: log.id,
    action: log.action,
    adminId: log.adminId,
    adminName: `${log.admin.firstName} ${log.admin.lastName}`,
    targetType: log.targetType,
    targetId: log.targetId,
    targetName: log.targetName,
    reason: log.reason,
    details: log.details,
    timestamp: log.timestamp.toISOString(),
    ipAddress: log.ipAddress,
  }));

  return {
    logs: formattedLogs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Admin delete recipe (override owner-only restriction)
 */
export async function adminDeleteRecipe(
  recipeId: string,
  adminId: string,
  reason: string,
  ipAddress?: string
) {
  // Validate reason length
  if (!reason || reason.trim().length < 10) {
    throw new Error('Deletion reason must be at least 10 characters long');
  }

  // Check if recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, title: true, authorId: true, imageUrls: true },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Delete recipe (cascade deletes comments, ratings, saved recipes)
  await prisma.recipe.delete({
    where: { id: recipeId },
  });

  // Create audit log
  await createAuditLog(
    'delete_recipe',
    adminId,
    'recipe',
    recipeId,
    recipe.title,
    reason,
    {
      recipeName: recipe.title,
      authorId: recipe.authorId,
      imageUrls: recipe.imageUrls,
    },
    ipAddress
  );

  return {
    recipeId,
    deletedAt: new Date().toISOString(),
    deletedBy: adminId,
    reason,
  };
}

/**
 * Bulk delete recipes
 */
export async function bulkDeleteRecipes(
  recipeIds: string[],
  adminId: string,
  reason: string,
  ipAddress?: string
) {
  // Validate reason length
  if (!reason || reason.trim().length < 10) {
    throw new Error('Deletion reason must be at least 10 characters long');
  }

  if (!recipeIds || recipeIds.length === 0) {
    throw new Error('No recipe IDs provided');
  }

  const results = [];
  let deletedCount = 0;
  let failedCount = 0;

  for (const recipeId of recipeIds) {
    try {
      await adminDeleteRecipe(recipeId, adminId, reason, ipAddress);
      results.push({
        recipeId,
        success: true,
      });
      deletedCount++;
    } catch (error: any) {
      results.push({
        recipeId,
        success: false,
        error: error.message || 'Unknown error',
      });
      failedCount++;
    }
  }

  return {
    deletedCount,
    failedCount,
    results,
  };
}

/**
 * Get all comments with filtering and pagination
 */
export async function getAllComments(
  page = 1,
  limit = 20,
  recipeId?: string,
  userId?: string,
  search?: string,
  sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (recipeId) {
    where.recipeId = recipeId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (search) {
    where.content = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Get total count and comments
  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  const formattedComments = comments.map(comment => ({
    id: comment.id,
    recipeId: comment.recipeId,
    recipeName: comment.recipe.title,
    userId: comment.userId,
    userName: `${comment.user.firstName} ${comment.user.lastName}`,
    userEmail: comment.user.email,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }));

  return {
    comments: formattedComments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Bulk delete comments
 */
export async function bulkDeleteComments(
  commentIds: string[],
  adminId: string,
  reason: string,
  ipAddress?: string
) {
  // Validate reason length
  if (!reason || reason.trim().length < 10) {
    throw new Error('Deletion reason must be at least 10 characters long');
  }

  if (!commentIds || commentIds.length === 0) {
    throw new Error('No comment IDs provided');
  }

  const results = [];
  let deletedCount = 0;
  let failedCount = 0;

  for (const commentId of commentIds) {
    try {
      // Get comment details for audit log
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          content: true,
          userId: true,
          recipeId: true,
          recipe: { select: { title: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Delete comment
      await prisma.comment.delete({
        where: { id: commentId },
      });

      // Create audit log
      await createAuditLog(
        'delete_comment',
        adminId,
        'comment',
        commentId,
        `Comment by ${comment.user.firstName} ${comment.user.lastName}`,
        reason,
        {
          commentText: comment.content.substring(0, 100), // First 100 chars
          userId: comment.userId,
          recipeId: comment.recipeId,
          recipeName: comment.recipe.title,
        },
        ipAddress
      );

      results.push({
        commentId,
        success: true,
      });
      deletedCount++;
    } catch (error: any) {
      results.push({
        commentId,
        success: false,
        error: error.message || 'Unknown error',
      });
      failedCount++;
    }
  }

  return {
    deletedCount,
    failedCount,
    results,
  };
}
