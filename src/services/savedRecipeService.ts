import { prisma } from '@/utils/database';
import { createPaginationParams } from '@/utils/helpers';

/**
 * Save a recipe for a user
 */
export async function saveRecipe(userId: string, recipeId: string) {
  // Check if recipe exists and is approved
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, status: 'APPROVED' },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Check if already saved
  const existingSave = await prisma.savedRecipe.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (existingSave) {
    return { recipeId, savedAt: existingSave.savedAt, alreadySaved: true };
  }

  // Create save
  const savedRecipe = await prisma.savedRecipe.create({
    data: { userId, recipeId },
  });

  return { recipeId, savedAt: savedRecipe.savedAt, alreadySaved: false };
}

/**
 * Unsave a recipe for a user
 */
export async function unsaveRecipe(userId: string, recipeId: string) {
  const savedRecipe = await prisma.savedRecipe.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (!savedRecipe) {
    throw new Error('Recipe not found in saved collection');
  }

  await prisma.savedRecipe.delete({
    where: { userId_recipeId: { userId, recipeId } },
  });

  return { recipeId };
}

/**
 * Get user's saved recipes with pagination
 */
export async function getSavedRecipes(
  userId: string,
  page = 1,
  limit = 20,
  sortBy = 'savedAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const { skip, take } = createPaginationParams(page, limit);

  const [savedRecipes, total] = await Promise.all([
    prisma.savedRecipe.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        recipe: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.savedRecipe.count({ where: { userId } }),
  ]);

  const recipes = savedRecipes.map(sr => ({
    ...sr.recipe,
    savedAt: sr.savedAt,
  }));

  return {
    recipes,
    pagination: {
      page,
      limit,
      totalRecipes: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    },
  };
}

/**
 * Check if a recipe is saved by user
 */
export async function checkRecipeSaved(userId: string, recipeId: string) {
  const savedRecipe = await prisma.savedRecipe.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  return {
    recipeId,
    isSaved: !!savedRecipe,
    savedAt: savedRecipe?.savedAt || null,
  };
}

/**
 * Bulk check if recipes are saved by user
 */
export async function bulkCheckSaved(userId: string, recipeIds: string[]) {
  const savedRecipes = await prisma.savedRecipe.findMany({
    where: {
      userId,
      recipeId: { in: recipeIds },
    },
    select: { recipeId: true },
  });

  const savedSet = new Set(savedRecipes.map(sr => sr.recipeId));
  const result: Record<string, boolean> = {};

  recipeIds.forEach(id => {
    result[id] = savedSet.has(id);
  });

  return result;
}
