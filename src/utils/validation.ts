import { z } from 'zod'

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Recipe validation schemas
export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.string().min(1, 'Amount is required'),
  unit: z.string().optional(),
})

export const createRecipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(z.string().min(1)).min(1, 'At least one instruction is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  prepTime: z.number().min(0, 'Prep time must be positive'),
  cookTime: z.number().min(0, 'Cook time must be positive'),
  servings: z.number().min(1, 'Servings must be at least 1'),
  caloriesPerServing: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().cuid('Invalid category ID'),
})

export const updateRecipeSchema = createRecipeSchema.partial()

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  parentId: z.string().cuid().optional(),
})

// Rating validation schemas
export const createRatingSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
})

// Search and filter validation schemas
export const recipeFiltersSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  maxPrepTime: z.number().min(0).optional(),
  maxCookTime: z.number().min(0).optional(),
  minRating: z.number().min(1).max(5).optional(),
  search: z.string().optional(),
})

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
})

// Utility function to validate request data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }
    throw error
  }
}