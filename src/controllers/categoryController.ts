import { Context } from 'hono'
import { CategoryService } from '@/services/categoryService'
import { ApiResponse } from '@/types'

export class CategoryController {
  static async getCategories(c: Context): Promise<Response> {
    const categories = await CategoryService.getAllCategories()

    const response: ApiResponse = {
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    }

    return c.json(response)
  }

  static async getCategoryById(c: Context): Promise<Response> {
    const id = c.req.param('id')
    const category = await CategoryService.getCategoryById(id)

    if (!category) {
      return c.json(
        {
          success: false,
          error: 'Category not found',
          message: 'The requested category does not exist',
        },
        404
      )
    }

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category retrieved successfully',
    }

    return c.json(response)
  }

  static async createCategory(c: Context): Promise<Response> {
    const body = await c.req.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return c.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Category name is required',
        },
        400
      )
    }

    const category = await CategoryService.createCategory(name, description)

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category created successfully',
    }

    return c.json(response, 201)
  }

  static async updateCategory(c: Context): Promise<Response> {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { name, description } = body

    const updateData: { name?: string; description?: string } = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description

    if (Object.keys(updateData).length === 0) {
      return c.json(
        {
          success: false,
          error: 'No valid fields provided',
          message: 'At least one field must be provided for update',
        },
        400
      )
    }

    const category = await CategoryService.updateCategory(id, updateData)

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category updated successfully',
    }

    return c.json(response)
  }

  static async deleteCategory(c: Context): Promise<Response> {
    const id = c.req.param('id')

    await CategoryService.deleteCategory(id)

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
    }

    return c.json(response)
  }
}