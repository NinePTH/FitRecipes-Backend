import { prisma } from '@/utils/database';
import { deleteRecipeImage, extractPublicIdFromUrl } from '@/utils/imageUpload';
import * as NotificationService from '@/services/notificationService';

interface RecipeInput {
  title: string;
  description: string;
  mainIngredient: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  cuisineType?: string;
  dietaryInfo?: {
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
  };
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  imageUrls?: string[];
}

/**
 * Submit a new recipe (CHEF or ADMIN role)
 */
export async function submitRecipe(authorId: string, data: RecipeInput) {
  const recipe = await prisma.recipe.create({
    data: {
      ...data,
      authorId,
      ingredients: data.ingredients as any,
      dietaryInfo: data.dietaryInfo as any,
      nutritionInfo: data.nutritionInfo as any,
      status: 'PENDING',
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Notify admins about new recipe submission
  const chefName = `${recipe.author.firstName} ${recipe.author.lastName}`;
  await NotificationService.notifyNewRecipeSubmission(
    recipe.id,
    recipe.title,
    authorId,
    chefName
  );

  return recipe;
}

/**
 * Update an existing recipe (CHEF can update own, ADMIN can update any)
 * Only PENDING and REJECTED recipes can be updated
 * Handles cleanup of removed images from storage
 */
export async function updateRecipe(
  recipeId: string,
  userId: string,
  userRole: string,
  data: Partial<RecipeInput>
) {
  // Find the recipe with current imageUrls
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      authorId: true,
      status: true,
      imageUrls: true, // Get current images
    },
  });

  if (!existingRecipe) {
    throw new Error('Recipe not found');
  }

  // Authorization check
  if (userRole !== 'ADMIN' && existingRecipe.authorId !== userId) {
    throw new Error(
      'Unauthorized: You can only update your own recipes unless you are an admin'
    );
  }

  // Status check - only PENDING and REJECTED recipes can be updated
  if (existingRecipe.status === 'APPROVED') {
    throw new Error(
      'Cannot update approved recipes. Please contact an admin if changes are needed.'
    );
  }

  // Handle image cleanup if imageUrls changed
  if (data.imageUrls !== undefined) {
    const oldImageUrls = existingRecipe.imageUrls || [];
    const newImageUrls = data.imageUrls || [];

    // Find images that were removed (in old but not in new)
    const removedImages = oldImageUrls.filter(
      url => !newImageUrls.includes(url)
    );

    // Delete removed images from Supabase Storage (async, don't wait)
    if (removedImages.length > 0) {
      Promise.all(
        removedImages.map(async imageUrl => {
          try {
            const publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              await deleteRecipeImage(publicId);
            }
          } catch (error) {
            // Log but don't fail the update
            console.error(`Failed to delete image ${imageUrl}:`, error);
          }
        })
      ).catch(err => {
        // Silently fail - images can be cleaned up later
        console.error('Image cleanup error:', err);
      });
    }
  }

  // Update the recipe
  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      ...data,
      ingredients: data.ingredients as any,
      dietaryInfo: data.dietaryInfo as any,
      nutritionInfo: data.nutritionInfo as any,
      imageUrls: data.imageUrls,
      // Reset to PENDING status if it was REJECTED (for re-review)
      status: existingRecipe.status === 'REJECTED' ? 'PENDING' : undefined,
      // Clear rejection reason if re-submitting
      rejectionReason: existingRecipe.status === 'REJECTED' ? null : undefined,
      rejectedAt: existingRecipe.status === 'REJECTED' ? null : undefined,
      rejectedById: existingRecipe.status === 'REJECTED' ? null : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updatedRecipe;
}

/**
 * Get recipe by ID with authorization check
 */
export async function getRecipeById(
  recipeId: string,
  userId: string,
  userRole: string
) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      rejectedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      ratings: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Authorization check
  if (recipe.status === 'PENDING') {
    // Only author or admins can view pending recipes
    if (recipe.authorId !== userId && userRole !== 'ADMIN') {
      throw new Error("You don't have permission to view this recipe");
    }
  } else if (recipe.status === 'REJECTED') {
    // Only author can view rejected recipes
    if (recipe.authorId !== userId) {
      throw new Error("You don't have permission to view this recipe");
    }
  }

  return recipe;
}

/**
 * Get pending recipes for admin approval
 */
export async function getPendingRecipes(
  page: number = 1,
  limit: number = 10,
  sortBy: 'createdAt' | 'title' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where: { status: 'PENDING' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.recipe.count({
      where: { status: 'PENDING' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    recipes,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Approve a recipe
 */
export async function approveRecipe(
  recipeId: string,
  adminId: string,
  adminNote?: string
) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  if (recipe.status === 'APPROVED') {
    throw new Error('Recipe is already approved');
  }

  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: adminId,
      adminNote,
    },
    include: {
      approvedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Notify recipe author about approval
  await NotificationService.notifyRecipeApproved(
    recipeId,
    recipe.authorId,
    recipe.title,
    adminId
  );

  return updatedRecipe;
}

/**
 * Reject a recipe
 */
export async function rejectRecipe(
  recipeId: string,
  adminId: string,
  reason: string
) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedById: adminId,
      rejectionReason: reason,
    },
    include: {
      rejectedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Notify recipe author about rejection
  await NotificationService.notifyRecipeRejected(
    recipeId,
    recipe.authorId,
    recipe.title,
    reason,
    adminId
  );

  return updatedRecipe;
}

/**
 * Delete a recipe (CHEF can delete own, ADMIN can delete any)
 */
export async function deleteRecipe(
  recipeId: string,
  userId: string,
  userRole: 'USER' | 'CHEF' | 'ADMIN'
): Promise<void> {
  // Find the recipe
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      authorId: true,
      imageUrls: true, // Changed from imageUrl to imageUrls
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Authorization check
  if (userRole !== 'ADMIN' && recipe.authorId !== userId) {
    throw new Error(
      'Unauthorized: You can only delete your own recipes unless you are an admin'
    );
  }

  // Delete all associated images from storage if exist
  if (recipe.imageUrls && recipe.imageUrls.length > 0) {
    await Promise.all(
      recipe.imageUrls.map(async imageUrl => {
        try {
          const publicId = extractPublicIdFromUrl(imageUrl);
          if (publicId) {
            await deleteRecipeImage(publicId);
          }
        } catch (error) {
          // Log error but don't fail the deletion
          console.error(`Failed to delete recipe image ${imageUrl}:`, error);
        }
      })
    );
  }

  // Delete recipe from database (cascade will delete comments and ratings)
  await prisma.recipe.delete({
    where: { id: recipeId },
  });
}

/**
 * Get user's own recipes (My Recipes page)
 */
export async function getMyRecipes(
  userId: string,
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
) {
  const where: any = { authorId: userId };

  if (status) {
    where.status = status;
  }

  // Get recipes and counts
  const [recipes, total, approved, pending, rejected] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    }),
    prisma.recipe.count({ where: { authorId: userId } }),
    prisma.recipe.count({ where: { authorId: userId, status: 'APPROVED' } }),
    prisma.recipe.count({ where: { authorId: userId, status: 'PENDING' } }),
    prisma.recipe.count({ where: { authorId: userId, status: 'REJECTED' } }),
  ]);

  // Transform recipes to include totalComments
  const recipesWithComments = recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    imageUrls: recipe.imageUrls, // Changed from imageUrl to imageUrls
    prepTime: recipe.prepTime,
    cookingTime: recipe.cookingTime,
    servings: recipe.servings,
    mainIngredient: recipe.mainIngredient,
    cuisineType: recipe.cuisineType,
    status: recipe.status,
    rejectionReason: recipe.rejectionReason,
    averageRating: recipe.averageRating,
    totalRatings: recipe.totalRatings,
    totalComments: recipe._count.comments,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  }));

  return {
    recipes: recipesWithComments,
    meta: {
      total,
      approved,
      pending,
      rejected,
    },
  };
}

/**
 * Get approval statistics
 */
export async function getApprovalStats(
  period: 'today' | 'week' | 'month' | 'all' = 'today'
) {
  const now = new Date();
  let startDate: Date | undefined;

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [pending, approvedToday, rejectedToday] = await Promise.all([
    prisma.recipe.count({ where: { status: 'PENDING' } }),
    prisma.recipe.count({
      where: {
        status: 'APPROVED',
        approvedAt: startDate ? { gte: startDate } : undefined,
      },
    }),
    prisma.recipe.count({
      where: {
        status: 'REJECTED',
        rejectedAt: startDate ? { gte: startDate } : undefined,
      },
    }),
  ]);

  return {
    pending,
    approvedToday,
    rejectedToday,
  };
}

/**
 * Get recipe by ID - Admin view (can see any status)
 */
export async function getRecipeByIdAdmin(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      rejectedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  return recipe;
}

// ============================================================================
// BROWSE RECIPES
// ============================================================================

interface BrowseFilters {
  mealType?: string[];
  difficulty?: string[];
  cuisineType?: string;
  mainIngredient?: string;
  maxPrepTime?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isKeto?: boolean;
  isPaleo?: boolean;
}

/**
 * Browse recipes with filters, sorting, and pagination
 * Only returns APPROVED recipes
 */
export async function browseRecipes(
  page: number = 1,
  limit: number = 12,
  sortBy: string = 'rating',
  sortOrder: 'asc' | 'desc' = 'desc',
  filters: BrowseFilters = {}
) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: 'APPROVED', // Only approved recipes
  };

  // Apply filters
  if (filters.mealType && filters.mealType.length > 0) {
    where.mealType = { hasSome: filters.mealType };
  }

  if (filters.difficulty && filters.difficulty.length > 0) {
    where.difficulty = { in: filters.difficulty };
  }

  if (filters.cuisineType) {
    where.cuisineType = { contains: filters.cuisineType, mode: 'insensitive' };
  }

  if (filters.mainIngredient) {
    where.mainIngredient = {
      contains: filters.mainIngredient,
      mode: 'insensitive',
    };
  }

  // Dietary filters
  if (filters.isVegetarian !== undefined) {
    where.dietaryInfo = {
      ...where.dietaryInfo,
      path: ['isVegetarian'],
      equals: filters.isVegetarian,
    };
  }

  if (filters.isVegan !== undefined) {
    where.dietaryInfo = {
      ...where.dietaryInfo,
      path: ['isVegan'],
      equals: filters.isVegan,
    };
  }

  if (filters.isGlutenFree !== undefined) {
    where.dietaryInfo = {
      ...where.dietaryInfo,
      path: ['isGlutenFree'],
      equals: filters.isGlutenFree,
    };
  }

  if (filters.isDairyFree !== undefined) {
    where.dietaryInfo = {
      ...where.dietaryInfo,
      path: ['isDairyFree'],
      equals: filters.isDairyFree,
    };
  }

  if (filters.isKeto !== undefined) {
    where.dietaryInfo = {
      ...where.dietaryInfo,
      path: ['isKeto'],
      equals: filters.isKeto,
    };
  }

  if (filters.isPaleo !== undefined) {
    where.dietaryInfo = {
      ...where.dietaryInfo,
      path: ['isPaleo'],
      equals: filters.isPaleo,
    };
  }

  // Determine orderBy
  let orderBy: any = {};
  switch (sortBy) {
    case 'recent':
      orderBy = { createdAt: sortOrder };
      break;
    case 'prep-time-asc':
      // This will be handled by sorting after query
      orderBy = { prepTime: 'asc' };
      break;
    case 'prep-time-desc':
      // This will be handled by sorting after query
      orderBy = { prepTime: 'desc' };
      break;
    case 'rating':
    default:
      orderBy = { averageRating: sortOrder };
      break;
  }

  // Fetch recipes
  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  // Filter by maxPrepTime if specified (prepTime + cookingTime)
  let filteredRecipes = recipes;
  if (filters.maxPrepTime !== undefined) {
    filteredRecipes = recipes.filter(
      recipe => recipe.prepTime + recipe.cookingTime <= filters.maxPrepTime!
    );
  }

  // Get total count with same filters
  const total = await prisma.recipe.count({ where });

  return {
    recipes: filteredRecipes,
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
 * Get recommended recipes (personalized if userId provided)
 */
export async function getRecommendedRecipes(
  limit: number = 12,
  userId?: string
) {
  // For now, return popular recipes (high rating + high rating count)
  // TODO: Implement personalization based on user's past ratings
  const recipes = await prisma.recipe.findMany({
    where: {
      status: 'APPROVED',
      totalRatings: { gte: 1 }, // At least 1 rating
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [{ averageRating: 'desc' }, { totalRatings: 'desc' }],
    take: limit,
  });

  return {
    recipes,
    meta: {
      recommendationType: userId ? 'personalized' : 'popular',
      total: recipes.length,
    },
  };
}

/**
 * Get trending recipes (high engagement in last 7-30 days)
 * Includes recent ratings, comments, and saves
 */
export async function getTrendingRecipes(
  limit: number = 12,
  period: '7d' | '30d' = '7d'
) {
  const daysAgo = period === '7d' ? 7 : 30;
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

  // Get recipes with recent ratings, comments, or saves
  const recipes = await prisma.recipe.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        {
          ratings: {
            some: {
              createdAt: { gte: dateThreshold },
            },
          },
        },
        {
          comments: {
            some: {
              createdAt: { gte: dateThreshold },
            },
          },
        },
        {
          savedByUsers: {
            some: {
              savedAt: { gte: dateThreshold },
            },
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          ratings: {
            where: {
              createdAt: { gte: dateThreshold },
            },
          },
          comments: {
            where: {
              createdAt: { gte: dateThreshold },
            },
          },
          savedByUsers: {
            where: {
              savedAt: { gte: dateThreshold },
            },
          },
        },
      },
    },
  });

  // Calculate trending score and sort by activity: recent ratings + comments + saves
  const recipesWithScore = recipes.map(recipe => {
    const score =
      (recipe._count.ratings || 0) +
      (recipe._count.comments || 0) +
      (recipe._count.savedByUsers || 0);
    return { recipe, score };
  });

  // Sort by score and return top recipes
  const sortedRecipes = recipesWithScore
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.recipe);

  return {
    recipes: sortedRecipes,
    meta: {
      period,
      total: sortedRecipes.length,
    },
  };
}

/**
 * Get new recipes (recently approved)
 */
export async function getNewRecipes(limit: number = 12) {
  const recipes = await prisma.recipe.findMany({
    where: {
      status: 'APPROVED',
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { approvedAt: 'desc' },
    take: limit,
  });

  return {
    recipes,
    meta: {
      total: recipes.length,
    },
  };
}
