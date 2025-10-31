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
      tags: data.tags,
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
