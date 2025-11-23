import { prisma } from '@/utils/database';

/**
 * Get chef analytics overview
 */
export async function getChefOverview(
  chefId: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
) {
  const now = new Date();
  let dateThreshold: Date | undefined;

  if (timeRange !== 'all') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    dateThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Verify chef exists
  const chef = await prisma.user.findUnique({
    where: { id: chefId },
    select: { role: true },
  });

  if (!chef || (chef.role !== 'CHEF' && chef.role !== 'ADMIN')) {
    throw new Error('Chef not found or invalid role');
  }

  // Get chef's recipes
  const recipes = await prisma.recipe.findMany({
    where: { authorId: chefId },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      approvedAt: true,
      averageRating: true,
      totalRatings: true,
      totalComments: true,
      _count: {
        select: {
          views: true,
          ratings: dateThreshold
            ? { where: { createdAt: { gte: dateThreshold } } }
            : true,
          comments: dateThreshold
            ? { where: { createdAt: { gte: dateThreshold } } }
            : true,
        },
      },
    },
  });

  // Calculate statistics
  const total = recipes.length;
  const approved = recipes.filter(r => r.status === 'APPROVED').length;
  const pending = recipes.filter(r => r.status === 'PENDING').length;
  const rejected = recipes.filter(r => r.status === 'REJECTED').length;
  const newInPeriod = dateThreshold
    ? recipes.filter(r => r.createdAt >= dateThreshold).length
    : 0;

  const totalViews = recipes.reduce((sum, r) => sum + r._count.views, 0);
  const viewsInPeriod = dateThreshold
    ? await prisma.recipeView.count({
        where: {
          recipeId: { in: recipes.map(r => r.id) },
          viewedAt: { gte: dateThreshold },
        },
      })
    : totalViews;

  const totalRatings = recipes.reduce((sum, r) => sum + r.totalRatings, 0);
  // Only calculate average from recipes that have ratings
  const recipesWithRatings = recipes.filter(r => r.totalRatings > 0);
  const averageRating =
    recipesWithRatings.length > 0
      ? recipesWithRatings.reduce((sum, r) => sum + r.averageRating, 0) /
        recipesWithRatings.length
      : 0;
  const totalComments = recipes.reduce((sum, r) => sum + r.totalComments, 0);

  // Get top recipes (only show recipes with some engagement)
  const topRecipes = recipes
    .filter(r => r.status === 'APPROVED')
    .filter(
      r => r._count.views > 0 || r.totalRatings > 0 || r.totalComments > 0
    ) // Only recipes with engagement
    .sort((a, b) => {
      // Sort by views first
      if (b._count.views !== a._count.views) {
        return b._count.views - a._count.views;
      }
      // Then by rating (if views are equal)
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      // Finally by comments (if rating is also equal)
      return b.totalComments - a.totalComments;
    })
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      name: r.title,
      views: r._count.views,
      rating: r.averageRating,
      ratingCount: r.totalRatings,
      commentCount: r.totalComments,
    }));

  // Get chef rankings
  const allChefs = await prisma.user.findMany({
    where: {
      OR: [{ role: 'CHEF' }, { role: 'ADMIN' }],
      recipes: {
        some: {
          status: 'APPROVED',
        },
      },
    },
    select: {
      id: true,
      recipes: {
        where: { status: 'APPROVED' },
        select: {
          averageRating: true,
          totalRatings: true,
          _count: {
            select: {
              views: true,
            },
          },
        },
      },
    },
  });

  const chefStats = allChefs.map(c => {
    const totalViews = c.recipes.reduce((sum, r) => sum + r._count.views, 0);
    // Only calculate average from recipes that have ratings
    const recipesWithRatings = c.recipes.filter(r => r.totalRatings > 0);
    const avgRating =
      recipesWithRatings.length > 0
        ? recipesWithRatings.reduce((sum, r) => sum + r.averageRating, 0) /
          recipesWithRatings.length
        : 0;
    return {
      id: c.id,
      totalViews,
      avgRating,
    };
  });

  chefStats.sort((a, b) => b.totalViews - a.totalViews);
  const viewRank = chefStats.findIndex(c => c.id === chefId) + 1;

  chefStats.sort((a, b) => b.avgRating - a.avgRating);
  const ratingRank = chefStats.findIndex(c => c.id === chefId) + 1;

  // Get recent activity
  const recentActivity: Array<{
    type: string;
    timestamp: string;
    details: string;
  }> = [];

  if (dateThreshold) {
    const [recentComments, recentRatings, recentApprovals, recentRejections] =
      await Promise.all([
        prisma.comment.findMany({
          where: {
            recipeId: { in: recipes.map(r => r.id) },
            createdAt: { gte: dateThreshold },
          },
          select: {
            createdAt: true,
            recipe: { select: { title: true } },
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.rating.findMany({
          where: {
            recipeId: { in: recipes.map(r => r.id) },
            createdAt: { gte: dateThreshold },
          },
          select: {
            createdAt: true,
            rating: true,
            recipe: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.recipe.findMany({
          where: {
            authorId: chefId,
            status: 'APPROVED',
            approvedAt: { gte: dateThreshold },
          },
          select: {
            approvedAt: true,
            title: true,
          },
          orderBy: { approvedAt: 'desc' },
          take: 5,
        }),
        prisma.recipe.findMany({
          where: {
            authorId: chefId,
            status: 'REJECTED',
            rejectedAt: { gte: dateThreshold },
          },
          select: {
            rejectedAt: true,
            title: true,
          },
          orderBy: { rejectedAt: 'desc' },
          take: 5,
        }),
      ]);

    recentActivity.push(
      ...recentComments.map(c => ({
        type: 'comment_received',
        timestamp: c.createdAt.toISOString(),
        details: `${c.user.firstName} ${c.user.lastName} commented on "${c.recipe.title}"`,
      })),
      ...recentRatings.map(r => ({
        type: 'rating_received',
        timestamp: r.createdAt.toISOString(),
        details: `"${r.recipe.title}" received ${r.rating}/5 rating`,
      })),
      ...recentApprovals.map(r => ({
        type: 'recipe_approved',
        timestamp: r.approvedAt!.toISOString(),
        details: `"${r.title}" was approved`,
      })),
      ...recentRejections.map(r => ({
        type: 'recipe_rejected',
        timestamp: r.rejectedAt!.toISOString(),
        details: `"${r.title}" was rejected`,
      }))
    );

    recentActivity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    recentActivity.splice(10);
  }

  return {
    myRecipes: {
      total,
      approved,
      pending,
      rejected,
      newInPeriod,
    },
    performance: {
      totalViews,
      viewsInPeriod,
      totalRatings,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalComments,
    },
    topRecipes,
    rankings: {
      viewRank: viewRank || 0,
      ratingRank: ratingRank || 0,
      totalChefs: chefStats.length,
    },
    recentActivity,
  };
}

/**
 * Get detailed analytics for a specific recipe
 */
export async function getRecipeAnalytics(
  recipeId: string,
  chefId: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
) {
  const now = new Date();
  let dateThreshold: Date | undefined;

  if (timeRange !== 'all') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    dateThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Get recipe and verify ownership
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      approvedAt: true,
      authorId: true,
      averageRating: true,
      totalRatings: true,
      totalComments: true,
      _count: {
        select: {
          views: true,
        },
      },
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Check ownership (chef can only view own recipes, admin can view any)
  const chef = await prisma.user.findUnique({
    where: { id: chefId },
    select: { role: true },
  });

  if (!chef || (chef.role !== 'ADMIN' && recipe.authorId !== chefId)) {
    throw new Error('Unauthorized to view this recipe analytics');
  }

  // Get view statistics
  const totalViews = recipe._count.views;
  const viewsInPeriod = dateThreshold
    ? await prisma.recipeView.count({
        where: {
          recipeId,
          viewedAt: { gte: dateThreshold },
        },
      })
    : totalViews;

  // Get view trends
  const viewTrends: Array<{ date: string; views: number }> = [];
  if (dateThreshold) {
    const views = await prisma.recipeView.findMany({
      where: {
        recipeId,
        viewedAt: { gte: dateThreshold },
      },
      select: {
        viewedAt: true,
      },
    });

    const viewsMap = new Map<string, number>();
    views.forEach(v => {
      const dateKey = v.viewedAt.toISOString().split('T')[0];
      viewsMap.set(dateKey, (viewsMap.get(dateKey) || 0) + 1);
    });

    viewTrends.push(
      ...Array.from(viewsMap.entries())
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  }

  // Get rating distribution
  const ratings = await prisma.rating.findMany({
    where: { recipeId },
    select: { rating: true, createdAt: true },
  });

  const distribution = {
    '5': ratings.filter(r => r.rating === 5).length,
    '4': ratings.filter(r => r.rating === 4).length,
    '3': ratings.filter(r => r.rating === 3).length,
    '2': ratings.filter(r => r.rating === 2).length,
    '1': ratings.filter(r => r.rating === 1).length,
  };

  const ratingsInPeriod = dateThreshold
    ? ratings.filter(r => r.createdAt >= dateThreshold).length
    : ratings.length;

  // Get recent comments
  const recentComments = await prisma.comment.findMany({
    where: { recipeId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const commentsInPeriod = dateThreshold
    ? await prisma.comment.count({
        where: {
          recipeId,
          createdAt: { gte: dateThreshold },
        },
      })
    : recipe.totalComments;

  // Calculate engagement rates
  const viewToRatingRate =
    totalViews > 0 ? (ratings.length / totalViews) * 100 : 0;
  const viewToCommentRate =
    totalViews > 0 ? (recipe.totalComments / totalViews) * 100 : 0;

  return {
    recipe: {
      id: recipe.id,
      name: recipe.title,
      status: recipe.status,
      createdAt: recipe.createdAt.toISOString(),
      approvedAt: recipe.approvedAt?.toISOString(),
    },
    views: {
      total: totalViews,
      viewsInPeriod,
      viewTrends,
    },
    ratings: {
      total: ratings.length,
      average: recipe.averageRating,
      distribution,
      ratingsInPeriod,
    },
    comments: {
      total: recipe.totalComments,
      commentsInPeriod,
      recentComments: recentComments.map(c => ({
        id: c.id,
        userName: `${c.user.firstName} ${c.user.lastName}`,
        text: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    },
    engagement: {
      viewToRatingRate: parseFloat(viewToRatingRate.toFixed(2)),
      viewToCommentRate: parseFloat(viewToCommentRate.toFixed(2)),
    },
  };
}

/**
 * Track a recipe view
 */
export async function trackRecipeView(
  recipeId: string,
  userId?: string,
  ipAddress?: string
) {
  // Check if recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Check for existing view today (idempotency)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // For logged-in users: Check by userId only
  // For anonymous users: Check by ipAddress only
  const existingView = await prisma.recipeView.findFirst({
    where: {
      recipeId,
      ...(userId ? { userId } : { ipAddress, userId: null }),
      viewedAt: { gte: today, lt: tomorrow },
    },
  });

  // Debug logging
  // eslint-disable-next-line no-console
  console.log('🔍 View tracking check:', {
    recipeId,
    userId: userId || 'anonymous',
    ipAddress,
    existingView: existingView ? 'found' : 'not found',
    today: today.toISOString(),
  });

  // Don't create duplicate view for same user/IP on same day
  if (existingView) {
    return { recorded: false, message: 'View already recorded today' };
  }

  // Create new view record
  await prisma.recipeView.create({
    data: {
      recipeId,
      userId,
      ipAddress,
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ New view recorded');

  return { recorded: true, message: 'View recorded' };
}
