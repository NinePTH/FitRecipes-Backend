# Recipe Browse and Recommendation API Specification

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Frontend Repository:** FitRecipes-Frontend  
**Target Backend:** `https://fitrecipes-backend.onrender.com/api/v1`

---

## 📋 Overview

This document specifies the API requirements for implementing Recipe Browse and Recommendation features in the FitRecipes application. The frontend has UI components ready and needs backend endpoints to support filtering, sorting, pagination, and personalized recommendations.

---

## 🎯 Required Endpoints

### 1. **Browse Recipes with Filters** (Primary Endpoint)

#### **Endpoint**
```
GET /api/v1/recipes
```

#### **Description**
Retrieve a paginated list of **APPROVED recipes only** with optional filtering, sorting, and pagination. This endpoint serves as the main recipe discovery API and should exclude PENDING and REJECTED recipes from results.

#### **Authentication**
- Optional (public access allowed)
- If authenticated, can use for personalized sorting

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 12 | Items per page (max: 50) |
| `sortBy` | string | No | `rating` | Sort field (see Sort Options below) |
| `sortOrder` | string | No | `desc` | `asc` or `desc` |
| `mealType` | string[] | No | - | Array of meal types: `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`, `DESSERT` |
| `difficulty` | string[] | No | - | Array: `EASY`, `MEDIUM`, `HARD` |
| `cuisineType` | string | No | - | Single cuisine type (e.g., `Mediterranean`, `Asian`, `Mexican`) |
| `mainIngredient` | string | No | - | Single main ingredient (e.g., `Chicken`, `Quinoa`, `Tofu`) |
| `maxPrepTime` | number | No | - | Maximum total time in minutes (prepTime + cookingTime) |
| `isVegetarian` | boolean | No | - | Filter for vegetarian recipes |
| `isVegan` | boolean | No | - | Filter for vegan recipes |
| `isGlutenFree` | boolean | No | - | Filter for gluten-free recipes |
| `isDairyFree` | boolean | No | - | Filter for dairy-free recipes |
| `isKeto` | boolean | No | - | Filter for keto-friendly recipes |
| `isPaleo` | boolean | No | - | Filter for paleo-friendly recipes |

**Note on Diet Types:** Frontend UI has checkboxes for: `vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `keto`, `paleo`. These should be converted to boolean query parameters (e.g., `isVegetarian=true&isVegan=true`).

#### **Sort Options**

| Frontend Value | Backend Implementation | Description |
|----------------|----------------------|-------------|
| `rating` | Sort by `averageRating DESC` | Highest rated first (default) |
| `recent` | Sort by `createdAt DESC` | Most recently created first |
| `prep-time-asc` | Sort by `(prepTime + cookingTime) ASC` | Shortest prep time first |
| `prep-time-desc` | Sort by `(prepTime + cookingTime) DESC` | Longest prep time first |

#### **Response Format**

```typescript
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "uuid",
        "title": "Mediterranean Quinoa Bowl",
        "description": "A healthy and colorful bowl...",
        "imageUrls": ["https://example.com/image1.jpg"], // Array of image URLs
        "ingredients": [
          {
            "name": "Quinoa",
            "amount": "1",
            "unit": "cup"
          }
        ],
        "instructions": [
          "Step 1: Cook quinoa according to package directions.",
          "Step 2: Chop vegetables."
        ],
        "prepTime": 15, // minutes
        "cookingTime": 20, // minutes (NOT cookTime)
        "servings": 2,
        "difficulty": "EASY", // UPPERCASE
        "mealType": ["LUNCH", "DINNER"], // UPPERCASE array
        "cuisineType": "Mediterranean",
        "mainIngredient": "Quinoa",
        "dietaryInfo": {
          "isVegetarian": true,
          "isVegan": false,
          "isGlutenFree": true,
          "isDairyFree": true,
          "isKeto": false,
          "isPaleo": false
        },
        "nutritionInfo": {
          "calories": 350,
          "protein": 12,
          "carbs": 45,
          "fat": 8,
          "fiber": 6
        },
        "allergies": ["nuts", "soy"], // lowercase array
        "averageRating": 4.5,
        "totalRatings": 12,
        "totalComments": 5,
        "status": "APPROVED", // Only APPROVED recipes in browse
        "author": {
          "id": "uuid",
          "firstName": "Maria",
          "lastName": "Rodriguez",
          "email": "maria@example.com" // Optional for privacy
        },
        "authorId": "uuid",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 48,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Recipes retrieved successfully"
}
```

#### **Error Responses**

**400 Bad Request** - Invalid query parameters
```json
{
  "status": "error",
  "data": null,
  "message": "Invalid query parameters",
  "errors": [
    {
      "code": "INVALID_PARAM",
      "message": "limit must be between 1 and 50",
      "path": ["limit"]
    }
  ]
}
```

**500 Internal Server Error**
```json
{
  "status": "error",
  "data": null,
  "message": "Failed to retrieve recipes"
}
```

---

### 2. **Recommended Recipes** (Personalized)

#### **Endpoint**
```
GET /api/v1/recipes/recommended
```

#### **Description**
Retrieve personalized recipe recommendations based on:
- User's past ratings (if authenticated)
- User's dietary preferences (from profile)
- Popular recipes among similar users
- Trending recipes

If user is not authenticated, return general popular/trending recipes.

#### **Authentication**
- Optional (better recommendations if authenticated)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 12 | Number of recommendations (max: 50) |

#### **Response Format**
Same as Browse Recipes endpoint, but without pagination (single page of recommendations).

```typescript
{
  "status": "success",
  "data": {
    "recipes": [ /* Recipe objects */ ],
    "meta": {
      "recommendationType": "personalized" | "popular", // Indicates recommendation strategy
      "total": 12
    }
  },
  "message": "Recommendations retrieved successfully"
}
```

---

### 3. **Trending Recipes**

#### **Endpoint**
```
GET /api/v1/recipes/trending
```

#### **Description**
Retrieve recipes with high engagement in the last 7-30 days:
- High rating velocity (new ratings)
- High comment activity
- High view count (if tracked)

#### **Authentication**
- Not required (public access)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 12 | Number of trending recipes (max: 50) |
| `period` | string | No | `7d` | Time period: `7d`, `30d` |

#### **Response Format**
Same as Browse Recipes endpoint, but without pagination.

```typescript
{
  "status": "success",
  "data": {
    "recipes": [ /* Recipe objects */ ],
    "meta": {
      "period": "7d",
      "total": 12
    }
  },
  "message": "Trending recipes retrieved successfully"
}
```

---

### 4. **New Recipes**

#### **Endpoint**
```
GET /api/v1/recipes/new
```

#### **Description**
Retrieve recently approved recipes, sorted by `approvedAt` or `createdAt` descending.

#### **Authentication**
- Not required (public access)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 12 | Number of new recipes (max: 50) |

#### **Response Format**
Same as Browse Recipes endpoint, but without pagination.

```typescript
{
  "status": "success",
  "data": {
    "recipes": [ /* Recipe objects */ ],
    "meta": {
      "total": 12
    }
  },
  "message": "New recipes retrieved successfully"
}
```

---

## 🔍 Search Feature (Future Implementation - Ignore for Now)

Search functionality will be implemented in a future phase. The frontend has a search bar and suggestion system, but these are currently non-functional placeholders.

**Future Endpoints (Not Required Yet):**
- `GET /api/v1/recipes/search?q={query}` - Full-text search
- `GET /api/v1/recipes/suggestions?q={query}` - Search autocomplete

---

## 📊 Frontend UI Components

### Current Implementation Status

#### ✅ **Fully Implemented (UI Ready)**

1. **Filter Panel** - Multi-checkbox/select filters:
   - Meal Type (multi-select): BREAKFAST, LUNCH, DINNER, SNACK, DESSERT
   - Diet Type (multi-select): vegetarian, vegan, gluten-free, dairy-free, keto, paleo
   - Difficulty (multi-select): EASY, MEDIUM, HARD
   - Cuisine Type (dropdown): Mediterranean, Asian, Mexican, Italian, etc.
   - Main Ingredient (dropdown): Chicken, Beef, Fish, Vegetables, etc.
   - Prep Time (radio buttons): <15m, <30m, <1h, Any

2. **Sort Dropdown**:
   - Highest Rating (default)
   - Most Recent
   - Prep Time (Low to High)
   - Prep Time (High to Low)

3. **Recipe Cards** - Display:
   - Image with rating badge overlay
   - Title, description
   - Prep time, servings, difficulty
   - Author name
   - Dietary badges (Vegan, Vegetarian, Gluten-Free, etc.)

4. **Active Filters Display** - Removable filter tags

5. **Pagination** - "Load More" button for infinite scroll

6. **Sections**:
   - Recommended for You
   - Trending Recipes
   - New Recipes

#### 🚧 **Placeholder (Not Yet Functional)**
- Search bar with autocomplete suggestions
- Search results display

---

## 🎨 Recipe Card Data Requirements

Each recipe card in the browse page needs the following fields:

**Minimum Required Fields:**
```typescript
{
  id: string;              // For linking to detail page
  title: string;           // Recipe name
  description: string;     // Brief description (2-3 lines)
  imageUrls: string[];     // At least 1 image URL
  averageRating: number;   // For star rating display
  totalRatings: number;    // For "(12 ratings)" display
  prepTime: number;        // In minutes
  cookingTime: number;     // In minutes (will sum with prepTime)
  servings: number;        // Number of servings
  difficulty: "EASY" | "MEDIUM" | "HARD";
  author: {                // For "by Maria" display
    firstName: string;
    lastName: string;
  };
  dietaryInfo: {           // For badge display
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isKeto: boolean;
    isPaleo: boolean;
  };
}
```

---

## 🔧 Implementation Notes

### Filter Logic

**Multiple filters within the same category should use OR logic:**
- `mealType=BREAKFAST&mealType=LUNCH` → Show recipes tagged with BREAKFAST **OR** LUNCH

**Multiple filters across different categories should use AND logic:**
- `mealType=LUNCH&difficulty=EASY` → Show recipes that are LUNCH **AND** EASY

### Diet Type Filters

Frontend sends diet preferences as boolean flags:
```
?isVegetarian=true&isGlutenFree=true
```

Backend should filter recipes where:
```sql
dietaryInfo.isVegetarian = true AND dietaryInfo.isGlutenFree = true
```

### Prep Time Filter

Frontend sends `maxPrepTime` parameter (total time):
```
?maxPrepTime=30
```

Backend should filter:
```sql
(prepTime + cookingTime) <= 30
```

### Default Behavior

**When no filters are applied:**
- Return all APPROVED recipes
- Sort by `averageRating DESC` (highest rated first)
- Limit 12 per page

**When user is authenticated:**
- Recommended section should use personalization
- Can track user preferences for future improvements

---

## 🚀 Performance Requirements

### Response Times (Target)
- Browse recipes: < 500ms for page load
- Load more (pagination): < 300ms
- Recommendations: < 1s (can be slower due to computation)
- Trending: < 500ms

### Optimization Recommendations
1. **Database Indexing:**
   - Index on `status` (filter APPROVED only)
   - Index on `averageRating` (for sorting)
   - Index on `createdAt` (for recent recipes)
   - Composite index on filter combinations (mealType, difficulty, etc.)

2. **Caching:**
   - Cache trending recipes (refresh every 1-6 hours)
   - Cache new recipes (refresh every 15-30 minutes)
   - Cache popular recipes for recommendations

3. **Pagination:**
   - Use cursor-based pagination for large datasets (optional improvement)
   - Current offset-based pagination is acceptable for MVP

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Browse with no filters returns APPROVED recipes only
- [ ] Pagination works correctly (hasNext, hasPrev)
- [ ] Each filter type works independently
- [ ] Multiple filters combine correctly (AND/OR logic)
- [ ] Sort options produce correct order
- [ ] Empty results return proper message
- [ ] Invalid parameters return 400 errors
- [ ] Dietary filters match dietaryInfo object correctly
- [ ] Prep time filter includes both prepTime + cookingTime

### Edge Cases
- [ ] Page beyond totalPages returns empty results
- [ ] Limit > 50 is capped at 50
- [ ] Invalid sortBy value falls back to default
- [ ] Multiple values for same filter work (e.g., ?mealType=LUNCH&mealType=DINNER)
- [ ] Boolean filters handle true/false/missing values

### Performance Tests
- [ ] Response time < 500ms with 1000+ recipes
- [ ] Response time < 1s with multiple filters
- [ ] Pagination performance doesn't degrade with high page numbers

---

## 📝 Example API Calls

### 1. Default Browse (No Filters)
```
GET /api/v1/recipes?page=1&limit=12&sortBy=rating&sortOrder=desc
```

### 2. Filter by Meal Type + Vegetarian
```
GET /api/v1/recipes?mealType=LUNCH&mealType=DINNER&isVegetarian=true&limit=12
```

### 3. Quick Recipes (Under 30 Minutes)
```
GET /api/v1/recipes?maxPrepTime=30&sortBy=prep-time-asc&limit=12
```

### 4. Mediterranean Easy Recipes
```
GET /api/v1/recipes?cuisineType=Mediterranean&difficulty=EASY&limit=12
```

### 5. Vegan + Gluten-Free Breakfast
```
GET /api/v1/recipes?mealType=BREAKFAST&isVegan=true&isGlutenFree=true&limit=12
```

### 6. Load More (Page 2)
```
GET /api/v1/recipes?page=2&limit=12&sortBy=rating&sortOrder=desc
```

### 7. Get Recommendations (Authenticated)
```
GET /api/v1/recipes/recommended?limit=12
Authorization: Bearer {token}
```

### 8. Get Trending Recipes
```
GET /api/v1/recipes/trending?limit=12&period=7d
```

### 9. Get New Recipes
```
GET /api/v1/recipes/new?limit=12
```

---

## 🔗 Related Documentation

- **Admin Recipe Approval API**: See `ADMIN_APPROVAL_API_REQUIREMENTS.md`
- **Recipe Submission API**: See `RECIPE_API_IMPLEMENTATION_GUIDE.md`
- **My Recipes API**: See `MY_RECIPES_API_REQUIREMENTS.md`
- **Frontend Types**: `src/types/index.ts` (lines 64-176)
- **Browse Page Implementation**: `src/pages/BrowseRecipesPage.tsx`

---

## ✅ Acceptance Criteria

1. ✅ **Browse endpoint returns only APPROVED recipes**
2. ✅ **All filter types work independently and in combination**
3. ✅ **Pagination includes hasNext/hasPrev flags**
4. ✅ **Sort options produce correct ordering**
5. ✅ **Recipe cards include all required fields for display**
6. ✅ **Dietary filters use dietaryInfo object correctly**
7. ✅ **Response times meet performance requirements**
8. ✅ **Error handling follows standard backend format**
9. ✅ **Recommended/Trending/New endpoints work without auth**
10. ✅ **API matches existing backend response format (status, data, message)**

---

## 📞 Questions or Clarifications?

Please contact the frontend team if you need:
- Additional filter types
- Different sort options
- Clarification on data structures
- Performance optimization strategies
- Testing assistance

**Frontend Developer**: NinePTH  
**Date**: October 31, 2025
