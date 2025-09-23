import { Context } from 'hono'
import { RatingService } from '@/services/ratingService'
import { validateData, createRatingSchema } from '@/utils/validation'
import { ApiResponse } from '@/types'

export class RatingController {
  static async createOrUpdateRating(c: Context): Promise<Response> {
    const user = c.get('user')
    const recipeId = c.req.param('recipeId')
    const body = await c.req.json()
    const { rating } = validateData(createRatingSchema, body)

    const result = await RatingService.createOrUpdateRating(recipeId, user.id, rating)

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Rating saved successfully',
    }

    return c.json(response)
  }

  static async getUserRating(c: Context): Promise<Response> {
    const user = c.get('user')
    const recipeId = c.req.param('recipeId')

    const rating = await RatingService.getUserRating(recipeId, user.id)

    const response: ApiResponse = {
      success: true,
      data: rating,
      message: 'User rating retrieved successfully',
    }

    return c.json(response)
  }

  static async getRecipeRatings(c: Context): Promise<Response> {
    const recipeId = c.req.param('recipeId')

    const ratings = await RatingService.getRecipeRatings(recipeId)

    const response: ApiResponse = {
      success: true,
      data: ratings,
      message: 'Recipe ratings retrieved successfully',
    }

    return c.json(response)
  }

  static async deleteRating(c: Context): Promise<Response> {
    const user = c.get('user')
    const recipeId = c.req.param('recipeId')

    await RatingService.deleteRating(recipeId, user.id)

    const response: ApiResponse = {
      success: true,
      message: 'Rating deleted successfully',
    }

    return c.json(response)
  }
}