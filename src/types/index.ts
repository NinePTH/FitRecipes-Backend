import { User, Recipe, Comment, Rating, Category } from '@prisma/client'

// User types
export interface UserWithoutPassword extends Omit<User, 'passwordHash'> {}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

// Recipe types
export interface RecipeWithAuthor extends Recipe {
  author: UserWithoutPassword
  category: Category
  ratings: Rating[]
  comments: Comment[]
  _count?: {
    ratings: number
    comments: number
    favoritedBy: number
  }
  averageRating?: number
}

export interface CreateRecipeData {
  title: string
  description?: string
  ingredients: IngredientItem[]
  instructions: string[]
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  prepTime: number
  cookTime: number
  servings: number
  caloriesPerServing?: number
  protein?: number
  carbs?: number
  fat?: number
  imageUrl?: string
  categoryId: string
}

export interface IngredientItem {
  name: string
  amount: string
  unit?: string
}

// Pagination types
export interface PaginationParams {
  cursor?: string
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}

// Search and filter types
export interface RecipeFilters {
  category?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  maxPrepTime?: number
  maxCookTime?: number
  minRating?: number
  search?: string
}

export interface RecipeSort {
  field: 'createdAt' | 'updatedAt' | 'title' | 'averageRating' | 'prepTime' | 'cookTime'
  direction: 'asc' | 'desc'
}

// Comment types
export interface CommentWithAuthor extends Comment {
  author: UserWithoutPassword
  replies?: CommentWithAuthor[]
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  user: UserWithoutPassword
  token: string
}

// Error types
export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: any
}