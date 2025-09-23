import prisma from '@/config/database'

export class RatingService {
  static async createOrUpdateRating(recipeId: string, userId: string, rating: number) {
    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    if (!recipe) {
      throw new Error('Recipe not found')
    }

    // Check if user has already rated this recipe
    const existingRating = await prisma.rating.findUnique({
      where: {
        recipeId_userId: {
          recipeId,
          userId,
        },
      },
    })

    if (existingRating) {
      // Update existing rating
      return prisma.rating.update({
        where: {
          recipeId_userId: {
            recipeId,
            userId,
          },
        },
        data: { rating },
      })
    } else {
      // Create new rating
      return prisma.rating.create({
        data: {
          rating,
          recipeId,
          userId,
        },
      })
    }
  }

  static async getUserRating(recipeId: string, userId: string) {
    return prisma.rating.findUnique({
      where: {
        recipeId_userId: {
          recipeId,
          userId,
        },
      },
    })
  }

  static async getRecipeRatings(recipeId: string) {
    const ratings = await prisma.rating.findMany({
      where: { recipeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0

    const ratingDistribution = {
      1: ratings.filter(r => r.rating === 1).length,
      2: ratings.filter(r => r.rating === 2).length,
      3: ratings.filter(r => r.rating === 3).length,
      4: ratings.filter(r => r.rating === 4).length,
      5: ratings.filter(r => r.rating === 5).length,
    }

    return {
      ratings,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: ratings.length,
      ratingDistribution,
    }
  }

  static async deleteRating(recipeId: string, userId: string) {
    const rating = await prisma.rating.findUnique({
      where: {
        recipeId_userId: {
          recipeId,
          userId,
        },
      },
    })

    if (!rating) {
      throw new Error('Rating not found')
    }

    return prisma.rating.delete({
      where: {
        recipeId_userId: {
          recipeId,
          userId,
        },
      },
    })
  }
}