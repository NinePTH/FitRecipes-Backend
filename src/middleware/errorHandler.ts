import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    console.error('Error:', error)

    if (error instanceof HTTPException) {
      return c.json(
        {
          success: false,
          error: error.message,
          message: 'Request failed',
        },
        error.status
      )
    }

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return c.json(
          {
            success: false,
            error: 'Validation Error',
            message: error.message,
          },
          400
        )
      }

      // Handle Prisma errors
      if (error.message.includes('Unique constraint')) {
        return c.json(
          {
            success: false,
            error: 'Conflict',
            message: 'Resource already exists',
          },
          409
        )
      }

      if (error.message.includes('Record to update not found')) {
        return c.json(
          {
            success: false,
            error: 'Not Found',
            message: 'Resource not found',
          },
          404
        )
      }
    }

    // Generic server error
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Something went wrong',
      },
      500
    )
  }
}