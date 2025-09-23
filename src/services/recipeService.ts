import prisma from '@/config/database'
import { CreateRecipeData, RecipeWithAuthor, PaginatedResponse, RecipeFilters, RecipeSort } from '@/types'
import { RecipeStatus, RecipeDifficulty, Prisma } from '@prisma/client'

export class RecipeService {
  static async createRecipe(userId: string, data: CreateRecipeData) {
    return prisma.recipe.create({
      data: {
        ...data,
        userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        category: true,
        ratings: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
            favoritedBy: true,
          },
        },
      },
    })
  }

  static async getRecipes(
    filters: RecipeFilters = {},
    sort: RecipeSort = { field: 'createdAt', direction: 'desc' },
    cursor?: string,
    limit = 20
  ): Promise<PaginatedResponse<RecipeWithAuthor>> {
    const where: Prisma.RecipeWhereInput = {
      status: RecipeStatus.APPROVED,
    }

    // Apply filters
    if (filters.category) {
      where.categoryId = filters.category
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty as RecipeDifficulty
    }

    if (filters.maxPrepTime) {
      where.prepTime = { lte: filters.maxPrepTime }
    }

    if (filters.maxCookTime) {
      where.cookTime = { lte: filters.maxCookTime }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Build cursor condition
    const cursorCondition = cursor ? { id: { gt: cursor } } : {}

    const recipes = await prisma.recipe.findMany({
      where: { ...where, ...cursorCondition },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        category: true,
        ratings: true,
        comments: {
          take: 3, // Limit comments for list view
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
            favoritedBy: true,
          },
        },
      },
      orderBy: { [sort.field]: sort.direction },
      take: limit + 1, // Take one extra to check if there are more
    })

    // Calculate average ratings
    const recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      averageRating: recipe.ratings.length > 0
        ? recipe.ratings.reduce((sum, rating) => sum + rating.rating, 0) / recipe.ratings.length
        : 0,
    }))

    const hasMore = recipesWithRatings.length > limit
    const data = hasMore ? recipesWithRatings.slice(0, -1) : recipesWithRatings
    const nextCursor = hasMore ? data[data.length - 1].id : undefined

    return {
      data,
      nextCursor,
      hasMore,
    }
  }

  static async getRecipeById(id: string): Promise<RecipeWithAuthor | null> {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        category: true,
        ratings: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          where: { parentId: null }, // Only top-level comments
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
            favoritedBy: true,
          },
        },
      },
    })

    if (!recipe) return null

    // Calculate average rating
    const averageRating = recipe.ratings.length > 0
      ? recipe.ratings.reduce((sum, rating) => sum + rating.rating, 0) / recipe.ratings.length
      : 0

    return {
      ...recipe,
      averageRating,
    }
  }

  static async updateRecipe(id: string, userId: string, data: Partial<CreateRecipeData>) {
    // Check if user owns the recipe or is admin
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!recipe) {
      throw new Error('Recipe not found')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('User not found')
    }

    if (recipe.userId !== userId && user.role !== 'ADMIN') {
      throw new Error('You can only edit your own recipes')
    }

    return prisma.recipe.update({
      where: { id },
      data: {
        ...data,
        status: RecipeStatus.PENDING, // Reset to pending after edit
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        category: true,
      },
    })
  }

  static async deleteRecipe(id: string, userId: string) {
    // Check if user owns the recipe or is admin
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!recipe) {
      throw new Error('Recipe not found')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('User not found')
    }

    if (recipe.userId !== userId && user.role !== 'ADMIN') {
      throw new Error('You can only delete your own recipes')
    }

    return prisma.recipe.delete({
      where: { id },
    })
  }

  static async getPendingRecipes(cursor?: string, limit = 20) {
    const cursorCondition = cursor ? { id: { gt: cursor } } : {}

    const recipes = await prisma.recipe.findMany({
      where: { status: RecipeStatus.PENDING, ...cursorCondition },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        category: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
    })

    const hasMore = recipes.length > limit
    const data = hasMore ? recipes.slice(0, -1) : recipes
    const nextCursor = hasMore ? data[data.length - 1].id : undefined

    return {
      data,
      nextCursor,
      hasMore,
    }
  }

  static async approveRecipe(id: string, adminId: string) {
    return prisma.recipe.update({
      where: { id },
      data: {
        status: RecipeStatus.APPROVED,
        approvedById: adminId,
      },
    })
  }

  static async rejectRecipe(id: string, reason?: string) {
    return prisma.recipe.update({
      where: { id },
      data: {
        status: RecipeStatus.REJECTED,
        rejectionReason: reason,
      },
    })
  }
}