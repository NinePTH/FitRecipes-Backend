import { Context } from 'hono'
import { CommentService } from '@/services/commentService'
import { validateData, createCommentSchema } from '@/utils/validation'
import { ApiResponse } from '@/types'

export class CommentController {
  static async createComment(c: Context): Promise<Response> {
    const user = c.get('user')
    const recipeId = c.req.param('recipeId')
    const body = await c.req.json()
    const { content, parentId } = validateData(createCommentSchema, body)

    const comment = await CommentService.createComment(recipeId, user.id, content, parentId)

    const response: ApiResponse = {
      success: true,
      data: comment,
      message: 'Comment created successfully',
    }

    return c.json(response, 201)
  }

  static async getComments(c: Context): Promise<Response> {
    const recipeId = c.req.param('recipeId')
    const comments = await CommentService.getCommentsByRecipeId(recipeId)

    const response: ApiResponse = {
      success: true,
      data: comments,
      message: 'Comments retrieved successfully',
    }

    return c.json(response)
  }

  static async updateComment(c: Context): Promise<Response> {
    const user = c.get('user')
    const commentId = c.req.param('commentId')
    const body = await c.req.json()
    const { content } = validateData(createCommentSchema, body)

    const comment = await CommentService.updateComment(commentId, user.id, content)

    const response: ApiResponse = {
      success: true,
      data: comment,
      message: 'Comment updated successfully',
    }

    return c.json(response)
  }

  static async deleteComment(c: Context): Promise<Response> {
    const user = c.get('user')
    const commentId = c.req.param('commentId')

    await CommentService.deleteComment(commentId, user.id)

    const response: ApiResponse = {
      success: true,
      message: 'Comment deleted successfully',
    }

    return c.json(response)
  }
}