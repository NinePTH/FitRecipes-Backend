# Recipe API Implementation Guide for Frontend

> **Last Updated**: October 28, 2025  
> **Backend Version**: v1.0  
> **Status**: ✅ Production Ready

This comprehensive guide covers everything the frontend team needs to implement recipe features, including the complete API specification, data schemas, validation rules, and integration examples.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Recipe Schema Overview](#recipe-schema-overview)
3. [API Endpoints](#api-endpoints)
4. [Data Validation Rules](#data-validation-rules)
5. [Frontend Integration Examples](#frontend-integration-examples)
6. [Error Handling](#error-handling)
7. [Testing Checklist](#testing-checklist)

---

## Quick Start

### Base URL
```
Development: http://localhost:3000/api/v1
Staging: https://fitrecipes-backend-staging.onrender.com/api/v1
Production: https://fitrecipes-backend.onrender.com/api/v1
```

### Authentication
All recipe endpoints require authentication. Include JWT token in Authorization header:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Role Requirements
- **CHEF or ADMIN**: Can submit recipes
- **ADMIN**: Can approve/reject recipes
- **Any authenticated user**: Can view approved recipes

---

## Recipe Schema Overview

### Complete Recipe Object

```typescript
interface Recipe {
  // Basic Information
  id: string;                    // Unique identifier (cuid)
  title: string;                 // 3-200 characters
  description: string;           // 10-1000 characters
  mainIngredient: string;        // 2-50 characters (for filtering)
  
  // Ingredients & Instructions
  ingredients: Ingredient[];     // Array of {name, amount, unit}
  instructions: string[];        // Array of instruction steps
  
  // Time & Difficulty
  prepTime: number;              // 1-300 minutes (default: 10) ⭐ NEW
  cookingTime: number;           // 1-600 minutes
  servings: number;              // 1-20 servings
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  
  // Categorization
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DESSERT';  // (default: DINNER) ⭐ NEW
  cuisineType?: string;          // Optional (e.g., "Italian", "Mexican")
  tags: string[];                // Optional tags for search
  
  // Dietary Information (Optional)
  dietaryInfo?: {
    isVegetarian: boolean;       // Default: false
    isVegan: boolean;            // Default: false
    isGlutenFree: boolean;       // Default: false
    isDairyFree: boolean;        // Default: false
    isKeto: boolean;             // Default: false ⭐ NEW
    isPaleo: boolean;            // Default: false ⭐ NEW
  };
  
  // Nutrition Information (Optional)
  nutritionInfo?: {
    calories: number;            // ≥ 0
    protein: number;             // ≥ 0 (grams)
    carbs: number;               // ≥ 0 (grams)
    fat: number;                 // ≥ 0 (grams)
    fiber: number;               // ≥ 0 (grams)
    sodium: number;              // ≥ 0 (mg) ⭐ NEW
  };
  
  // Media
  imageUrl?: string;             // Optional image URL
  
  // Status & Approval
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: Date;             // Timestamp of approval
  approvedById?: string;         // Admin ID who approved
  rejectedAt?: Date;             // Timestamp of rejection
  rejectedById?: string;         // Admin ID who rejected
  rejectionReason?: string;      // Why recipe was rejected (visible to author)
  adminNote?: string;            // Optional admin feedback
  
  // Ratings
  averageRating: number;         // 0-5 (calculated)
  totalRatings: number;          // Count of ratings
  
  // Relations
  authorId: string;              // Recipe author ID
  author: {                      // Author details
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {                 // Admin who approved (if applicable)
    firstName: string;
    lastName: string;
  };
  ratings?: Rating[];            // Array of ratings with reviewer names
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface Ingredient {
  name: string;                  // Required (e.g., "Chicken breast")
  amount: string;                // Required (e.g., "200")
  unit: string;                  // Required (e.g., "g", "cups", "tsp")
}

interface Rating {
  id: string;
  rating: number;                // 1-5
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}
```

---

## API Endpoints

### 1. Submit Recipe (Chef/Admin)

**Endpoint**: `POST /api/v1/recipes`  
**Role Required**: CHEF or ADMIN  
**Status**: ✅ COMPLETE

#### Request Body
```json
{
  "title": "Quick Keto Breakfast Bowl",
  "description": "A nutritious low-carb breakfast ready in minutes",
  "mainIngredient": "Eggs",
  "ingredients": [
    {"name": "Eggs", "amount": "2", "unit": "large"},
    {"name": "Avocado", "amount": "1/2", "unit": "medium"},
    {"name": "Bacon", "amount": "2", "unit": "strips"},
    {"name": "Cherry tomatoes", "amount": "4", "unit": "pieces"}
  ],
  "instructions": [
    "Heat a non-stick pan over medium heat",
    "Fry eggs in butter to desired doneness",
    "Slice avocado and arrange on plate",
    "Cook bacon until crispy",
    "Halve cherry tomatoes",
    "Serve all ingredients together"
  ],
  "prepTime": 5,
  "cookingTime": 10,
  "servings": 1,
  "difficulty": "EASY",
  "mealType": "BREAKFAST",
  "cuisineType": "American",
  "dietaryInfo": {
    "isKeto": true,
    "isPaleo": false,
    "isVegetarian": false,
    "isVegan": false,
    "isGlutenFree": true,
    "isDairyFree": false
  },
  "nutritionInfo": {
    "calories": 450,
    "protein": 25,
    "carbs": 8,
    "fat": 35,
    "fiber": 5,
    "sodium": 650
  },
  "tags": ["quick", "keto", "breakfast", "protein-rich"]
}
```

#### Validation Rules
| Field | Required | Validation |
|-------|----------|------------|
| `title` | ✅ Yes | 3-200 characters |
| `description` | ✅ Yes | 10-1000 characters |
| `mainIngredient` | ✅ Yes | 2-50 characters |
| `ingredients` | ✅ Yes | Min 1 item, each must have name/amount/unit |
| `instructions` | ✅ Yes | Min 1 step, each must be non-empty |
| `prepTime` | ❌ No | 1-300 minutes (default: 10) |
| `cookingTime` | ✅ Yes | 1-600 minutes |
| `servings` | ✅ Yes | 1-20 servings |
| `difficulty` | ✅ Yes | EASY, MEDIUM, or HARD |
| `mealType` | ❌ No | BREAKFAST, LUNCH, DINNER, SNACK, DESSERT (default: DINNER) |
| `cuisineType` | ❌ No | Any string |
| `dietaryInfo` | ❌ No | All booleans default to false |
| `nutritionInfo` | ❌ No | All numbers must be ≥ 0 |
| `tags` | ❌ No | Array of strings |
| `imageUrl` | ❌ No | Valid URL or empty string |

#### Response: 201 Created
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "clx123abc...",
      "title": "Quick Keto Breakfast Bowl",
      "status": "PENDING",
      "prepTime": 5,
      "cookingTime": 10,
      "mealType": "BREAKFAST",
      "author": {
        "id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-10-28T10:00:00Z",
      // ... all other fields
    }
  },
  "message": "Recipe submitted successfully and is pending admin approval"
}
```

#### Frontend Integration
```typescript
// Recipe submission form
async function submitRecipe(recipeData: RecipeFormData) {
  try {
    const response = await fetch('/api/v1/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        ...recipeData,
        // prepTime and mealType are optional with defaults
        prepTime: recipeData.prepTime || 10,
        mealType: recipeData.mealType || 'DINNER'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    
    // Show success message
    toast.success('Recipe submitted! It will be reviewed by admins.');
    
    // Redirect to chef dashboard
    router.push('/chef/my-recipes');
    
    return result.data.recipe;
  } catch (error) {
    console.error('Recipe submission failed:', error);
    toast.error(error.message);
    throw error;
  }
}
```

---

### 2. Get Recipe Details

**Endpoint**: `GET /api/v1/recipes/:id`  
**Role Required**: Any authenticated user (with authorization checks)  
**Status**: ✅ COMPLETE

#### Authorization Rules
- **PENDING recipes**: Only the author and admins can view
- **REJECTED recipes**: Only the author can view (includes rejection reason)
- **APPROVED recipes**: All authenticated users can view

#### Response: 200 OK
```json
{
  "status": "success",
  "data": {
    "id": "clx123abc...",
    "title": "Quick Keto Breakfast Bowl",
    "description": "A nutritious low-carb breakfast ready in minutes",
    "mainIngredient": "Eggs",
    "ingredients": [
      {"name": "Eggs", "amount": "2", "unit": "large"},
      {"name": "Avocado", "amount": "1/2", "unit": "medium"}
    ],
    "instructions": ["Step 1", "Step 2"],
    "prepTime": 5,
    "cookingTime": 10,
    "servings": 1,
    "difficulty": "EASY",
    "mealType": "BREAKFAST",
    "cuisineType": "American",
    "dietaryInfo": {
      "isKeto": true,
      "isPaleo": false,
      "isVegetarian": false,
      "isVegan": false,
      "isGlutenFree": true,
      "isDairyFree": false
    },
    "nutritionInfo": {
      "calories": 450,
      "protein": 25,
      "carbs": 8,
      "fat": 35,
      "fiber": 5,
      "sodium": 650
    },
    "tags": ["quick", "keto", "breakfast"],
    "status": "APPROVED",
    "averageRating": 4.5,
    "totalRatings": 12,
    "author": {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "ratings": [
      {
        "id": "rating1",
        "rating": 5,
        "user": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "createdAt": "2025-10-25T14:00:00Z"
      }
    ],
    "approvedAt": "2025-10-28T12:00:00Z",
    "approvedBy": {
      "firstName": "Admin",
      "lastName": "User"
    },
    "adminNote": "Excellent recipe with clear instructions!",
    "createdAt": "2025-10-28T10:00:00Z",
    "updatedAt": "2025-10-28T12:00:00Z"
  }
}
```

#### Error Responses
- **404 Not Found**: Recipe doesn't exist
- **403 Forbidden**: User doesn't have permission to view this recipe

#### Frontend Integration
```typescript
// Recipe detail page
async function fetchRecipeDetails(recipeId: string) {
  try {
    const response = await fetch(`/api/v1/recipes/${recipeId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.status === 403) {
      toast.error('You do not have permission to view this recipe');
      router.push('/recipes');
      return;
    }

    if (response.status === 404) {
      toast.error('Recipe not found');
      router.push('/recipes');
      return;
    }

    const result = await response.json();
    const recipe = result.data;

    // Display status-specific UI
    if (recipe.status === 'PENDING') {
      // Show "Pending Review" badge (yellow)
      showStatusBadge('Pending Admin Review', 'warning');
    } else if (recipe.status === 'REJECTED') {
      // Show rejection reason (red) - only visible to author
      showStatusBadge('Rejected', 'error');
      showRejectionReason(recipe.rejectionReason);
    } else if (recipe.status === 'APPROVED') {
      // Show approved badge (green)
      showStatusBadge('Approved', 'success');
      if (recipe.adminNote) {
        showAdminNote(recipe.adminNote);
      }
    }

    return recipe;
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    toast.error('Failed to load recipe');
  }
}

// Display dietary and nutrition badges
function RecipeDetailsView({ recipe }: { recipe: Recipe }) {
  return (
    <div>
      {/* Header */}
      <h1>{recipe.title}</h1>
      
      {/* Time & Servings */}
      <div className="recipe-meta">
        <span>⏱️ Prep: {recipe.prepTime} min</span>
        <span>🍳 Cook: {recipe.cookingTime} min</span>
        <span>🍽️ Servings: {recipe.servings}</span>
        <span>📊 {recipe.difficulty}</span>
        <span>🍽️ {recipe.mealType}</span>
      </div>

      {/* Dietary Badges */}
      {recipe.dietaryInfo && (
        <div className="dietary-badges">
          {recipe.dietaryInfo.isVegetarian && <Badge>🌱 Vegetarian</Badge>}
          {recipe.dietaryInfo.isVegan && <Badge>🥬 Vegan</Badge>}
          {recipe.dietaryInfo.isGlutenFree && <Badge>🌾 Gluten-Free</Badge>}
          {recipe.dietaryInfo.isDairyFree && <Badge>🥛 Dairy-Free</Badge>}
          {recipe.dietaryInfo.isKeto && <Badge>🥑 Keto</Badge>}
          {recipe.dietaryInfo.isPaleo && <Badge>🍖 Paleo</Badge>}
        </div>
      )}

      {/* Nutrition Facts */}
      {recipe.nutritionInfo && (
        <div className="nutrition-facts">
          <h3>Nutrition Information (per serving)</h3>
          <ul>
            <li>Calories: {recipe.nutritionInfo.calories} kcal</li>
            <li>Protein: {recipe.nutritionInfo.protein}g</li>
            <li>Carbs: {recipe.nutritionInfo.carbs}g</li>
            <li>Fat: {recipe.nutritionInfo.fat}g</li>
            <li>Fiber: {recipe.nutritionInfo.fiber}g</li>
            <li>Sodium: {recipe.nutritionInfo.sodium}mg</li>
          </ul>
        </div>
      )}

      {/* Ingredients */}
      <div className="ingredients">
        <h3>Ingredients</h3>
        <ul>
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx}>
              {ing.amount} {ing.unit} {ing.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>Instructions</h3>
        <ol>
          {recipe.instructions.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

---

### 3. Get Pending Recipes (Admin)

**Endpoint**: `GET /api/v1/admin/recipes/pending`  
**Role Required**: ADMIN  
**Status**: ✅ COMPLETE

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (≥ 1) |
| `limit` | number | 10 | Items per page (1-100) |
| `sortBy` | string | "createdAt" | Sort field |
| `sortOrder` | string | "desc" | "asc" or "desc" |

#### Response: 200 OK
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "clx123abc...",
        "title": "Quick Keto Breakfast Bowl",
        "mainIngredient": "Eggs",
        "prepTime": 5,
        "cookingTime": 10,
        "mealType": "BREAKFAST",
        "status": "PENDING",
        "createdAt": "2025-10-28T10:00:00Z",
        "author": {
          "id": "user123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Frontend Integration
```typescript
// Admin dashboard - pending recipes list
async function fetchPendingRecipes(page = 1, limit = 10) {
  try {
    const response = await fetch(
      `/api/v1/admin/recipes/pending?page=${page}&limit=${limit}&sortBy=createdAt&sortOrder=desc`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      }
    );

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch pending recipes:', error);
    toast.error('Failed to load pending recipes');
  }
}

function AdminPendingRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRecipes();
  }, [page]);

  async function loadRecipes() {
    const data = await fetchPendingRecipes(page, 10);
    setRecipes(data.recipes);
    setPagination(data.pagination);
  }

  return (
    <div>
      <h2>Pending Recipes ({pagination?.total || 0})</h2>
      
      <div className="recipes-grid">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe}>
            <button onClick={() => viewRecipe(recipe.id)}>
              Review
            </button>
          </RecipeCard>
        ))}
      </div>

      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

---

### 4. Approve Recipe (Admin)

**Endpoint**: `PUT /api/v1/admin/recipes/:id/approve`  
**Role Required**: ADMIN  
**Status**: ✅ COMPLETE

#### Request Body (Optional)
```json
{
  "adminNote": "Excellent recipe! Well-structured with clear instructions and accurate nutrition info."
}
```

**Validation**: `adminNote` must be ≤ 500 characters if provided

#### Response: 200 OK
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "clx123abc...",
      "title": "Quick Keto Breakfast Bowl",
      "status": "APPROVED",
      "approvedAt": "2025-10-28T12:00:00Z",
      "approvedById": "admin123",
      "adminNote": "Excellent recipe! Well-structured with clear instructions.",
      // ... all other recipe fields
    }
  },
  "message": "Recipe approved successfully"
}
```

#### Error Responses
- **400 Bad Request**: Recipe is already approved
- **404 Not Found**: Recipe doesn't exist

#### Frontend Integration
```typescript
// Admin recipe review page
async function approveRecipe(recipeId: string, adminNote?: string) {
  try {
    const response = await fetch(`/api/v1/admin/recipes/${recipeId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        adminNote: adminNote || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    
    toast.success('Recipe approved successfully!');
    
    // Refresh pending list or redirect
    router.push('/admin/recipes/pending');
    
    return result.data.recipe;
  } catch (error) {
    console.error('Approval failed:', error);
    toast.error(error.message);
    throw error;
  }
}

// Approval modal component
function ApprovalModal({ recipe, onClose, onApprove }) {
  const [adminNote, setAdminNote] = useState('');

  async function handleApprove() {
    await approveRecipe(recipe.id, adminNote);
    onApprove();
    onClose();
  }

  return (
    <Modal>
      <h3>Approve Recipe: {recipe.title}</h3>
      
      <div className="recipe-preview">
        {/* Show recipe details for review */}
        <p>Main Ingredient: {recipe.mainIngredient}</p>
        <p>Meal Type: {recipe.mealType}</p>
        <p>Prep Time: {recipe.prepTime} min</p>
        <p>Cooking Time: {recipe.cookingTime} min</p>
      </div>

      <label>
        Admin Note (Optional):
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          maxLength={500}
          placeholder="Add feedback or encouragement for the chef..."
        />
        <small>{adminNote.length}/500 characters</small>
      </label>

      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleApprove} className="primary">
          ✅ Approve Recipe
        </button>
      </div>
    </Modal>
  );
}
```

---

### 5. Reject Recipe (Admin)

**Endpoint**: `PUT /api/v1/admin/recipes/:id/reject`  
**Role Required**: ADMIN  
**Status**: ✅ COMPLETE

#### Request Body (Required)
```json
{
  "reason": "The cooking instructions are unclear and missing critical temperature details. Please revise the recipe with specific temperatures and cooking times, then resubmit."
}
```

**Validation**: `reason` is **REQUIRED** and must be 10-500 characters

#### Response: 200 OK
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "clx123abc...",
      "title": "Quick Keto Breakfast Bowl",
      "status": "REJECTED",
      "rejectedAt": "2025-10-28T12:00:00Z",
      "rejectedById": "admin123",
      "rejectionReason": "The cooking instructions are unclear...",
      // ... all other recipe fields
    }
  },
  "message": "Recipe rejected"
}
```

#### Error Responses
- **400 Bad Request**: Missing or invalid rejection reason
- **404 Not Found**: Recipe doesn't exist

#### Frontend Integration
```typescript
// Admin recipe rejection
async function rejectRecipe(recipeId: string, reason: string) {
  if (!reason || reason.length < 10) {
    toast.error('Rejection reason must be at least 10 characters');
    return;
  }

  if (reason.length > 500) {
    toast.error('Rejection reason must be less than 500 characters');
    return;
  }

  try {
    const response = await fetch(`/api/v1/admin/recipes/${recipeId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    
    toast.success('Recipe rejected. Chef will be notified.');
    
    // Refresh pending list or redirect
    router.push('/admin/recipes/pending');
    
    return result.data.recipe;
  } catch (error) {
    console.error('Rejection failed:', error);
    toast.error(error.message);
    throw error;
  }
}

// Rejection modal component
function RejectionModal({ recipe, onClose, onReject }) {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  function validateReason() {
    const newErrors: string[] = [];
    
    if (!reason.trim()) {
      newErrors.push('Rejection reason is required');
    } else if (reason.length < 10) {
      newErrors.push('Reason must be at least 10 characters');
    } else if (reason.length > 500) {
      newErrors.push('Reason must be less than 500 characters');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  }

  async function handleReject() {
    if (!validateReason()) return;
    
    await rejectRecipe(recipe.id, reason);
    onReject();
    onClose();
  }

  return (
    <Modal>
      <h3>Reject Recipe: {recipe.title}</h3>
      
      <p className="warning">
        ⚠️ The chef will see this rejection reason. Please be constructive
        and specific about what needs improvement.
      </p>

      <label>
        Rejection Reason <span className="required">*</span>
        <textarea
          value={reason}
          onChange={e => {
            setReason(e.target.value);
            setErrors([]);
          }}
          onBlur={validateReason}
          maxLength={500}
          rows={5}
          placeholder="Explain what needs to be fixed (e.g., unclear instructions, missing nutrition info, incorrect ingredients...)"
          className={errors.length > 0 ? 'error' : ''}
        />
        <small>{reason.length}/500 characters (min 10 required)</small>
      </label>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, idx) => (
            <p key={idx} className="error">{error}</p>
          ))}
        </div>
      )}

      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button 
          onClick={handleReject} 
          className="danger"
          disabled={!reason || errors.length > 0}
        >
          ❌ Reject Recipe
        </button>
      </div>
    </Modal>
  );
}
```

---

## Data Validation Rules

### Client-Side Validation
Implement these validations in your forms to provide immediate user feedback:

```typescript
// Recipe submission form validation
interface RecipeFormErrors {
  title?: string;
  description?: string;
  mainIngredient?: string;
  ingredients?: string;
  instructions?: string;
  prepTime?: string;
  cookingTime?: string;
  servings?: string;
  difficulty?: string;
  mealType?: string;
  nutritionInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    sodium?: string;
  };
}

function validateRecipeForm(data: RecipeFormData): RecipeFormErrors {
  const errors: RecipeFormErrors = {};

  // Title
  if (!data.title) {
    errors.title = 'Title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (data.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }

  // Description
  if (!data.description) {
    errors.description = 'Description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  // Main Ingredient
  if (!data.mainIngredient) {
    errors.mainIngredient = 'Main ingredient is required';
  } else if (data.mainIngredient.length < 2) {
    errors.mainIngredient = 'Main ingredient must be at least 2 characters';
  } else if (data.mainIngredient.length > 50) {
    errors.mainIngredient = 'Main ingredient must be less than 50 characters';
  }

  // Ingredients
  if (!data.ingredients || data.ingredients.length === 0) {
    errors.ingredients = 'At least one ingredient is required';
  } else {
    for (const ing of data.ingredients) {
      if (!ing.name || !ing.amount || !ing.unit) {
        errors.ingredients = 'Each ingredient must have name, amount, and unit';
        break;
      }
    }
  }

  // Instructions
  if (!data.instructions || data.instructions.length === 0) {
    errors.instructions = 'At least one instruction step is required';
  } else {
    for (const step of data.instructions) {
      if (!step.trim()) {
        errors.instructions = 'Instruction steps cannot be empty';
        break;
      }
    }
  }

  // Prep Time (optional, but if provided must be valid)
  if (data.prepTime !== undefined && data.prepTime !== null) {
    if (data.prepTime < 1) {
      errors.prepTime = 'Prep time must be at least 1 minute';
    } else if (data.prepTime > 300) {
      errors.prepTime = 'Prep time must be less than 300 minutes';
    }
  }

  // Cooking Time
  if (!data.cookingTime) {
    errors.cookingTime = 'Cooking time is required';
  } else if (data.cookingTime < 1) {
    errors.cookingTime = 'Cooking time must be at least 1 minute';
  } else if (data.cookingTime > 600) {
    errors.cookingTime = 'Cooking time must be less than 600 minutes';
  }

  // Servings
  if (!data.servings) {
    errors.servings = 'Servings is required';
  } else if (data.servings < 1) {
    errors.servings = 'Servings must be at least 1';
  } else if (data.servings > 20) {
    errors.servings = 'Servings must be less than 20';
  }

  // Difficulty
  if (!data.difficulty) {
    errors.difficulty = 'Difficulty is required';
  } else if (!['EASY', 'MEDIUM', 'HARD'].includes(data.difficulty)) {
    errors.difficulty = 'Difficulty must be EASY, MEDIUM, or HARD';
  }

  // Meal Type (optional, but if provided must be valid)
  if (data.mealType) {
    if (!['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT'].includes(data.mealType)) {
      errors.mealType = 'Invalid meal type';
    }
  }

  // Nutrition Info (all fields must be >= 0 if provided)
  if (data.nutritionInfo) {
    const nutrition = data.nutritionInfo;
    errors.nutritionInfo = {};

    if (nutrition.calories !== undefined && nutrition.calories < 0) {
      errors.nutritionInfo.calories = 'Calories cannot be negative';
    }
    if (nutrition.protein !== undefined && nutrition.protein < 0) {
      errors.nutritionInfo.protein = 'Protein cannot be negative';
    }
    if (nutrition.carbs !== undefined && nutrition.carbs < 0) {
      errors.nutritionInfo.carbs = 'Carbs cannot be negative';
    }
    if (nutrition.fat !== undefined && nutrition.fat < 0) {
      errors.nutritionInfo.fat = 'Fat cannot be negative';
    }
    if (nutrition.fiber !== undefined && nutrition.fiber < 0) {
      errors.nutritionInfo.fiber = 'Fiber cannot be negative';
    }
    if (nutrition.sodium !== undefined && nutrition.sodium < 0) {
      errors.nutritionInfo.sodium = 'Sodium cannot be negative';
    }

    // Remove nutritionInfo if no errors
    if (Object.keys(errors.nutritionInfo).length === 0) {
      delete errors.nutritionInfo;
    }
  }

  return errors;
}
```

---

## Error Handling

### Standard Error Response Format
```typescript
interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Error Handling Example
```typescript
async function handleApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<T | null> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      
      // Handle specific status codes
      switch (response.status) {
        case 400:
          // Validation error
          if (error.errors) {
            // Display field-specific errors
            error.errors.forEach(err => {
              toast.error(`${err.field}: ${err.message}`);
            });
          } else {
            toast.error(error.message);
          }
          break;
          
        case 401:
          // Unauthorized - redirect to login
          toast.error('Please log in to continue');
          router.push('/login');
          break;
          
        case 403:
          // Forbidden - insufficient permissions
          toast.error('You do not have permission to perform this action');
          break;
          
        case 404:
          // Not found
          toast.error('Resource not found');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(error.message || 'An error occurred');
      }
      
      return null;
    }
    
    const result = await response.json();
    return result.data;
    
  } catch (error) {
    console.error('API call failed:', error);
    toast.error('Network error. Please check your connection.');
    return null;
  }
}
```

---

## Testing Checklist

### Recipe Submission Testing
- [ ] Submit recipe with all required fields only (should default prepTime=10, mealType=DINNER)
- [ ] Submit recipe with all optional fields
- [ ] Submit recipe with dietary flags (all 6 options)
- [ ] Submit recipe with nutrition info (including sodium)
- [ ] Try submitting without required fields (should get validation errors)
- [ ] Try submitting with invalid prepTime (< 1 or > 300)
- [ ] Try submitting with invalid mealType
- [ ] Try submitting with negative nutrition values
- [ ] Verify recipe status is PENDING after submission
- [ ] Verify chef cannot approve their own recipe

### Recipe Detail View Testing
- [ ] View APPROVED recipe as any authenticated user
- [ ] View PENDING recipe as author
- [ ] View PENDING recipe as admin
- [ ] Try viewing PENDING recipe as different user (should get 403)
- [ ] View REJECTED recipe as author (should see rejection reason)
- [ ] Try viewing REJECTED recipe as different user (should get 403)
- [ ] Verify prepTime and mealType display correctly
- [ ] Verify dietary badges display (all 6 types)
- [ ] Verify nutrition info displays (including sodium)

### Admin Approval/Rejection Testing
- [ ] Approve recipe without admin note
- [ ] Approve recipe with admin note
- [ ] Try approving already approved recipe (should get 400)
- [ ] Reject recipe with valid reason (10-500 chars)
- [ ] Try rejecting recipe with reason < 10 chars (should fail)
- [ ] Try rejecting recipe with reason > 500 chars (should fail)
- [ ] Try rejecting without reason (should fail)
- [ ] Verify chef can see rejection reason on their recipe
- [ ] Verify chef cannot see rejection reason of other recipes

### Admin Pending List Testing
- [ ] Fetch pending recipes with default pagination
- [ ] Fetch pending recipes with custom page and limit
- [ ] Test sorting (createdAt asc/desc)
- [ ] Verify pagination info is correct
- [ ] Verify only PENDING recipes appear
- [ ] Try accessing as non-admin (should get 403)

### Performance Testing
- [ ] Recipe submission response < 2 seconds
- [ ] Recipe detail view response < 1 second
- [ ] Pending list with 50+ recipes loads < 3 seconds
- [ ] Large ingredient list (20+ items) handles correctly
- [ ] Long instructions (15+ steps) handles correctly

---

## Summary

### What's Implemented ✅
1. **Recipe Submission** - Chefs can submit recipes with comprehensive details
2. **Recipe Detail View** - Authorization-based viewing with full information
3. **Admin Pending List** - Paginated list of recipes awaiting review
4. **Recipe Approval** - Admins can approve with optional feedback
5. **Recipe Rejection** - Admins can reject with required explanation

### New Fields (October 2025) ⭐
- **`prepTime`**: Preparation time (1-300 min, default 10)
- **`mealType`**: BREAKFAST/LUNCH/DINNER/SNACK/DESSERT (default DINNER)
- **`dietaryInfo.isKeto`**: Keto-friendly flag
- **`dietaryInfo.isPaleo`**: Paleo-friendly flag
- **`nutritionInfo.sodium`**: Sodium content in mg

### Backend Status
- ✅ All 59 tests passing
- ✅ Database migrations applied
- ✅ Full authorization system implemented
- ✅ Production-ready and deployed to staging

### Next Steps (Future Work)
- ⏳ Recipe search (multi-ingredient matching)
- ⏳ Recipe browse (filtering by mealType, dietary preferences, time)
- ⏳ Recipe update (PUT /:id)
- ⏳ Recipe delete (DELETE /:id)
- ⏳ Image upload to Supabase
- ⏳ Community features (comments, ratings)

---

**For Questions or Issues**: Contact backend team or check `.github/copilot-instructions.md` for additional context.
