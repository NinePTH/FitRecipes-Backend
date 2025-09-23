import { Context } from 'hono'
import { RecipeService } from '@/services/recipeService'
import { validateData, createRecipeSchema, updateRecipeSchema, recipeFiltersSchema, paginationSchema } from '@/utils/validation'
import { parsePaginationParams } from '@/utils/pagination'
import { ApiResponse, CreateRecipeData, RecipeFilters, RecipeSort } from '@/types'

export class RecipeController {
  static async createRecipe(c: Context): Promise<Response> {
    const user = c.get('user')
    const body = await c.req.json()
    const recipeData = validateData(createRecipeSchema, body) as CreateRecipeData

    const recipe = await RecipeService.createRecipe(user.id, recipeData)

    const response: ApiResponse = {
      success: true,
      data: recipe,
      message: 'Recipe created successfully and is pending approval',
    }

    return c.json(response, 201)
  }

  static async getRecipes(c: Context): Promise<Response> {
    const query = c.req.query()
    
    // Parse filters
    const filters = validateData(recipeFiltersSchema, {
      category: query.category,
      difficulty: query.difficulty,
      maxPrepTime: query.maxPrepTime ? parseInt(query.maxPrepTime, 10) : undefined,
      maxCookTime: query.maxCookTime ? parseInt(query.maxCookTime, 10) : undefined,
      minRating: query.minRating ? parseFloat(query.minRating) : undefined,
      search: query.search,
    }) as RecipeFilters

    // Parse pagination
    const { cursor, limit } = parsePaginationParams(query.cursor, query.limit)

    // Parse sorting
    const sort: RecipeSort = {
      field: (query.sortBy as any) || 'createdAt',
      direction: (query.sortDirection as 'asc' | 'desc') || 'desc',
    }

    const result = await RecipeService.getRecipes(filters, sort, cursor, limit)

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Recipes retrieved successfully',
    }

    return c.json(response)
  }

  static async getRecipeById(c: Context): Promise<Response> {
    const id = c.req.param('id')
    const recipe = await RecipeService.getRecipeById(id)

    if (!recipe) {
      return c.json(
        {
          success: false,
          error: 'Recipe not found',
          message: 'The requested recipe does not exist',
        },
        404
      )
    }

    const response: ApiResponse = {
      success: true,
      data: recipe,
      message: 'Recipe retrieved successfully',
    }

    return c.json(response)
  }

  static async updateRecipe(c: Context): Promise<Response> {
    const user = c.get('user')
    const id = c.req.param('id')
    const body = await c.req.json()
    const updateData = validateData(updateRecipeSchema, body)

    const recipe = await RecipeService.updateRecipe(id, user.id, updateData)

    const response: ApiResponse = {
      success: true,
      data: recipe,
      message: 'Recipe updated successfully and is pending approval',
    }

    return c.json(response)
  }

  static async deleteRecipe(c: Context): Promise<Response> {
    const user = c.get('user')
    const id = c.req.param('id')

    await RecipeService.deleteRecipe(id, user.id)

    const response: ApiResponse = {
      success: true,
      message: 'Recipe deleted successfully',
    }

    return c.json(response)
  }

  static async searchRecipes(c: Context): Promise<Response> {
    const query = c.req.query()
    
    if (!query.q) {
      return c.json(
        {
          success: false,
          error: 'Search query required',
          message: 'Please provide a search query',
        },
        400
      )
    }

    const filters: RecipeFilters = {
      search: query.q,
      category: query.category,
      difficulty: query.difficulty as any,
      maxPrepTime: query.maxPrepTime ? parseInt(query.maxPrepTime, 10) : undefined,
      maxCookTime: query.maxCookTime ? parseInt(query.maxCookTime, 10) : undefined,
    }

    const { cursor, limit } = parsePaginationParams(query.cursor, query.limit)

    const sort: RecipeSort = {
      field: 'createdAt',
      direction: 'desc',
    }

    const result = await RecipeService.getRecipes(filters, sort, cursor, limit)

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Search completed successfully',
    }

    return c.json(response)
  }
}