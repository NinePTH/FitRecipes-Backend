import { prisma } from '@/utils/database';
import { deleteRecipeImage, extractPublicIdFromUrl } from '@/utils/imageUpload';

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
  tags?: string[];
  imageUrl?: string;
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
      tags: data.tags || [],
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

  return recipe;
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
      imageUrl: true,
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

  // Delete associated image from storage if exists
  if (recipe.imageUrl) {
    try {
      const publicId = extractPublicIdFromUrl(recipe.imageUrl);
      if (publicId) {
        await deleteRecipeImage(publicId);
      }
    } catch (error) {
      // Log error but don't fail the deletion
      console.error('Failed to delete recipe image:', error);
    }
  }

  // Delete recipe from database (cascade will delete comments and ratings)
  await prisma.recipe.delete({
    where: { id: recipeId },
  });
}
