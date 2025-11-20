import { prisma } from '@/utils/database';

/**
 * Get admin dashboard overview statistics
 */
export async function getAdminOverview(
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
) {
  const now = new Date();
  let dateThreshold: Date | undefined;

  if (timeRange !== 'all') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    dateThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Get user statistics
  const [totalUsers, activeUsers, bannedUsers, newUsers, usersByRole] =
    await Promise.all([
      prisma.user.count(),
      dateThreshold
        ? prisma.user.count({
            where: {
              lastLoginAt: { gte: dateThreshold },
            },
          })
        : prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      dateThreshold
        ? prisma.user.count({
            where: { createdAt: { gte: dateThreshold } },
          })
        : 0,
      Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({ where: { role: 'CHEF' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
      ]),
    ]);

  // Get recipe statistics
  const [
    totalRecipes,
    approvedRecipes,
    pendingRecipes,
    rejectedRecipes,
    newRecipes,
  ] = await Promise.all([
    prisma.recipe.count(),
    prisma.recipe.count({ where: { status: 'APPROVED' } }),
    prisma.recipe.count({ where: { status: 'PENDING' } }),
    prisma.recipe.count({ where: { status: 'REJECTED' } }),
    dateThreshold
      ? prisma.recipe.count({
          where: { createdAt: { gte: dateThreshold } },
        })
      : 0,
  ]);

  // Get engagement statistics
  const [
    totalComments,
    totalRatings,
    commentsInPeriod,
    ratingsInPeriod,
    avgRatingResult,
  ] = await Promise.all([
    prisma.comment.count(),
    prisma.rating.count(),
    dateThreshold
      ? prisma.comment.count({
          where: { createdAt: { gte: dateThreshold } },
        })
      : 0,
    dateThreshold
      ? prisma.rating.count({
          where: { createdAt: { gte: dateThreshold } },
        })
      : 0,
    prisma.rating.aggregate({
      _avg: { rating: true },
    }),
  ]);

  // Get top chefs
  const topChefs = await prisma.user.findMany({
    where: {
      role: 'CHEF',
      recipes: {
        some: {
          status: 'APPROVED',
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      _count: {
        select: {
          recipes: {
            where: { status: 'APPROVED' },
          },
        },
      },
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
    take: 10,
  });

  const formattedTopChefs = topChefs
    .map(chef => {
      const totalViews = chef.recipes.reduce(
        (sum, r) => sum + r._count.views,
        0
      );
      // Only calculate average from recipes that have ratings
      const recipesWithRatings = chef.recipes.filter(r => r.totalRatings > 0);
      const avgRating =
        recipesWithRatings.length > 0
          ? recipesWithRatings.reduce((sum, r) => sum + r.averageRating, 0) /
            recipesWithRatings.length
          : 0;

      return {
        userId: chef.id,
        name: `${chef.firstName} ${chef.lastName}`,
        recipeCount: chef._count.recipes,
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalViews,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);

  // Get recent activity
  const recentActivity: Array<{
    type: string;
    timestamp: string;
    details: string;
  }> = [];

  if (dateThreshold) {
    const [recentUsers, recentRecipes, recentBans] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: dateThreshold } },
        select: { createdAt: true, firstName: true, lastName: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.recipe.findMany({
        where: {
          OR: [
            { createdAt: { gte: dateThreshold } },
            {
              status: 'APPROVED',
              approvedAt: { gte: dateThreshold },
            },
          ],
        },
        select: {
          createdAt: true,
          approvedAt: true,
          status: true,
          title: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.findMany({
        where: {
          isBanned: true,
          bannedAt: { gte: dateThreshold },
        },
        select: { bannedAt: true, firstName: true, lastName: true },
        orderBy: { bannedAt: 'desc' },
        take: 5,
      }),
    ]);

    recentActivity.push(
      ...recentUsers.map(u => ({
        type: 'user_registered',
        timestamp: u.createdAt.toISOString(),
        details: `${u.firstName} ${u.lastName} registered`,
      })),
      ...recentRecipes
        .filter(r => r.status === 'PENDING' || !r.approvedAt)
        .map(r => ({
          type: 'recipe_submitted',
          timestamp: r.createdAt.toISOString(),
          details: `Recipe "${r.title}" submitted`,
        })),
      ...recentRecipes
        .filter(r => r.status === 'APPROVED' && r.approvedAt)
        .map(r => ({
          type: 'recipe_approved',
          timestamp: r.approvedAt!.toISOString(),
          details: `Recipe "${r.title}" approved`,
        })),
      ...recentBans.map(u => ({
        type: 'user_banned',
        timestamp: u.bannedAt!.toISOString(),
        details: `${u.firstName} ${u.lastName} banned`,
      }))
    );

    recentActivity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    recentActivity.splice(10);
  }

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      banned: bannedUsers,
      newInPeriod: newUsers,
      byRole: {
        USER: usersByRole[0],
        CHEF: usersByRole[1],
        ADMIN: usersByRole[2],
      },
    },
    recipes: {
      total: totalRecipes,
      approved: approvedRecipes,
      pending: pendingRecipes,
      rejected: rejectedRecipes,
      newInPeriod: newRecipes,
    },
    engagement: {
      totalComments,
      totalRatings,
      averageRating: avgRatingResult._avg.rating
        ? parseFloat(avgRatingResult._avg.rating.toFixed(2))
        : 0,
      commentsInPeriod,
      ratingsInPeriod,
    },
    topChefs: formattedTopChefs,
    recentActivity,
  };
}

/**
 * Get recipe submission trends over time
 */
export async function getRecipeTrends(
  timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
  groupBy?: 'day' | 'week' | 'month'
) {
  const now = new Date();
  const days =
    timeRange === '7d'
      ? 7
      : timeRange === '30d'
        ? 30
        : timeRange === '90d'
          ? 90
          : 365;
  const dateThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Auto-determine grouping if not specified
  if (!groupBy) {
    groupBy = days <= 30 ? 'day' : days <= 90 ? 'week' : 'month';
  }

  // Get all recipes in the time range
  const recipes = await prisma.recipe.findMany({
    where: {
      createdAt: { gte: dateThreshold },
    },
    select: {
      createdAt: true,
      status: true,
      approvedAt: true,
      rejectedAt: true,
    },
  });

  // Group by date
  const trendsMap = new Map<
    string,
    { submitted: number; approved: number; rejected: number }
  >();

  recipes.forEach(recipe => {
    const dateKey = formatDateByGrouping(recipe.createdAt, groupBy!);

    if (!trendsMap.has(dateKey)) {
      trendsMap.set(dateKey, { submitted: 0, approved: 0, rejected: 0 });
    }

    const data = trendsMap.get(dateKey)!;
    data.submitted++;

    if (recipe.status === 'APPROVED' && recipe.approvedAt) {
      const approvedDateKey = formatDateByGrouping(recipe.approvedAt, groupBy!);
      if (!trendsMap.has(approvedDateKey)) {
        trendsMap.set(approvedDateKey, {
          submitted: 0,
          approved: 0,
          rejected: 0,
        });
      }
      trendsMap.get(approvedDateKey)!.approved++;
    }

    if (recipe.status === 'REJECTED' && recipe.rejectedAt) {
      const rejectedDateKey = formatDateByGrouping(recipe.rejectedAt, groupBy!);
      if (!trendsMap.has(rejectedDateKey)) {
        trendsMap.set(rejectedDateKey, {
          submitted: 0,
          approved: 0,
          rejected: 0,
        });
      }
      trendsMap.get(rejectedDateKey)!.rejected++;
    }
  });

  // Convert to array and sort by date
  const trends = Array.from(trendsMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate summary
  const totalSubmitted = recipes.length;
  const totalApproved = recipes.filter(r => r.status === 'APPROVED').length;
  const totalRejected = recipes.filter(r => r.status === 'REJECTED').length;
  const approvalRate =
    totalSubmitted > 0 ? (totalApproved / totalSubmitted) * 100 : 0;

  return {
    trends,
    summary: {
      totalSubmitted,
      totalApproved,
      totalRejected,
      approvalRate: parseFloat(approvalRate.toFixed(2)),
    },
  };
}

/**
 * Get user growth trends over time
 */
export async function getUserGrowthTrends(
  timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
  groupBy?: 'day' | 'week' | 'month'
) {
  const now = new Date();
  const days =
    timeRange === '7d'
      ? 7
      : timeRange === '30d'
        ? 30
        : timeRange === '90d'
          ? 90
          : 365;
  const dateThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Auto-determine grouping if not specified
  if (!groupBy) {
    groupBy = days <= 30 ? 'day' : days <= 90 ? 'week' : 'month';
  }

  // Get all users in the time range
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: dateThreshold },
    },
    select: {
      createdAt: true,
      role: true,
    },
  });

  // Group by date
  const trendsMap = new Map<
    string,
    { newUsers: number; newChefs: number; newAdmins: number; total: number }
  >();

  users.forEach(user => {
    const dateKey = formatDateByGrouping(user.createdAt, groupBy!);

    if (!trendsMap.has(dateKey)) {
      trendsMap.set(dateKey, {
        newUsers: 0,
        newChefs: 0,
        newAdmins: 0,
        total: 0,
      });
    }

    const data = trendsMap.get(dateKey)!;
    data.total++;

    if (user.role === 'USER') data.newUsers++;
    else if (user.role === 'CHEF') data.newChefs++;
    else if (user.role === 'ADMIN') data.newAdmins++;
  });

  // Convert to array and sort by date
  const trends = Array.from(trendsMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate growth rate (vs previous period)
  const previousPeriodStart = new Date(
    dateThreshold.getTime() - days * 24 * 60 * 60 * 1000
  );
  const previousPeriodUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: previousPeriodStart,
        lt: dateThreshold,
      },
    },
  });

  const growthRate =
    previousPeriodUsers > 0
      ? ((users.length - previousPeriodUsers) / previousPeriodUsers) * 100
      : 0;

  return {
    trends,
    summary: {
      totalNewUsers: users.length,
      growthRate: parseFloat(growthRate.toFixed(2)),
    },
  };
}

/**
 * Helper function to format date by grouping
 */
function formatDateByGrouping(
  date: Date,
  groupBy: 'day' | 'week' | 'month'
): string {
  const d = new Date(date);

  if (groupBy === 'day') {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } else if (groupBy === 'week') {
    // Get the Monday of the week
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
    return monday.toISOString().split('T')[0];
  } else {
    // month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
