import { Context } from 'hono'
import { RecipeService } from '@/services/recipeService'
import { parsePaginationParams } from '@/utils/pagination'
import { ApiResponse } from '@/types'

export class AdminController {
  static async getPendingRecipes(c: Context): Promise<Response> {
    const query = c.req.query()
    const { cursor, limit } = parsePaginationParams(query.cursor, query.limit)

    const result = await RecipeService.getPendingRecipes(cursor, limit)

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Pending recipes retrieved successfully',
    }

    return c.json(response)
  }

  static async approveRecipe(c: Context): Promise<Response> {
    const user = c.get('user')
    const recipeId = c.req.param('recipeId')

    const recipe = await RecipeService.approveRecipe(recipeId, user.id)

    const response: ApiResponse = {
      success: true,
      data: recipe,
      message: 'Recipe approved successfully',
    }

    return c.json(response)
  }

  static async rejectRecipe(c: Context): Promise<Response> {
    const recipeId = c.req.param('recipeId')
    const body = await c.req.json()
    const reason = body.reason || 'No reason provided'

    const recipe = await RecipeService.rejectRecipe(recipeId, reason)

    const response: ApiResponse = {
      success: true,
      data: recipe,
      message: 'Recipe rejected successfully',
    }

    return c.json(response)
  }
}