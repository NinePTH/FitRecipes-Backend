# FitRecipes Backend API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string (only on errors)
}
```

## Endpoints

### Authentication

#### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Authenticate a user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /auth/profile
Get current user profile. Requires authentication.

#### PUT /auth/profile
Update user profile. Requires authentication.

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Recipes

#### GET /recipes
List recipes with pagination and filtering.

**Query Parameters:**
- `cursor` - Pagination cursor
- `limit` - Number of items per page (max 100)
- `category` - Filter by category ID
- `difficulty` - Filter by difficulty (EASY, MEDIUM, HARD)
- `maxPrepTime` - Filter by maximum prep time in minutes
- `maxCookTime` - Filter by maximum cook time in minutes
- `minRating` - Filter by minimum rating (1-5)
- `search` - Search query for title/description
- `sortBy` - Sort field (createdAt, updatedAt, title, averageRating, prepTime, cookTime)
- `sortDirection` - Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "recipe-id",
        "title": "Avocado Toast",
        "description": "Healthy breakfast option",
        "ingredients": [
          {"name": "Bread", "amount": "2 slices"},
          {"name": "Avocado", "amount": "1 medium"}
        ],
        "instructions": ["Toast bread", "Mash avocado", "Spread on toast"],
        "difficulty": "EASY",
        "prepTime": 5,
        "cookTime": 5,
        "servings": 2,
        "caloriesPerServing": 320,
        "imageUrl": "https://example.com/image.jpg",
        "status": "APPROVED",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "author": {
          "id": "user-id",
          "name": "John Doe",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "category": {
          "id": "category-id",
          "name": "Breakfast"
        },
        "averageRating": 4.5,
        "_count": {
          "ratings": 10,
          "comments": 5,
          "favoritedBy": 3
        }
      }
    ],
    "nextCursor": "next-cursor-id",
    "hasMore": true
  }
}
```

#### GET /recipes/search
Search recipes with query string.

**Query Parameters:**
- `q` - Search query (required)
- All other parameters from GET /recipes

#### GET /recipes/:id
Get a single recipe by ID.

#### POST /recipes
Create a new recipe. Requires authentication.

**Request Body:**
```json
{
  "title": "My Healthy Recipe",
  "description": "A delicious and nutritious meal",
  "ingredients": [
    {"name": "Ingredient 1", "amount": "1 cup", "unit": "cup"},
    {"name": "Ingredient 2", "amount": "2 tbsp"}
  ],
  "instructions": [
    "Step 1: Prepare ingredients",
    "Step 2: Cook for 20 minutes",
    "Step 3: Serve hot"
  ],
  "difficulty": "MEDIUM",
  "prepTime": 15,
  "cookTime": 25,
  "servings": 4,
  "caloriesPerServing": 450,
  "protein": 25.5,
  "carbs": 35.0,
  "fat": 12.5,
  "imageUrl": "https://example.com/recipe-image.jpg",
  "categoryId": "category-id"
}
```

#### PUT /recipes/:id
Update a recipe. Requires authentication and ownership or admin role.

#### DELETE /recipes/:id
Delete a recipe. Requires authentication and ownership or admin role.

### Comments

#### GET /recipes/:recipeId/comments
Get comments for a recipe.

#### POST /recipes/:recipeId/comments
Add a comment to a recipe. Requires authentication.

**Request Body:**
```json
{
  "content": "This recipe is amazing!",
  "parentId": "parent-comment-id" // Optional, for replies
}
```

#### PUT /recipes/:recipeId/comments/:commentId
Update a comment. Requires authentication and ownership.

#### DELETE /recipes/:recipeId/comments/:commentId
Delete a comment. Requires authentication and ownership or admin role.

### Ratings

#### GET /recipes/:recipeId/ratings
Get all ratings for a recipe with statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "id": "rating-id",
        "rating": 5,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "user": {
          "id": "user-id",
          "name": "John Doe",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      }
    ],
    "averageRating": 4.5,
    "totalRatings": 10,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 3,
      "5": 4
    }
  }
}
```

#### GET /recipes/:recipeId/rating
Get current user's rating for a recipe. Requires authentication.

#### POST /recipes/:recipeId/rating
Rate a recipe. Requires authentication.

**Request Body:**
```json
{
  "rating": 5
}
```

#### DELETE /recipes/:recipeId/rating
Remove user's rating for a recipe. Requires authentication.

### Categories

#### GET /categories
Get all categories with recipe counts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "category-id",
      "name": "Breakfast",
      "description": "Healthy breakfast recipes",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "_count": {
        "recipes": 25
      }
    }
  ]
}
```

#### GET /categories/:id
Get a single category by ID.

#### POST /categories
Create a new category. Requires admin role.

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Description of the category"
}
```

#### PUT /categories/:id
Update a category. Requires admin role.

#### DELETE /categories/:id
Delete a category. Requires admin role. Cannot delete categories with existing recipes.

### Admin

#### GET /admin/recipes/pending
Get all pending recipes for approval. Requires admin role.

#### POST /admin/recipes/:recipeId/approve
Approve a pending recipe. Requires admin role.

#### POST /admin/recipes/:recipeId/reject
Reject a pending recipe. Requires admin role.

**Request Body:**
```json
{
  "reason": "Reason for rejection"
}
```

## Error Codes

- `400` - Bad Request (validation errors, missing parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 requests per window per IP
- **Headers**: 
  - `X-RateLimit-Limit` - Request limit
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Reset timestamp

## Pagination

The API uses cursor-based pagination for optimal performance:

1. Make initial request: `GET /recipes`
2. Use `nextCursor` from response for next page: `GET /recipes?cursor={nextCursor}`
3. Continue until `hasMore` is `false`

## Health Check

#### GET /api/health
Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "FitRecipes Backend API is running",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```