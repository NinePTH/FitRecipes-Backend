import { z } from 'zod';

// Password validation helper
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character (!@#$%^&*)'
  );

// User validation schemas
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  agreeToTerms: z
    .boolean()
    .refine(
      (val: boolean) => val === true,
      'Must agree to Terms and Conditions'
    ),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Password reset validation schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

// Recipe validation schemas
const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.string().min(1, 'Ingredient amount is required'),
  unit: z.string().min(1, 'Ingredient unit is required'),
});

const dietaryInfoSchema = z.object({
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isDairyFree: z.boolean().default(false),
  isKeto: z.boolean().default(false),
  isPaleo: z.boolean().default(false),
});

const nutritionInfoSchema = z.object({
  calories: z.number().min(0, 'Calories cannot be negative'),
  protein: z.number().min(0, 'Protein cannot be negative'),
  carbs: z.number().min(0, 'Carbs cannot be negative'),
  fat: z.number().min(0, 'Fat cannot be negative'),
  fiber: z.number().min(0, 'Fiber cannot be negative'),
  sodium: z.number().min(0, 'Sodium cannot be negative'),
});

export const recipeSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  mainIngredient: z
    .string()
    .min(2, 'Main ingredient must be at least 2 characters')
    .max(50, 'Main ingredient must be less than 50 characters'),
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'At least one ingredient is required'),
  instructions: z
    .array(z.string().min(1, 'Instruction step cannot be empty'))
    .min(1, 'At least one instruction step is required'),
  prepTime: z
    .number()
    .min(1, 'Prep time must be at least 1 minute')
    .max(300, 'Prep time must be less than 300 minutes')
    .default(10),
  cookingTime: z
    .number()
    .min(1, 'Cooking time must be at least 1 minute')
    .max(600, 'Cooking time must be less than 600 minutes'),
  servings: z
    .number()
    .min(1, 'Servings must be at least 1')
    .max(20, 'Servings must be less than 20'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }),
  mealType: z
    .array(
      z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT'], {
        errorMap: () => ({
          message:
            'Each meal type must be BREAKFAST, LUNCH, DINNER, SNACK, or DESSERT',
        }),
      })
    )
    .min(1, 'At least one meal type is required')
    .max(5, 'Maximum 5 meal types allowed')
    .default(['DINNER']),
  cuisineType: z.string().optional(),
  dietaryInfo: dietaryInfoSchema, // REQUIRED: Must provide dietary information
  nutritionInfo: nutritionInfoSchema.optional(),
  allergies: z
    .array(
      z
        .string()
        .min(2, 'Allergen name must be at least 2 characters')
        .max(50, 'Allergen name must be less than 50 characters')
        .transform(val => val.trim().toLowerCase())
    )
    .optional(),
  imageUrls: z
    .array(z.string().url('Each image URL must be valid'))
    .max(3, 'Maximum 3 images allowed per recipe')
    .optional()
    .default([]),
});

// Recipe rejection schema
export const rejectRecipeSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
});

// Recipe approval schema (optional admin note)
export const approveRecipeSchema = z.object({
  adminNote: z
    .string()
    .max(500, 'Admin note must be less than 500 characters')
    .optional(),
});

// Comment validation schemas
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters'),
});

// Rating validation schemas
export const ratingSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Search validation
export const searchSchema = z.object({
  ingredients: z.array(z.string()).max(10, 'Maximum 10 ingredients allowed'),
  mealType: z.string().optional(),
  dietType: z.string().optional(),
  difficulty: z.string().optional(),
  cuisineType: z.string().optional(),
  mainIngredient: z.string().optional(),
  minPrepTime: z.number().min(0).optional(),
  maxPrepTime: z.number().min(0).optional(),
  sortBy: z.enum(['rating', 'recent', 'prepTime']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// OAuth validation schemas
export const googleMobileSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

// Google user data validation
export const googleUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  verified_email: z.boolean(),
  name: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  picture: z.string().url(),
});
