import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Recipe validation schemas
export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient required'),
  instructions: z.array(z.string()).min(1, 'At least one instruction required'),
  prepTime: z.number().min(1, 'Prep time must be positive'),
  cookTime: z.number().min(0, 'Cook time cannot be negative'),
  servings: z.number().min(1, 'Servings must be at least 1'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT']),
  dietType: z.enum([
    'NONE',
    'VEGETARIAN',
    'VEGAN',
    'GLUTEN_FREE',
    'KETO',
    'PALEO',
    'LOW_CARB',
    'DAIRY_FREE',
  ]),
  cuisineType: z.enum([
    'ITALIAN',
    'CHINESE',
    'MEXICAN',
    'INDIAN',
    'JAPANESE',
    'MEDITERRANEAN',
    'AMERICAN',
    'FRENCH',
    'THAI',
    'OTHER',
  ]),
  mainIngredient: z.string().min(1, 'Main ingredient is required'),
});

// Comment validation schemas
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long'),
});

// Rating validation schemas
export const ratingSchema = z.object({
  value: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
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
