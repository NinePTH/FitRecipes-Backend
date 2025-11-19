# Frontend Integration Guide - Saved Recipes Feature

This guide provides complete implementation details for the **Saved Recipes** feature where users can save their favorite recipes for quick access later.

## Quick Overview

**Base URL**: `http://localhost:3000/api/v1` (development) | `https://fitrecipes-backend-staging.onrender.com/api/v1` (staging)  
**Authentication**: Required (JWT Bearer token)  
**Authorization**: All authenticated users (USER, CHEF, ADMIN)

---

## API Endpoints

### 1. Save a Recipe
**Endpoint**: `POST /api/v1/recipes/:recipeId/save`  
**Method**: POST  
**Authentication**: Required

#### Request
```typescript
// No request body needed
const recipeId = 'clxxx123';
const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/save`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "id": "cm3qwer123",
    "userId": "cm3abc456",
    "recipeId": "clxxx123",
    "savedAt": "2025-11-19T10:30:00Z",
    "alreadySaved": false
  },
  "message": "Recipe saved successfully"
}
```

#### Response (Already Saved - 200 OK)
```json
{
  "status": "success",
  "data": {
    "id": "cm3qwer123",
    "userId": "cm3abc456",
    "recipeId": "clxxx123",
    "savedAt": "2025-11-19T10:30:00Z",
    "alreadySaved": true
  },
  "message": "Recipe already saved"
}
```

#### Error Response (404 Not Found)
```json
{
  "status": "error",
  "data": null,
  "message": "Recipe not found"
}
```

---

### 2. Unsave a Recipe
**Endpoint**: `DELETE /api/v1/recipes/:recipeId/save`  
**Method**: DELETE  
**Authentication**: Required

#### Request
```typescript
const recipeId = 'clxxx123';
const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/save`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "success": true
  },
  "message": "Recipe removed from saved"
}
```

#### Error Response (404 Not Found)
```json
{
  "status": "error",
  "data": null,
  "message": "Recipe not found in saved collection"
}
```

---

### 3. Check if Recipe is Saved
**Endpoint**: `GET /api/v1/recipes/:recipeId/saved`  
**Method**: GET  
**Authentication**: Required

#### Request
```typescript
const recipeId = 'clxxx123';
const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/saved`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "isSaved": true,
    "savedAt": "2025-11-19T10:30:00Z"
  }
}
```

```json
{
  "status": "success",
  "data": {
    "isSaved": false,
    "savedAt": null
  }
}
```

---

### 4. Bulk Check Saved Status
**Endpoint**: `POST /api/v1/recipes/saved/check`  
**Method**: POST  
**Authentication**: Required

**Use Case**: Check saved status for multiple recipes at once (e.g., on browse page with 20 recipes)

#### Request
```typescript
const recipeIds = ['clxxx123', 'clxxx456', 'clxxx789'];

const response = await fetch(`${API_BASE_URL}/recipes/saved/check`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    recipeIds: recipeIds
  }),
});
```

#### Request Body Validation
- `recipeIds`: Array of strings
- Minimum: 1 recipe ID
- Maximum: 100 recipe IDs (prevents abuse)

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "savedRecipes": [
      {
        "recipeId": "clxxx123",
        "isSaved": true,
        "savedAt": "2025-11-19T10:30:00Z"
      },
      {
        "recipeId": "clxxx456",
        "isSaved": false,
        "savedAt": null
      },
      {
        "recipeId": "clxxx789",
        "isSaved": true,
        "savedAt": "2025-11-18T15:20:00Z"
      }
    ]
  }
}
```

---

### 5. Get User's Saved Recipes
**Endpoint**: `GET /api/v1/users/me/saved-recipes`  
**Method**: GET  
**Authentication**: Required

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (starts from 1) |
| `limit` | number | 20 | Items per page (max 100) |
| `sortBy` | string | 'savedAt' | Sort field: 'savedAt', 'title', 'averageRating' |
| `sortOrder` | string | 'desc' | Sort order: 'asc' or 'desc' |

#### Request
```typescript
const response = await fetch(
  `${API_BASE_URL}/users/me/saved-recipes?page=1&limit=20&sortBy=savedAt&sortOrder=desc`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "clxxx123",
        "title": "Spicy Thai Basil Chicken",
        "description": "Quick and flavorful Thai stir-fry",
        "imageUrl": "https://supabase.co/storage/v1/object/public/recipes/recipe-123.jpg",
        "prepTime": 15,
        "cookingTime": 10,
        "servings": 4,
        "mainIngredient": "Chicken",
        "cuisineType": "Thai",
        "averageRating": 4.8,
        "totalRatings": 156,
        "totalComments": 42,
        "savedAt": "2025-11-19T10:30:00Z",
        "author": {
          "id": "cm3abc456",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Complete React Implementation

### 1. Saved Recipes Page Component

```tsx
import React, { useState, useEffect } from 'react';
import { Heart, Clock, Users, Star } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  prepTime: number;
  cookingTime: number;
  servings: number;
  mainIngredient: string;
  cuisineType: string | null;
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  savedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SavedRecipesData {
  recipes: Recipe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const API_BASE_URL = 'http://localhost:3000/api/v1';

export default function SavedRecipesPage() {
  const [data, setData] = useState<SavedRecipesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSavedRecipes();
  }, [currentPage, sortBy, sortOrder]);

  async function loadSavedRecipes() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/users/me/saved-recipes?page=${currentPage}&limit=20&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load saved recipes');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function unsaveRecipe(recipeId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/save`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unsave recipe');
      }

      // Reload the list
      loadSavedRecipes();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading saved recipes...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!data || data.recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          No Saved Recipes Yet
        </h2>
        <p className="text-gray-500">
          Start saving recipes to build your personal collection!
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Saved Recipes
        </h1>
        <p className="text-gray-600">
          {data.pagination.total} recipe{data.pagination.total !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Sort Controls */}
      <div className="mb-6 flex gap-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="savedAt">Recently Saved</option>
          <option value="title">Recipe Name</option>
          <option value="averageRating">Rating</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="desc">High to Low</option>
          <option value="asc">Low to High</option>
        </select>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {data.recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={recipe.imageUrl || '/placeholder.jpg'}
              alt={recipe.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {recipe.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {recipe.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.prepTime + recipe.cookingTime}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{recipe.averageRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Saved {new Date(recipe.savedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => unsaveRecipe(recipe.id)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  <span className="text-sm">Unsave</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!data.pagination.hasPrev}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!data.pagination.hasNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 2. Save Button Component (Reusable)

```tsx
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface SaveButtonProps {
  recipeId: string;
  className?: string;
  showText?: boolean;
}

const API_BASE_URL = 'http://localhost:3000/api/v1';

export function SaveButton({ recipeId, className = '', showText = true }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSavedStatus();
  }, [recipeId]);

  async function checkSavedStatus() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setIsSaved(result.data.isSaved);
      }
    } catch (err) {
      console.error('Failed to check saved status:', err);
    }
  }

  async function toggleSave() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/save`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`flex items-center gap-2 transition-colors ${className}`}
    >
      <Heart
        className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
      />
      {showText && (
        <span>{isSaved ? 'Saved' : 'Save'}</span>
      )}
    </button>
  );
}
```

---

### 3. Bulk Check on Browse Page

```tsx
import React, { useState, useEffect } from 'react';

interface Recipe {
  id: string;
  title: string;
  // ... other fields
}

const API_BASE_URL = 'http://localhost:3000/api/v1';

export function BrowseRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    // Fetch recipes from browse endpoint
    const response = await fetch(`${API_BASE_URL}/recipes?page=1&limit=20`);
    const result = await response.json();
    const fetchedRecipes = result.data.recipes;
    
    setRecipes(fetchedRecipes);

    // Bulk check saved status
    await checkBulkSavedStatus(fetchedRecipes.map((r: Recipe) => r.id));
  }

  async function checkBulkSavedStatus(recipeIds: string[]) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/recipes/saved/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeIds }),
      });

      if (response.ok) {
        const result = await response.json();
        const statusMap: Record<string, boolean> = {};
        
        result.data.savedRecipes.forEach((item: any) => {
          statusMap[item.recipeId] = item.isSaved;
        });

        setSavedStatus(statusMap);
      }
    } catch (err) {
      console.error('Failed to check saved status:', err);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="border rounded-lg p-4">
          <h3>{recipe.title}</h3>
          <button
            onClick={() => toggleSave(recipe.id)}
            className={savedStatus[recipe.id] ? 'text-red-500' : 'text-gray-400'}
          >
            {savedStatus[recipe.id] ? '❤️ Saved' : '🤍 Save'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// API Response Types
interface SaveRecipeResponse {
  status: 'success';
  data: {
    id: string;
    userId: string;
    recipeId: string;
    savedAt: string;
    alreadySaved: boolean;
  };
  message: string;
}

interface CheckSavedResponse {
  status: 'success';
  data: {
    isSaved: boolean;
    savedAt: string | null;
  };
}

interface BulkCheckSavedResponse {
  status: 'success';
  data: {
    savedRecipes: Array<{
      recipeId: string;
      isSaved: boolean;
      savedAt: string | null;
    }>;
  };
}

interface SavedRecipesResponse {
  status: 'success';
  data: {
    recipes: Array<{
      id: string;
      title: string;
      description: string;
      imageUrl: string | null;
      prepTime: number;
      cookingTime: number;
      servings: number;
      mainIngredient: string;
      cuisineType: string | null;
      averageRating: number;
      totalRatings: number;
      totalComments: number;
      savedAt: string;
      author: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

---

## API Service Class

```typescript
class SavedRecipesAPI {
  private baseURL = 'http://localhost:3000/api/v1';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async saveRecipe(recipeId: string): Promise<SaveRecipeResponse> {
    const response = await fetch(`${this.baseURL}/recipes/${recipeId}/save`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to save recipe');
    }

    return response.json();
  }

  async unsaveRecipe(recipeId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/recipes/${recipeId}/save`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unsave recipe');
    }
  }

  async checkSaved(recipeId: string): Promise<CheckSavedResponse> {
    const response = await fetch(`${this.baseURL}/recipes/${recipeId}/saved`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check saved status');
    }

    return response.json();
  }

  async bulkCheckSaved(recipeIds: string[]): Promise<BulkCheckSavedResponse> {
    const response = await fetch(`${this.baseURL}/recipes/saved/check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ recipeIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk check saved status');
    }

    return response.json();
  }

  async getSavedRecipes(
    page = 1,
    limit = 20,
    sortBy = 'savedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<SavedRecipesResponse> {
    const response = await fetch(
      `${this.baseURL}/users/me/saved-recipes?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch saved recipes');
    }

    return response.json();
  }
}

// Export singleton instance
export const savedRecipesAPI = new SavedRecipesAPI();
```

---

## React Hook for Saved Recipes

```typescript
import { useState, useEffect } from 'react';
import { savedRecipesAPI } from './api';

export function useSavedRecipe(recipeId: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [recipeId]);

  async function checkStatus() {
    try {
      const result = await savedRecipesAPI.checkSaved(recipeId);
      setIsSaved(result.data.isSaved);
    } catch (err) {
      console.error('Failed to check saved status:', err);
    }
  }

  async function toggleSave() {
    setLoading(true);
    try {
      if (isSaved) {
        await savedRecipesAPI.unsaveRecipe(recipeId);
      } else {
        await savedRecipesAPI.saveRecipe(recipeId);
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setLoading(false);
    }
  }

  return { isSaved, loading, toggleSave };
}

// Usage
function RecipeCard({ recipeId }: { recipeId: string }) {
  const { isSaved, loading, toggleSave } = useSavedRecipe(recipeId);

  return (
    <button onClick={toggleSave} disabled={loading}>
      {isSaved ? '❤️ Saved' : '🤍 Save'}
    </button>
  );
}
```

---

## Performance Optimization

### 1. Caching Strategy

```typescript
class SavedRecipesCache {
  private cache: Map<string, { isSaved: boolean; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(recipeId: string) {
    const cached = this.cache.get(recipeId);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(recipeId);
      return null;
    }

    return cached.isSaved;
  }

  set(recipeId: string, isSaved: boolean) {
    this.cache.set(recipeId, {
      isSaved,
      timestamp: Date.now(),
    });
  }

  invalidate(recipeId: string) {
    this.cache.delete(recipeId);
  }

  clear() {
    this.cache.clear();
  }
}

export const savedRecipesCache = new SavedRecipesCache();
```

### 2. Optimistic Updates

```typescript
async function optimisticToggleSave(recipeId: string, currentState: boolean) {
  // Update UI immediately
  setIsSaved(!currentState);

  try {
    // Make API call in background
    if (currentState) {
      await savedRecipesAPI.unsaveRecipe(recipeId);
    } else {
      await savedRecipesAPI.saveRecipe(recipeId);
    }
  } catch (err) {
    // Revert on error
    setIsSaved(currentState);
    alert('Failed to update saved status');
  }
}
```

---

## Error Handling

```typescript
async function handleSaveRecipe(recipeId: string) {
  try {
    const result = await savedRecipesAPI.saveRecipe(recipeId);
    
    if (result.data.alreadySaved) {
      console.log('Recipe was already saved');
    } else {
      console.log('Recipe saved successfully');
    }
  } catch (err: any) {
    if (err.message.includes('404')) {
      alert('Recipe not found');
    } else if (err.message.includes('401')) {
      alert('Please login to save recipes');
      // Redirect to login
    } else {
      alert('Failed to save recipe. Please try again.');
    }
  }
}
```

---

## Testing Examples

### Unit Test (Jest)

```typescript
import { savedRecipesAPI } from './api';

describe('SavedRecipesAPI', () => {
  it('should save a recipe', async () => {
    const result = await savedRecipesAPI.saveRecipe('recipe123');
    
    expect(result.status).toBe('success');
    expect(result.data.recipeId).toBe('recipe123');
    expect(result.message).toBe('Recipe saved successfully');
  });

  it('should check saved status', async () => {
    const result = await savedRecipesAPI.checkSaved('recipe123');
    
    expect(result.data).toHaveProperty('isSaved');
    expect(result.data).toHaveProperty('savedAt');
  });

  it('should bulk check multiple recipes', async () => {
    const recipeIds = ['recipe1', 'recipe2', 'recipe3'];
    const result = await savedRecipesAPI.bulkCheckSaved(recipeIds);
    
    expect(result.data.savedRecipes).toHaveLength(3);
    expect(result.data.savedRecipes[0]).toHaveProperty('recipeId');
    expect(result.data.savedRecipes[0]).toHaveProperty('isSaved');
  });
});
```

---

## Important Notes

### 1. Authentication
- All endpoints require JWT authentication via Bearer token
- Token should be included in `Authorization` header
- 401 error means user needs to login

### 2. Idempotent Operations
- Saving an already-saved recipe returns `alreadySaved: true` (not an error)
- Unsaving a non-saved recipe returns 404 error

### 3. Performance
- Use bulk check endpoint when displaying multiple recipes (browse page)
- Avoid individual checks for each recipe (N+1 query problem)
- Consider implementing caching for frequently accessed recipes

### 4. Pagination
- Default limit: 20 recipes per page
- Maximum limit: 100 recipes per page
- Page numbers start from 1

### 5. Trending Algorithm Integration
- Saved recipes now contribute to trending score
- Recent saves (7/30 days) are counted alongside ratings and comments
- This makes trending more comprehensive and user-engagement focused

---

## Summary

The Saved Recipes feature provides:
- ✅ Save/unsave recipes (idempotent operations)
- ✅ Check saved status (single and bulk)
- ✅ View saved collection with pagination and sorting
- ✅ Integration with trending algorithm
- ✅ Optimized for performance (bulk operations)
- ✅ Full authentication and authorization

For questions or issues, refer to the backend repository: `FitRecipes-Backend/docs`
