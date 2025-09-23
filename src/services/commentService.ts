import prisma from '@/config/database'
import { CommentWithAuthor } from '@/types'

export class CommentService {
  static async createComment(recipeId: string, userId: string, content: string, parentId?: string) {
    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    if (!recipe) {
      throw new Error('Recipe not found')
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment || parentComment.recipeId !== recipeId) {
        throw new Error('Parent comment not found')
      }
    }

    return prisma.comment.create({
      data: {
        content,
        recipeId,
        userId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  static async getCommentsByRecipeId(recipeId: string): Promise<CommentWithAuthor[]> {
    const comments = await prisma.comment.findMany({
      where: {
        recipeId,
        parentId: null, // Only top-level comments
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
        replies: {
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
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return comments as CommentWithAuthor[]
  }

  static async updateComment(id: string, userId: string, content: string) {
    // Check if user owns the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.userId !== userId) {
      throw new Error('You can only edit your own comments')
    }

    return prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  static async deleteComment(id: string, userId: string) {
    // Check if user owns the comment or is admin
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('User not found')
    }

    if (comment.userId !== userId && user.role !== 'ADMIN') {
      throw new Error('You can only delete your own comments')
    }

    return prisma.comment.delete({
      where: { id },
    })
  }
}