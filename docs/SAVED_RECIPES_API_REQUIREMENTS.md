# Saved Recipes Feature - Backend API Specification

## Overview

The Saved Recipes feature allows users to bookmark/save their favorite recipes for quick access later. Users can save recipes from browse pages or recipe detail pages, view their saved collection in a sidebar, and manage (remove) saved recipes.

**Current Status**: Frontend implemented with localStorage persistence (mock data). Backend API integration required.

---

## User Stories

1. **As a user**, I want to save recipes I'm interested in so I can easily find them later
2. **As a user**, I want to see all my saved recipes in one place
3. **As a user**, I want to remove recipes from my saved collection
4. **As a user**, I want to see if a recipe is already saved when browsing
5. **As a user**, I want my saved recipes to persist across sessions and devices

---

## API Endpoints

### 1. Save a Recipe

**Endpoint**: `POST /api/v1/recipes/:recipeId/save`

**Authentication**: Required (JWT token)

**Description**: Saves a recipe to the user's collection. If already saved, this is idempotent (no error).

**Request**:
```http
POST /api/v1/recipes/507f1f77bcf86cd799439011/save
Authorization: Bearer <jwt_token>
```

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "message": "Recipe saved successfully",
  "data": {
    "recipeId": "507f1f77bcf86cd799439011",
    "savedAt": "2025-11-19T10:30:00.000Z"
  }
}
```

**Response** (Already Saved - 200 OK):
```json
{
  "success": true,
  "message": "Recipe already saved",
  "data": {
    "recipeId": "507f1f77bcf86cd799439011",
    "savedAt": "2025-11-15T08:20:00.000Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Recipe does not exist
- `500 Internal Server Error`: Server error

---

### 2. Unsave a Recipe

**Endpoint**: `DELETE /api/v1/recipes/:recipeId/save`

**Authentication**: Required (JWT token)

**Description**: Removes a recipe from the user's saved collection.

**Request**:
```http
DELETE /api/v1/recipes/507f1f77bcf86cd799439011/save
Authorization: Bearer <jwt_token>
```

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "message": "Recipe removed from saved",
  "data": {
    "recipeId": "507f1f77bcf86cd799439011"
  }
}
```

**Response** (Not Saved - 404 Not Found):
```json
{
  "success": false,
  "message": "Recipe not found in saved collection"
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

### 3. Get User's Saved Recipes

**Endpoint**: `GET /api/v1/users/me/saved-recipes`

**Authentication**: Required (JWT token)

**Description**: Retrieves all recipes saved by the authenticated user with pagination.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `sortBy` (optional, default: 'savedAt'): Sort field ('savedAt', 'title', 'rating')
- `sortOrder` (optional, default: 'desc'): 'asc' or 'desc'

**Request**:
```http
GET /api/v1/users/me/saved-recipes?page=1&limit=20&sortBy=savedAt&sortOrder=desc
Authorization: Bearer <jwt_token>
```

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Quinoa Buddha Bowl",
        "description": "A nutritious and colorful bowl packed with protein and vegetables",
        "prepTime": 15,
        "cookingTime": 20,
        "difficulty": "EASY",
        "averageRating": 4.8,
        "imageUrl": "https://storage.example.com/recipes/quinoa-bowl.jpg",
        "imageUrls": ["https://storage.example.com/recipes/quinoa-bowl.jpg"],
        "author": {
          "id": "507f1f77bcf86cd799439012",
          "firstName": "Sarah",
          "lastName": "Chen",
          "email": "sarah@example.com",
          "role": "CHEF"
        },
        "dietaryInfo": {
          "isVegan": true,
          "isVegetarian": true,
          "isGlutenFree": true,
          "isDairyFree": false,
          "isKeto": false,
          "isPaleo": false
        },
        "savedAt": "2025-11-19T10:30:00.000Z"
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "title": "Mediterranean Grilled Salmon",
        "description": "Fresh salmon with herbs and lemon, served with roasted vegetables",
        "prepTime": 10,
        "cookingTime": 15,
        "difficulty": "MEDIUM",
        "averageRating": 4.9,
        "imageUrl": "https://storage.example.com/recipes/salmon.jpg",
        "imageUrls": ["https://storage.example.com/recipes/salmon.jpg"],
        "author": {
          "id": "507f1f77bcf86cd799439014",
          "firstName": "Marco",
          "lastName": "Rossi",
          "email": "marco@example.com",
          "role": "CHEF"
        },
        "dietaryInfo": {
          "isVegan": false,
          "isVegetarian": false,
          "isGlutenFree": true,
          "isDairyFree": true,
          "isKeto": false,
          "isPaleo": true
        },
        "savedAt": "2025-11-18T14:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalRecipes": 2,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

### 4. Check if Recipe is Saved

**Endpoint**: `GET /api/v1/recipes/:recipeId/saved`

**Authentication**: Required (JWT token)

**Description**: Checks if a specific recipe is saved by the authenticated user.

**Request**:
```http
GET /api/v1/recipes/507f1f77bcf86cd799439011/saved
Authorization: Bearer <jwt_token>
```

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "data": {
    "recipeId": "507f1f77bcf86cd799439011",
    "isSaved": true,
    "savedAt": "2025-11-19T10:30:00.000Z"
  }
}
```

**Response** (Not Saved - 200 OK):
```json
{
  "success": true,
  "data": {
    "recipeId": "507f1f77bcf86cd799439011",
    "isSaved": false,
    "savedAt": null
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Recipe does not exist
- `500 Internal Server Error`: Server error

---

### 5. Bulk Check Saved Status (Optional - Performance Optimization)

**Endpoint**: `POST /api/v1/recipes/saved/check`

**Authentication**: Required (JWT token)

**Description**: Checks saved status for multiple recipes at once (useful for browse pages).

**Request**:
```http
POST /api/v1/recipes/saved/check
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipeIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439015"
  ]
}
```

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "data": {
    "savedRecipes": {
      "507f1f77bcf86cd799439011": true,
      "507f1f77bcf86cd799439013": false,
      "507f1f77bcf86cd799439015": true
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request body (e.g., recipeIds not an array)
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

## Database Schema

### SavedRecipe Collection/Table

```typescript
{
  id: string;              // Unique identifier
  userId: string;          // Reference to User
  recipeId: string;        // Reference to Recipe
  savedAt: Date;           // Timestamp when saved
  createdAt: Date;         // Record creation timestamp
  updatedAt: Date;         // Record update timestamp
}
```

**Indexes**:
- `userId` + `recipeId` (unique composite index) - Prevent duplicate saves
- `userId` + `savedAt` (desc) - Fast retrieval of user's saved recipes
- `recipeId` - Fast lookup for checking if recipe is saved

**Constraints**:
- `userId` and `recipeId` must be valid references
- Unique constraint on `(userId, recipeId)` combination

---

## Business Rules

1. **Authentication Required**: All saved recipe operations require user authentication
2. **Recipe Existence**: Cannot save a recipe that doesn't exist (404 error)
3. **No Duplicates**: Saving an already-saved recipe is idempotent (no error, returns existing save)
4. **Soft Delete**: Consider implementing soft delete for analytics (track what users unsave)
5. **Limit**: Consider implementing a maximum limit per user (e.g., 500 saved recipes)

---

## Frontend Integration Points

### Current Implementation

The frontend currently uses:
- **Context**: `SavedRecipesContext` (provides state and functions)
- **Hook**: `useSavedRecipes()` (access context)
- **Storage**: `localStorage` with key `fitrecipes_saved`
- **Mock Data**: 2 sample recipes for demonstration

### Integration Steps

1. **Create API Service** (`src/services/savedRecipesApi.ts`):
```typescript
import { apiClient } from './api';
import type { Recipe } from '@/types';

export const savedRecipesApi = {
  // Save a recipe
  saveRecipe: async (recipeId: string) => {
    const response = await apiClient.post(`/recipes/${recipeId}/save`);
    return response.data;
  },

  // Unsave a recipe
  unsaveRecipe: async (recipeId: string) => {
    const response = await apiClient.delete(`/recipes/${recipeId}/save`);
    return response.data;
  },

  // Get all saved recipes
  getSavedRecipes: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get('/users/me/saved-recipes', { params });
    return response.data;
  },

  // Check if recipe is saved
  checkSaved: async (recipeId: string) => {
    const response = await apiClient.get(`/recipes/${recipeId}/saved`);
    return response.data;
  },

  // Bulk check saved status
  bulkCheckSaved: async (recipeIds: string[]) => {
    const response = await apiClient.post('/recipes/saved/check', { recipeIds });
    return response.data;
  },
};
```

2. **Update SavedRecipesContext** (`src/contexts/SavedRecipesContext.tsx`):
   - Replace localStorage with API calls
   - Add loading and error states
   - Implement optimistic updates for better UX
   - Keep localStorage as cache/fallback

3. **Add Loading States**:
   - Show skeleton loaders in sidebar while fetching
   - Disable save button during API call
   - Show toast notifications for errors

4. **Sync Strategy**:
   - On app mount: Fetch saved recipes from API
   - On save/unsave: Optimistic update + API call
   - On error: Revert optimistic update + show error message
   - Periodic sync: Refresh every 5 minutes or on focus

---

## UI Components Affected

1. **SavedRecipesIcon** (`src/components/SavedRecipesIcon.tsx`)
   - Navbar icon showing saved recipes count
   - Opens SavedRecipesSidebar on click

2. **SavedRecipesSidebar** (`src/components/SavedRecipesSidebar.tsx`)
   - Desktop: Dropdown (max-height 96, scrollable)
   - Mobile: Slide-in sidebar (full height)
   - Features: Clear all, individual remove, click to view recipe

3. **Recipe Cards** (`src/pages/BrowseRecipesPage.tsx`)
   - Bookmark button (top-left, next to rating)
   - Shows filled bookmark if saved
   - Click to toggle save status

4. **Recipe Detail Page** (`src/pages/RecipeDetailPage.tsx`)
   - Save button next to Share button
   - Shows "Saved" vs "Save" text
   - Filled bookmark icon when saved

---

## Error Handling

### Frontend Error Scenarios

1. **Save Failed**:
   - Revert optimistic update
   - Show toast: "Failed to save recipe. Please try again."
   - Log error for debugging

2. **Network Error**:
   - Queue operation for retry
   - Show toast: "You're offline. Changes will sync when online."
   - Keep localStorage in sync

3. **Recipe Not Found**:
   - Show toast: "Recipe no longer available"
   - Remove from saved list

4. **Unauthorized**:
   - Redirect to login
   - Preserve intended action for after login

### Backend Error Responses

All errors should follow the standard format:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

---

## Performance Considerations

1. **Pagination**: Implement pagination for saved recipes list (20 per page)
2. **Caching**: Use React Query or similar for API response caching
3. **Optimistic Updates**: Update UI immediately, sync with backend in background
4. **Bulk Operations**: Use bulk check endpoint for browse pages (check 20 recipes at once)
5. **Debouncing**: Debounce rapid save/unsave clicks (300ms)
6. **Image Optimization**: Serve thumbnail images in sidebar (not full-size)

---

## Security Considerations

1. **Authentication**: Verify JWT token on all endpoints
2. **Authorization**: Users can only save/view their own recipes
3. **Rate Limiting**: Limit save operations (e.g., 100 per hour per user)
4. **Input Validation**: Validate recipeId format (MongoDB ObjectId, UUID, etc.)
5. **CSRF Protection**: Use CSRF tokens if not using JWT

---

## Testing Requirements

### Backend Tests

1. **Unit Tests**:
   - Save recipe (new save)
   - Save recipe (already saved - idempotent)
   - Unsave recipe
   - Unsave recipe (not saved - 404)
   - Get saved recipes (empty list)
   - Get saved recipes (with data)
   - Check saved status (saved)
   - Check saved status (not saved)
   - Bulk check saved status

2. **Integration Tests**:
   - Full save → unsave flow
   - Pagination
   - Sorting
   - Authentication failures
   - Recipe not found scenarios

3. **Load Tests**:
   - 1000 users each saving 100 recipes
   - Concurrent save/unsave operations
   - Bulk check with 100 recipe IDs

### Frontend Tests

1. **Component Tests**:
   - SavedRecipesIcon renders count correctly
   - SavedRecipesSidebar shows empty state
   - SavedRecipesSidebar shows saved recipes
   - Save button toggles state
   - Clear all confirmation

2. **Integration Tests**:
   - Save recipe from browse page
   - Save recipe from detail page
   - View saved recipes in sidebar
   - Remove recipe from sidebar
   - Navigation from sidebar to recipe detail

---

## Migration Plan

### Phase 1: Backend Implementation
1. Create SavedRecipe database schema
2. Implement all 5 API endpoints
3. Write unit and integration tests
4. Deploy to staging

### Phase 2: Frontend Integration
1. Create savedRecipesApi service
2. Update SavedRecipesContext to use API
3. Add loading and error states
4. Implement optimistic updates
5. Add error handling and retries

### Phase 3: Data Migration
1. No data migration needed (currently localStorage only)
2. Users will start fresh with saved recipes

### Phase 4: Testing & Deployment
1. QA testing on staging
2. Monitor API performance
3. Deploy to production
4. Monitor error rates

---

## Success Metrics

1. **API Performance**:
   - Save/unsave response time < 200ms
   - Get saved recipes response time < 500ms
   - 99.9% uptime

2. **User Engagement**:
   - % of users who save at least 1 recipe
   - Average number of saved recipes per user
   - Save → recipe view conversion rate

3. **Error Rates**:
   - API error rate < 0.1%
   - Failed save operations < 0.5%

---

## Future Enhancements

1. **Collections**: Organize saved recipes into custom collections/folders
2. **Sharing**: Share saved recipe collections with other users
3. **Notifications**: Notify when a saved recipe is updated
4. **Export**: Export saved recipes as PDF or shopping list
5. **Recommendations**: Suggest recipes based on saved recipes
6. **Analytics**: Track most-saved recipes, trending saves

---

## Notes for Backend Team

- Frontend is ready for integration (all UI components implemented)
- Currently using mock data and localStorage
- All components follow existing Recipe type structure
- JWT authentication already implemented in app
- API client configured at `src/services/api.ts`
- Error handling follows standard app patterns

**Priority**: Medium-High (user-requested feature, enhances engagement)

**Estimated Effort**: 2-3 days (backend implementation + testing)
