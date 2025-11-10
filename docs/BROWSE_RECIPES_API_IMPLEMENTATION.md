# Browse Recipes API Implementation Guide

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Status:** ✅ Fully Implemented  
**Backend Repository:** FitRecipes-Backend  
**Base URL:** `http://localhost:3000/api/v1` (Development) | `https://fitrecipes-backend.onrender.com/api/v1` (Production)

---

## 📋 Overview

This document provides the complete API specification for the Browse Recipes features implemented in the FitRecipes backend. All endpoints are **fully functional and tested**.

---

## 🎯 Implemented Endpoints

1. `GET /api/v1/recipes` - Browse recipes with filters, sorting, and pagination
2. `GET /api/v1/recipes/recommended` - Get personalized recipe recommendations
3. `GET /api/v1/recipes/trending` - Get trending recipes based on recent engagement
4. `GET /api/v1/recipes/new` - Get recently approved recipes

---

## 🔐 Authentication

All browse endpoints are **public** (no authentication required). However, authenticated users may receive enhanced results (e.g., personalized recommendations).

---

## 📊 Browse Recipes Endpoints

### 1. Browse Recipes with Filters

#### **Endpoint**
```
GET /api/v1/recipes
```

#### **Description**
Browse and filter recipes with comprehensive filtering, sorting, and pagination capabilities. Returns only **APPROVED** recipes.

#### **Authentication**
❌ Not required (public access)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 12 | Items per page (max: 50) |
| `sortBy` | string | No | `rating` | Sort field (see Sort Options below) |
| `sortOrder` | string | No | `desc` | Sort order: `asc` or `desc` |
| `mealType` | string[] | No | - | Filter by meal types (multiple allowed) |
| `difficulty` | string[] | No | - | Filter by difficulty levels (multiple allowed) |
| `cuisineType` | string | No | - | Filter by cuisine type (single value) |
| `mainIngredient` | string | No | - | Filter by main ingredient (single value) |
| `maxPrepTime` | number | No | - | Maximum total time in minutes (prepTime + cookingTime) |
| `isVegetarian` | boolean | No | - | Filter for vegetarian recipes |
| `isVegan` | boolean | No | - | Filter for vegan recipes |
| `isGlutenFree` | boolean | No | - | Filter for gluten-free recipes |
| `isDairyFree` | boolean | No | - | Filter for dairy-free recipes |
| `isKeto` | boolean | No | - | Filter for keto-friendly recipes |
| `isPaleo` | boolean | No | - | Filter for paleo-friendly recipes |

#### **Filter Details**

**Meal Type Filter** (Multiple Selection - OR Logic)
- Possible values: `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`, `DESSERT`
- Multiple values: `?mealType=BREAKFAST&mealType=LUNCH`
- Returns recipes that match ANY of the specified meal types

**Difficulty Filter** (Multiple Selection - OR Logic)
- Possible values: `EASY`, `MEDIUM`, `HARD`
- Multiple values: `?difficulty=EASY&difficulty=MEDIUM`
- Returns recipes that match ANY of the specified difficulty levels

**Cuisine Type Filter** (Single Value)
- Examples: `Mediterranean`, `Italian`, `Mexican`, `Thai`, `Chinese`, etc.
- Case-insensitive partial match
- Example: `?cuisineType=Mediterranean`

**Main Ingredient Filter** (Single Value)
- Examples: `Chicken`, `Quinoa`, `Tofu`, `Salmon`, etc.
- Case-insensitive partial match
- Example: `?mainIngredient=Chicken`

**Prep Time Filter**
- Total time = `prepTime + cookingTime`
- Example: `?maxPrepTime=30` returns recipes with total time ≤ 30 minutes

**Dietary Filters** (Boolean)
- Send as boolean query parameters: `?isVegetarian=true&isGlutenFree=true`
- Only include if you want to filter by that dietary preference
- Multiple dietary filters use AND logic (must match all specified)

#### **Sort Options**

| Sort Value | Backend Implementation | Description |
|------------|----------------------|-------------|
| `rating` | Sort by `averageRating DESC` | Highest rated first (default) |
| `recent` | Sort by `createdAt DESC` | Most recently created first |
| `prep-time-asc` | Sort by `prepTime ASC` | Shortest prep time first |
| `prep-time-desc` | Sort by `prepTime DESC` | Longest prep time first |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "cmheoqu4u000jufys3uynv1c4",
        "title": "Mediterranean Quinoa Bowl",
        "description": "A healthy and colorful bowl packed with nutrients...",
        "imageUrls": [
          "https://fitrecipes.supabase.co/storage/v1/object/public/recipes/recipe-1234.jpg"
        ],
        "ingredients": [
          {
            "name": "Quinoa",
            "amount": "1",
            "unit": "cup"
          },
          {
            "name": "Cherry tomatoes",
            "amount": "1",
            "unit": "cup"
          }
        ],
        "instructions": [
          "Cook quinoa according to package directions.",
          "Chop vegetables into bite-sized pieces.",
          "Combine all ingredients in a bowl."
        ],
        "prepTime": 15,
        "cookingTime": 20,
        "servings": 2,
        "difficulty": "EASY",
        "mealType": ["LUNCH", "DINNER"],
        "cuisineType": "Mediterranean",
        "mainIngredient": "Quinoa",
        "dietaryInfo": {
          "isVegetarian": true,
          "isVegan": true,
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
          "fiber": 6,
          "sodium": 200
        },
        "allergies": ["nuts"],
        "averageRating": 4.5,
        "totalRatings": 12,
        "totalComments": 5,
        "status": "APPROVED",
        "author": {
          "id": "cmhbkj5pb0000hiyl6uwue35i",
          "firstName": "Maria",
          "lastName": "Rodriguez",
          "email": "maria@example.com"
        },
        "authorId": "cmhbkj5pb0000hiyl6uwue35i",
        "createdAt": "2025-10-15T10:00:00.000Z",
        "updatedAt": "2025-10-15T10:00:00.000Z",
        "approvedAt": "2025-10-16T09:00:00.000Z",
        "approvedById": "admin-user-id"
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

#### **Recipe Object Fields**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique recipe identifier (UUID) |
| `title` | string | Recipe name |
| `description` | string | Brief description of the recipe |
| `imageUrls` | string[] | Array of image URLs (can be empty, max 3) |
| `ingredients` | object[] | Array of {name, amount, unit} objects |
| `instructions` | string[] | Array of step-by-step instructions |
| `prepTime` | number | Preparation time in minutes |
| `cookingTime` | number | Cooking time in minutes |
| `servings` | number | Number of servings |
| `difficulty` | enum | `EASY`, `MEDIUM`, or `HARD` |
| `mealType` | enum[] | Array of meal types (BREAKFAST, LUNCH, DINNER, SNACK, DESSERT) |
| `cuisineType` | string | Type of cuisine (e.g., "Mediterranean") |
| `mainIngredient` | string | Primary ingredient |
| `dietaryInfo` | object | Object with 6 boolean dietary flags |
| `nutritionInfo` | object | Nutritional information (can be null) |
| `allergies` | string[] | Array of allergen strings (lowercase) |
| `averageRating` | number | Average rating (0-5, 1 decimal place) |
| `totalRatings` | number | Total number of ratings |
| `totalComments` | number | Total number of comments |
| `status` | enum | Always `APPROVED` in browse results |
| `author` | object | Author information {id, firstName, lastName, email} |
| `authorId` | string | Author's user ID |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
| `approvedAt` | string | ISO 8601 timestamp (when approved) |
| `approvedById` | string | ID of admin who approved |

#### **Error Responses**

**400 Bad Request** - Invalid query parameters
```json
{
  "status": "error",
  "data": null,
  "message": "Invalid query parameters",
  "errors": []
}
```

---

### 2. Recommended Recipes

#### **Endpoint**
```
GET /api/v1/recipes/recommended
```

#### **Description**
Get personalized recipe recommendations. If user is authenticated, recommendations may be personalized based on their rating history. For unauthenticated users, returns popular recipes (high rating + high rating count).

#### **Authentication**
❌ Not required (but enhanced if authenticated)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 12 | Number of recommendations (max: 50) |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "cmheoqu4u000jufys3uynv1c4",
        "title": "Mediterranean Quinoa Bowl",
        "description": "A healthy and colorful bowl...",
        "imageUrls": ["https://..."],
        "ingredients": [...],
        "instructions": [...],
        "prepTime": 15,
        "cookingTime": 20,
        "servings": 2,
        "difficulty": "EASY",
        "mealType": ["LUNCH", "DINNER"],
        "cuisineType": "Mediterranean",
        "mainIngredient": "Quinoa",
        "dietaryInfo": {
          "isVegetarian": true,
          "isVegan": true,
          "isGlutenFree": true,
          "isDairyFree": true,
          "isKeto": false,
          "isPaleo": false
        },
        "nutritionInfo": {...},
        "allergies": ["nuts"],
        "averageRating": 4.8,
        "totalRatings": 45,
        "totalComments": 12,
        "status": "APPROVED",
        "author": {...},
        "authorId": "...",
        "createdAt": "2025-10-15T10:00:00.000Z",
        "updatedAt": "2025-10-15T10:00:00.000Z"
      }
    ],
    "meta": {
      "recommendationType": "popular",
      "total": 12
    }
  },
  "message": "Recommendations retrieved successfully"
}
```

#### **Recommendation Types**

| Type | Description | Criteria |
|------|-------------|----------|
| `personalized` | User-specific recommendations | Based on user's rating history (future) |
| `popular` | Generally popular recipes | High averageRating + high totalRatings, at least 1 rating |

**Current Implementation:**
- Returns recipes sorted by `averageRating DESC`, then `totalRatings DESC`
- Only includes recipes with at least 1 rating
- Future: Will analyze user's rating patterns for true personalization

---

### 3. Trending Recipes

#### **Endpoint**
```
GET /api/v1/recipes/trending
```

#### **Description**
Get trending recipes based on recent engagement (ratings and comments in the specified time period).

#### **Authentication**
❌ Not required (public access)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 12 | Number of trending recipes (max: 50) |
| `period` | string | No | `7d` | Time period: `7d` (7 days) or `30d` (30 days) |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "cmheoqu4u000jufys3uynv1c4",
        "title": "Viral TikTok Pasta",
        "description": "The pasta that broke the internet...",
        "imageUrls": ["https://..."],
        "ingredients": [...],
        "instructions": [...],
        "prepTime": 10,
        "cookingTime": 25,
        "servings": 4,
        "difficulty": "EASY",
        "mealType": ["DINNER"],
        "cuisineType": "Italian",
        "mainIngredient": "Pasta",
        "dietaryInfo": {
          "isVegetarian": true,
          "isVegan": false,
          "isGlutenFree": false,
          "isDairyFree": false,
          "isKeto": false,
          "isPaleo": false
        },
        "nutritionInfo": {...},
        "allergies": ["gluten", "dairy"],
        "averageRating": 4.9,
        "totalRatings": 127,
        "totalComments": 45,
        "status": "APPROVED",
        "author": {...},
        "authorId": "...",
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-20T10:00:00.000Z"
      }
    ],
    "meta": {
      "period": "7d",
      "total": 12
    }
  },
  "message": "Trending recipes retrieved successfully"
}
```

#### **Trending Criteria**

Recipes are considered trending if they have:
- Recent ratings created within the time period (7d or 30d)
- OR recent comments created within the time period
- Sorted by: `averageRating DESC`, then `totalComments DESC`

**Example Logic:**
- `7d` period: Recipes with ratings/comments in the last 7 days
- `30d` period: Recipes with ratings/comments in the last 30 days

---

### 4. New Recipes

#### **Endpoint**
```
GET /api/v1/recipes/new
```

#### **Description**
Get recently approved recipes, sorted by approval date (newest first).

#### **Authentication**
❌ Not required (public access)

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 12 | Number of new recipes (max: 50) |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "cmheoqu4u000jufys3uynv1c4",
        "title": "Fresh Avocado Toast",
        "description": "A simple yet delicious breakfast...",
        "imageUrls": ["https://..."],
        "ingredients": [...],
        "instructions": [...],
        "prepTime": 5,
        "cookingTime": 5,
        "servings": 1,
        "difficulty": "EASY",
        "mealType": ["BREAKFAST"],
        "cuisineType": "American",
        "mainIngredient": "Avocado",
        "dietaryInfo": {
          "isVegetarian": true,
          "isVegan": true,
          "isGlutenFree": false,
          "isDairyFree": true,
          "isKeto": false,
          "isPaleo": false
        },
        "nutritionInfo": {...},
        "allergies": ["gluten"],
        "averageRating": 0,
        "totalRatings": 0,
        "totalComments": 0,
        "status": "APPROVED",
        "author": {...},
        "authorId": "...",
        "createdAt": "2025-10-31T08:00:00.000Z",
        "updatedAt": "2025-10-31T08:00:00.000Z",
        "approvedAt": "2025-10-31T09:00:00.000Z"
      }
    ],
    "meta": {
      "total": 12
    }
  },
  "message": "New recipes retrieved successfully"
}
```

**Sorting:**
- Sorted by `approvedAt DESC` (most recently approved first)
- Only includes APPROVED recipes

---

## 🎯 Filter Logic

### Multi-Value Filters (OR Logic)
Filters that accept multiple values use OR logic:
- `mealType=BREAKFAST&mealType=LUNCH` → Returns recipes tagged with BREAKFAST **OR** LUNCH
- `difficulty=EASY&difficulty=MEDIUM` → Returns recipes with EASY **OR** MEDIUM difficulty

### Cross-Category Filters (AND Logic)
Filters across different categories use AND logic:
- `mealType=LUNCH&difficulty=EASY` → Returns recipes that are LUNCH **AND** EASY
- `isVegetarian=true&maxPrepTime=30` → Returns vegetarian recipes **AND** total time ≤ 30 minutes

### Dietary Filters (AND Logic)
Multiple dietary filters use AND logic:
- `isVegetarian=true&isGlutenFree=true` → Returns recipes that are **both** vegetarian and gluten-free

### Text Filters (Partial Match)
Text filters use case-insensitive partial matching:
- `cuisineType=medi` → Matches "Mediterranean"
- `mainIngredient=chick` → Matches "Chicken"

---

## 📊 Response Pagination

All paginated endpoints include a `pagination` object:

```json
{
  "page": 1,           // Current page number (1-indexed)
  "limit": 12,         // Items per page
  "total": 48,         // Total number of items
  "totalPages": 4,     // Total number of pages
  "hasNext": true,     // Whether there's a next page
  "hasPrev": false     // Whether there's a previous page
}
```

**Usage Tips:**
- Check `hasNext` to determine if "Load More" should be shown
- Check `hasPrev` to determine if "Previous Page" should be enabled
- `totalPages` can be used for page number navigation

---

## 🚀 Example API Calls

### Browse - No Filters (Default)
```bash
GET /api/v1/recipes?page=1&limit=12&sortBy=rating&sortOrder=desc
```
Returns: Top 12 highest-rated approved recipes

### Browse - Vegetarian Dinners
```bash
GET /api/v1/recipes?mealType=DINNER&isVegetarian=true&limit=12
```
Returns: Vegetarian dinner recipes

### Browse - Quick & Easy Recipes
```bash
GET /api/v1/recipes?maxPrepTime=30&difficulty=EASY&sortBy=prep-time-asc
```
Returns: Easy recipes ≤30 minutes, sorted by shortest prep time first

### Browse - Mediterranean Low-Carb
```bash
GET /api/v1/recipes?cuisineType=Mediterranean&isKeto=true&limit=12
```
Returns: Mediterranean keto-friendly recipes

### Browse - Vegan Gluten-Free Breakfast
```bash
GET /api/v1/recipes?mealType=BREAKFAST&isVegan=true&isGlutenFree=true
```
Returns: Vegan AND gluten-free breakfast recipes

### Browse - Multiple Meal Types
```bash
GET /api/v1/recipes?mealType=BREAKFAST&mealType=SNACK&difficulty=EASY
```
Returns: Easy recipes tagged with breakfast OR snack

### Get Recommended Recipes
```bash
GET /api/v1/recipes/recommended?limit=12
```
Returns: 12 recommended recipes (personalized if authenticated)

### Get Trending Recipes (Last 7 Days)
```bash
GET /api/v1/recipes/trending?limit=12&period=7d
```
Returns: 12 trending recipes from the last 7 days

### Get New Recipes
```bash
GET /api/v1/recipes/new?limit=12
```
Returns: 12 most recently approved recipes

---

## ⚡ Performance Optimizations

### Database Indexing
Indexes are created on frequently queried fields:
- `status` - Filter APPROVED recipes only
- `mainIngredient` - Fast ingredient filtering
- `authorId` - Fast author lookups
- `mealType` - Fast meal type filtering

### Query Optimization
- Only APPROVED recipes are returned (status filter at database level)
- Pagination limits result sets
- Efficient WHERE clause construction
- Minimal data fetching (only necessary fields)

### Future Optimizations
- Implement Redis caching for trending/recommended recipes
- Add cursor-based pagination for very large datasets
- Consider database read replicas for high traffic

---

## 🎯 Business Logic

### Recipe Visibility
- **Only APPROVED recipes** are returned in browse endpoints
- PENDING recipes are only visible to the author and admins (via separate endpoints)
- REJECTED recipes are only visible to the author (via separate endpoints)

### Sorting Priority
1. **Rating** (default): High averageRating, then high totalRatings
2. **Recent**: Newest recipes first (by createdAt)
3. **Prep Time**: Shortest or longest total time (prepTime + cookingTime)

### Recommendation Logic (Current)
- Returns popular recipes with high ratings
- Requires at least 1 rating to be included
- Sorted by averageRating DESC, then totalRatings DESC
- **Future**: Will analyze user's rating history for personalization

### Trending Logic
- Looks for recipes with recent engagement (ratings or comments)
- Time-based filtering (7 days or 30 days)
- Sorted by rating quality, then engagement volume

---

## 📊 Database Schema

### Recipe Model (Key Fields)
```prisma
model Recipe {
  id               String          @id @default(cuid())
  title            String
  description      String
  mainIngredient   String
  ingredients      Json            // [{name, amount, unit}]
  instructions     String[]
  prepTime         Int             @default(10)
  cookingTime      Int
  servings         Int
  difficulty       DifficultyLevel
  mealType         MealType[]      @default([DINNER])
  cuisineType      String?
  dietaryInfo      Json            // {isVegetarian, isVegan, isGlutenFree, isDairyFree, isKeto, isPaleo}
  nutritionInfo    Json?           // {calories, protein, carbs, fat, fiber, sodium}
  allergies        String[]
  imageUrls        String[]        @default([])
  status           RecipeStatus    @default(PENDING)
  averageRating    Float           @default(0)
  totalRatings     Int             @default(0)
  totalComments    Int             @default(0)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  approvedAt       DateTime?
  authorId         String
  
  author           User            @relation(...)
  ratings          Rating[]
  comments         Comment[]
  
  @@index([status])
  @@index([mainIngredient])
  @@index([authorId])
  @@index([mealType])
}
```

### Enums
```prisma
enum RecipeStatus {
  PENDING
  APPROVED
  REJECTED
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
  DESSERT
}
```

---

## 🧪 Testing Checklist

### Filter Testing
- [ ] Browse with no filters returns all approved recipes
- [ ] Single mealType filter works
- [ ] Multiple mealType filters work (OR logic)
- [ ] Single difficulty filter works
- [ ] Multiple difficulty filters work (OR logic)
- [ ] cuisineType filter works (case-insensitive)
- [ ] mainIngredient filter works (case-insensitive)
- [ ] maxPrepTime filter works (prepTime + cookingTime)
- [ ] Each dietary filter works independently
- [ ] Multiple dietary filters work together (AND logic)
- [ ] Cross-category filters work (AND logic)

### Sorting Testing
- [ ] Sort by rating (default) works
- [ ] Sort by recent works
- [ ] Sort by prep-time-asc works
- [ ] Sort by prep-time-desc works
- [ ] Invalid sortBy falls back to default

### Pagination Testing
- [ ] Page 1 returns correct results
- [ ] Page 2+ returns correct results
- [ ] hasNext is correct
- [ ] hasPrev is correct
- [ ] totalPages calculation is correct
- [ ] Limit parameter works (max 50)

### Special Endpoints Testing
- [ ] Recommended recipes returns popular recipes
- [ ] Trending recipes filters by time period
- [ ] New recipes sorted by approvedAt
- [ ] All endpoints return only APPROVED recipes

---

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Browse Recipes | ✅ Complete | All filters working |
| Meal Type Filter | ✅ Complete | Multiple selection (OR) |
| Difficulty Filter | ✅ Complete | Multiple selection (OR) |
| Cuisine Filter | ✅ Complete | Case-insensitive partial match |
| Ingredient Filter | ✅ Complete | Case-insensitive partial match |
| Prep Time Filter | ✅ Complete | Total time (prep + cooking) |
| Dietary Filters | ✅ Complete | 6 boolean flags (AND logic) |
| Sorting Options | ✅ Complete | 4 sort options |
| Pagination | ✅ Complete | hasNext/hasPrev flags |
| Recommended Recipes | ✅ Complete | Popular recipes (personalization future) |
| Trending Recipes | ✅ Complete | Time-based engagement filtering |
| New Recipes | ✅ Complete | Sorted by approval date |
| APPROVED Only | ✅ Complete | All endpoints filter by status |

---

## 📞 Support

For questions or issues, contact the backend development team.

**Backend Developer**: NinePTH  
**Date**: October 31, 2025  
**Version**: 1.0
