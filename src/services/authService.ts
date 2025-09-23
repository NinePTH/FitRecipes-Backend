import prisma from '@/config/database'
import { hashPassword, comparePassword } from '@/utils/password'
import { generateToken } from '@/utils/jwt'
import { UserWithoutPassword, AuthResponse } from '@/types'
import { UserRole } from '@prisma/client'

export class AuthService {
  static async register(email: string, password: string, name: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user: user as UserWithoutPassword,
      token,
    }
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword as UserWithoutPassword,
      token,
    }
  }

  static async getUserById(userId: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user as UserWithoutPassword | null
  }

  static async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string }
  ): Promise<UserWithoutPassword> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user as UserWithoutPassword
  }
}