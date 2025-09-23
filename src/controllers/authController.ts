import { Context } from 'hono'
import { AuthService } from '@/services/authService'
import { validateData, registerSchema, loginSchema } from '@/utils/validation'
import { ApiResponse, AuthResponse } from '@/types'

export class AuthController {
  static async register(c: Context): Promise<Response> {
    const body = await c.req.json()
    const { email, password, name } = validateData(registerSchema, body)

    const result = await AuthService.register(email, password, name)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'User registered successfully',
    }

    return c.json(response, 201)
  }

  static async login(c: Context): Promise<Response> {
    const body = await c.req.json()
    const { email, password } = validateData(loginSchema, body)

    const result = await AuthService.login(email, password)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Login successful',
    }

    return c.json(response)
  }

  static async getProfile(c: Context): Promise<Response> {
    const user = c.get('user')
    const userProfile = await AuthService.getUserById(user.id)

    if (!userProfile) {
      return c.json(
        {
          success: false,
          error: 'User not found',
          message: 'User profile not found',
        },
        404
      )
    }

    const response: ApiResponse = {
      success: true,
      data: userProfile,
      message: 'Profile retrieved successfully',
    }

    return c.json(response)
  }

  static async updateProfile(c: Context): Promise<Response> {
    const user = c.get('user')
    const body = await c.req.json()

    // Validate update data
    const allowedFields = ['name', 'avatarUrl']
    const updateData: { name?: string; avatarUrl?: string } = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field as keyof typeof updateData] = body[field]
      }
    }

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

    const updatedUser = await AuthService.updateProfile(user.id, updateData)

    const response: ApiResponse = {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    }

    return c.json(response)
  }

  static async logout(c: Context): Promise<Response> {
    // In a JWT-based system, logout is handled client-side by removing the token
    // For additional security, you could implement a token blacklist here
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    }

    return c.json(response)
  }
}