import { prisma } from '@/utils/database';
import * as NotificationService from '@/services/notificationService';

// ============================================================================
// RATING SERVICE FUNCTIONS
// ============================================================================

/**
 * Submit or update a rating for a recipe (upsert)
 */
export async function submitRating(
  userId: string,
  recipeId: string,
  rating: number
) {
  // Check if recipe exists and is approved
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      status: true,
      authorId: true,
      title: true,
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found or not available for rating');
  }

  if (recipe.status !== 'APPROVED') {
    throw new Error('Recipe not found or not available for rating');
  }

  // Check if user is trying to rate their own recipe
  if (recipe.authorId === userId) {
    throw new Error('You cannot rate your own recipe');
  }

  // Upsert rating
  const upsertedRating = await prisma.rating.upsert({
    where: {
      userId_recipeId: { userId, recipeId },
    },
    update: {
      rating,
      updatedAt: new Date(),
    },
    create: {
      userId,
      recipeId,
      rating,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  // Recalculate recipe statistics
  const stats = await recalculateRecipeRatingStats(recipeId);

  // Notify recipe author if it's a 5-star rating
  if (rating === 5) {
    const raterName = `${upsertedRating.user.firstName} ${upsertedRating.user.lastName}`;
    await NotificationService.notifyHighRating(
      recipeId,
      upsertedRating.id,
      recipe.authorId,
      userId,
      raterName,
      recipe.title
    );
  }

  return {
    rating: upsertedRating,
    recipeStats: stats,
  };
}

/**
 * Get user's rating for a specific recipe
 */
export async function getUserRating(userId: string, recipeId: string) {
  const rating = await prisma.rating.findUnique({
    where: {
      userId_recipeId: { userId, recipeId },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return rating;
}

/**
 * Get all ratings for a recipe with pagination
 */
export async function getRecipeRatings(
  recipeId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  // Get ratings
  const ratings = await prisma.rating.findMany({
    where: { recipeId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  // Get total count
  const total = await prisma.rating.count({ where: { recipeId } });

  // Get rating distribution
  const distribution = await prisma.rating.groupBy({
    by: ['rating'],
    where: { recipeId },
    _count: { rating: true },
  });

  // Format distribution as { "1": count, "2": count, ... }
  const formattedDistribution: Record<string, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };
  distribution.forEach(item => {
    formattedDistribution[item.rating.toString()] = item._count.rating;
  });

  // Get recipe stats
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { averageRating: true, totalRatings: true },
  });

  return {
    ratings,
    stats: {
      averageRating: recipe?.averageRating || 0,
      totalRatings: recipe?.totalRatings || 0,
      distribution: formattedDistribution,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Delete user's rating for a recipe
 */
export async function deleteRating(userId: string, recipeId: string) {
  // Check if rating exists
  const rating = await prisma.rating.findUnique({
    where: {
      userId_recipeId: { userId, recipeId },
    },
  });

  if (!rating) {
    throw new Error('No rating found to delete');
  }

  // Delete rating
  await prisma.rating.delete({
    where: {
      userId_recipeId: { userId, recipeId },
    },
  });

  // Recalculate recipe statistics
  const stats = await recalculateRecipeRatingStats(recipeId);

  return stats;
}

/**
 * Recalculate and update recipe rating statistics
 */
async function recalculateRecipeRatingStats(recipeId: string) {
  const result = await prisma.rating.aggregate({
    where: { recipeId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = result._avg.rating || 0;
  const totalRatings = result._count.rating;

  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings,
    },
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
  };
}

// ============================================================================
// COMMENT SERVICE FUNCTIONS
// ============================================================================

/**
 * Add a comment to a recipe
 */
export async function addComment(
  userId: string,
  recipeId: string,
  content: string
) {
  // Check if recipe exists and is approved
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      status: true,
      totalComments: true,
      title: true,
      authorId: true,
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found or not available for commenting');
  }

  if (recipe.status !== 'APPROVED') {
    throw new Error('Recipe not found or not available for commenting');
  }

  // Create comment and update recipe totalComments in a transaction
  const comment = await prisma.$transaction(async tx => {
    const newComment = await tx.comment.create({
      data: {
        userId,
        recipeId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
      },
    });

    await tx.recipe.update({
      where: { id: recipeId },
      data: { totalComments: { increment: 1 } },
    });

    return newComment;
  });

  // Notify recipe author about new comment
  const commenterName = `${comment.user.firstName} ${comment.user.lastName}`;
  await NotificationService.notifyNewComment(
    recipeId,
    comment.id,
    recipe.authorId,
    userId,
    commenterName,
    recipe.title
  );

  return comment;
}

/**
 * Get comments for a recipe with pagination
 */
export async function getRecipeComments(
  recipeId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  // Validate sortBy field
  const validSortFields = ['createdAt'];
  const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const comments = await prisma.comment.findMany({
    where: { recipeId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
    },
    orderBy: { [orderByField]: sortOrder },
    skip,
    take: limit,
  });

  const total = await prisma.comment.count({ where: { recipeId } });

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Update a comment (user can only update their own)
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
) {
  // Check if comment exists and belongs to user
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, recipeId: true },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.userId !== userId) {
    throw new Error('You can only update your own comments');
  }

  // Update comment
  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: content.trim(),
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return updatedComment;
}

/**
 * Delete a comment (user can delete their own, admin can delete any)
 */
export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin: boolean
) {
  // Check if comment exists
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, recipeId: true },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  // Check authorization
  if (!isAdmin && comment.userId !== userId) {
    throw new Error('You can only delete your own comments');
  }

  // Delete comment and update recipe totalComments in a transaction
  await prisma.$transaction(async tx => {
    await tx.comment.delete({
      where: { id: commentId },
    });

    await tx.recipe.update({
      where: { id: comment.recipeId },
      data: { totalComments: { decrement: 1 } },
    });
  });
}
