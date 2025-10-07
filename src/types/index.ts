export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  errors?: string[];
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export enum UserRole {
  USER = 'USER',
  CHEF = 'CHEF',
  ADMIN = 'ADMIN',
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  termsAccepted: boolean;
  isOAuthUser: boolean;
}

export interface RecipeSearchParams {
  ingredients?: string[];
  mealType?: string;
  dietType?: string;
  difficulty?: string;
  mainIngredient?: string;
  cuisineType?: string;
  minPrepTime?: number;
  maxPrepTime?: number;
  sortBy?: 'rating' | 'recent' | 'prepTime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RecipeFilterParams {
  mealType?: string;
  dietType?: string;
  difficulty?: string;
  mainIngredient?: string;
  cuisineType?: string;
  minPrepTime?: number;
  maxPrepTime?: number;
}

export interface FileUploadResult {
  url: string;
  path: string;
  publicUrl: string;
}
