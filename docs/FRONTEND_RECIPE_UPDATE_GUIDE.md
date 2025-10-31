# Frontend Integration Guide - Recipe Update Feature

This guide provides complete implementation details for updating recipes (Edit Recipe functionality) **with support for multiple images (up to 3 per recipe)**.

## Quick Overview

**Endpoint**: `PUT /api/v1/recipes/:id`  
**Method**: PUT  
**Authentication**: Required (JWT Bearer token)  
**Authorization**: CHEF (own recipes) and ADMIN (any recipe)  
**Images**: Supports up to 3 images per recipe (array field)  
**Important**: Only PENDING and REJECTED recipes can be updated. APPROVED recipes are locked.

---

## Update Rules

### ✅ Can Update:
- **PENDING recipes** - Updates freely, stays PENDING
- **REJECTED recipes** - Updates and automatically resets to PENDING for re-review

### ❌ Cannot Update:
- **APPROVED recipes** - Locked (user must contact admin)

### 🔄 Auto-Reset Behavior:
When updating a REJECTED recipe:
- Status changes from `REJECTED` → `PENDING`
- `rejectionReason` cleared (set to null)
- `rejectedAt` cleared (set to null)
- `rejectedById` cleared (set to null)

### 🗑️ Image Deletion:
When updating `imageUrls`:
- Removed images are **automatically deleted** from Supabase Storage
- Example: Recipe has `["url1", "url2", "url3"]`, you update to `["url1", "url3"]` → `url2` is deleted from storage
- Empty array `[]` deletes all images
- New images must be uploaded first via `POST /api/v1/recipes/upload-image` endpoint

---

## Basic Implementation

### 1. Update Recipe Function

```typescript
async function updateRecipe(recipeId: string, recipeData: RecipeFormData) {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `http://localhost:3000/api/v1/recipes/${recipeId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipeData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update recipe');
  }

  const data = await response.json();
  return data.data.recipe;
}
```

---

## Complete React Edit Recipe Component

```tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface RecipeFormData {
  title: string;
  description: string;
  mainIngredient: string;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  instructions: string[];
  prepTime: number;
  cookingTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  mealType: Array<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DESSERT'>;
  cuisineType?: string;
  dietaryInfo: { // REQUIRED field
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isKeto: boolean;
    isPaleo: boolean;
  };
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  allergies?: string[];
  imageUrl?: string;
}

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RecipeFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>('');

  // Load existing recipe data
  useEffect(() => {
    loadRecipe();
  }, [id]);

  async function loadRecipe() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/v1/recipes/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 403) {
        throw new Error('You do not have permission to edit this recipe');
      }

      if (response.status === 404) {
        throw new Error('Recipe not found');
      }

      if (!response.ok) {
        throw new Error('Failed to load recipe');
      }

      const data = await response.json();
      const recipe = data.data.recipe;

      // Check if recipe can be edited
      if (recipe.status === 'APPROVED') {
        throw new Error('Approved recipes cannot be edited. Please contact an admin.');
      }

      setOriginalStatus(recipe.status);
      setFormData({
        title: recipe.title,
        description: recipe.description,
        mainIngredient: recipe.mainIngredient,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        mealType: recipe.mealType,
        cuisineType: recipe.cuisineType,
        dietaryInfo: recipe.dietaryInfo,
        nutritionInfo: recipe.nutritionInfo,
        allergies: recipe.allergies,
        imageUrl: recipe.imageUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/v1/recipes/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.message.includes('approved recipes')) {
          throw new Error('This recipe is approved and cannot be edited');
        }
        throw new Error(errorData.errors?.join(', ') || errorData.message);
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to edit this recipe');
      }

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      const data = await response.json();
      
      // Show success message
      if (originalStatus === 'REJECTED') {
        alert('Recipe updated and resubmitted for review!');
      } else {
        alert('Recipe updated successfully!');
      }

      // Redirect to My Recipes page
      navigate('/my-recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading recipe...</div>;
  }

  if (error && !formData) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p className="error">{error}</p>
        <button onClick={() => navigate('/my-recipes')}>
          Back to My Recipes
        </button>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="edit-recipe-page">
      <h1>Edit Recipe</h1>

      {originalStatus === 'REJECTED' && (
        <div className="info-banner">
          ℹ️ This recipe was rejected. After updating, it will be resubmitted for review.
        </div>
      )}

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Recipe Title *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            minLength={3}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            minLength={10}
            maxLength={500}
            rows={4}
          />
        </div>

        {/* Main Ingredient */}
        <div className="form-group">
          <label htmlFor="mainIngredient">Main Ingredient *</label>
          <input
            id="mainIngredient"
            type="text"
            value={formData.mainIngredient}
            onChange={(e) => setFormData({ ...formData, mainIngredient: e.target.value })}
            required
          />
        </div>

        {/* Prep Time */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="prepTime">Prep Time (minutes) *</label>
            <input
              id="prepTime"
              type="number"
              value={formData.prepTime}
              onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) })}
              required
              min={1}
              max={300}
            />
          </div>

          {/* Cooking Time */}
          <div className="form-group">
            <label htmlFor="cookingTime">Cooking Time (minutes) *</label>
            <input
              id="cookingTime"
              type="number"
              value={formData.cookingTime}
              onChange={(e) => setFormData({ ...formData, cookingTime: parseInt(e.target.value) })}
              required
              min={1}
              max={300}
            />
          </div>

          {/* Servings */}
          <div className="form-group">
            <label htmlFor="servings">Servings *</label>
            <input
              id="servings"
              type="number"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
              required
              min={1}
              max={20}
            />
          </div>
        </div>

        {/* Difficulty */}
        <div className="form-group">
          <label htmlFor="difficulty">Difficulty *</label>
          <select
            id="difficulty"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
            required
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Meal Type (Multi-select) */}
        <div className="form-group">
          <label>Meal Type * (Select 1-5)</label>
          <div className="checkbox-group">
            {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT'].map((type) => (
              <label key={type} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.mealType.includes(type as any)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        mealType: [...formData.mealType, type as any],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        mealType: formData.mealType.filter((t) => t !== type),
                      });
                    }
                  }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/my-recipes')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || formData.mealType.length === 0}
          >
            {submitting ? 'Updating...' : 'Update Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// Recipe Form Data Type
interface RecipeFormData {
  title: string;
  description: string;
  mainIngredient: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookingTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  mealType: MealType[];
  cuisineType?: string;
  dietaryInfo?: DietaryInfo;
  nutritionInfo?: NutritionInfo;
  allergies?: string[];
  imageUrls?: string[]; // Array of image URLs (max 3)
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DESSERT';

interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isKeto: boolean;
  isPaleo: boolean;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

// API Response Type
interface UpdateRecipeResponse {
  status: 'success' | 'error';
  data: {
    recipe: Recipe;
  };
  message: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  mainIngredient: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookingTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  mealType: MealType[];
  cuisineType: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  imageUrls: string[]; // Array of image URLs (max 3)
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## Image Management (Multiple Images Support)

### Upload Images (Max 3 per Recipe)

```typescript
// Upload single image and get URL
async function uploadRecipeImage(imageFile: File): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(
    'http://localhost:3000/api/v1/recipes/upload-image',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  const data = await response.json();
  return data.data.imageUrl; // Return the uploaded image URL
}

// Handle multiple image uploads
async function uploadMultipleImages(files: File[]): Promise<string[]> {
  if (files.length > 3) {
    throw new Error('Maximum 3 images allowed');
  }

  const uploadPromises = files.map(file => uploadRecipeImage(file));
  return await Promise.all(uploadPromises);
}
```

### Image Management Component

```tsx
interface ImageManagerProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

function ImageManager({ imageUrls, onChange, maxImages = 3 }: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imageUrls.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const newUrls = await uploadMultipleImages(files);
      onChange([...imageUrls, ...newUrls]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    onChange(imageUrls.filter(url => url !== urlToRemove));
  };

  return (
    <div className="image-manager">
      <label>Recipe Images (Max {maxImages})</label>
      
      {/* Display current images */}
      <div className="image-grid">
        {imageUrls.map((url, index) => (
          <div key={url} className="image-item">
            <img src={url} alt={`Recipe ${index + 1}`} />
            <button
              type="button"
              onClick={() => handleRemoveImage(url)}
              className="btn-remove-image"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Upload button */}
      {imageUrls.length < maxImages && (
        <div className="upload-section">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            id="image-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload" className="btn-upload">
            {uploading ? 'Uploading...' : '+ Add Images'}
          </label>
          <p className="help-text">
            {imageUrls.length}/{maxImages} images • Max 5MB per image • JPEG, PNG, WebP, GIF
          </p>
        </div>
      )}
    </div>
  );
}

// Usage in Edit Recipe Form
<ImageManager
  imageUrls={formData.imageUrls || []}
  onChange={(urls) => setFormData({ ...formData, imageUrls: urls })}
  maxImages={3}
/>
```

### Image Deletion Behavior

**Important**: When you update a recipe with new `imageUrls` array:
- Images **removed from the array** are **automatically deleted** from Supabase Storage
- You don't need to call a separate delete endpoint
- The backend handles cleanup automatically

**Example**:
```typescript
// Original recipe has 3 images
const original = {
  imageUrls: ['url1', 'url2', 'url3']
};

// User removes 'url2' from UI
const updated = {
  imageUrls: ['url1', 'url3'] // Missing url2
};

// When you submit PUT /recipes/:id with updated imageUrls
// Backend automatically deletes 'url2' from storage
await updateRecipe(recipeId, updated);
```

### CSS for Image Manager

```css
/* Image Manager */
.image-manager {
  margin-bottom: 24px;
}

.image-manager label {
  display: block;
  font-weight: 500;
  margin-bottom: 12px;
  color: #374151;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.image-item {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-remove-image:hover {
  background: rgba(220, 38, 38, 1);
}

.upload-section {
  text-align: center;
}

.btn-upload {
  display: inline-block;
  padding: 12px 24px;
  background: #f3f4f6;
  border: 2px dashed #9ca3af;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: #374151;
}

.btn-upload:hover {
  background: #e5e7eb;
  border-color: #6b7280;
}

.help-text {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}
```

---

## Error Handling

### Handle Different Error Responses

```typescript
async function updateRecipe(recipeId: string, formData: RecipeFormData) {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please login to continue');
    }

    const response = await fetch(
      `http://localhost:3000/api/v1/recipes/${recipeId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }
    );

    // Handle specific error codes
    if (response.status === 400) {
      const errorData = await response.json();
      
      // Check if it's an approved recipe error
      if (errorData.message.includes('approved recipes')) {
        throw new Error('This recipe is approved and cannot be edited. Please contact an admin.');
      }
      
      // Validation errors
      if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors.join('\n'));
      }
      
      throw new Error(errorData.message || 'Invalid recipe data');
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to edit this recipe');
    }

    if (response.status === 404) {
      throw new Error('Recipe not found');
    }

    if (response.status === 500) {
      throw new Error('Server error. Please try again later.');
    }

    if (!response.ok) {
      throw new Error('Failed to update recipe');
    }

    const data = await response.json();
    return data.data.recipe;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
}
```

---

## Success Messages

### Show Appropriate Messages Based on Status

```typescript
function getSuccessMessage(originalStatus: string) {
  if (originalStatus === 'REJECTED') {
    return 'Recipe updated and resubmitted for review! Your recipe will be reviewed by an admin again.';
  }
  
  if (originalStatus === 'PENDING') {
    return 'Recipe updated successfully! Your changes have been saved.';
  }
  
  return 'Recipe updated successfully!';
}

// Usage after successful update
const message = getSuccessMessage(originalStatus);
alert(message);
// or use a toast notification
toast.success(message);
```

---

## Info Banner for Rejected Recipes

### Show Info When Editing Rejected Recipes

```tsx
function RejectedRecipeInfo() {
  return (
    <div
      style={{
        backgroundColor: '#dbeafe',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'start',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '20px' }}>ℹ️</span>
      <div>
        <strong style={{ color: '#1e40af' }}>Resubmission Notice</strong>
        <p style={{ color: '#1e3a8a', margin: '4px 0 0' }}>
          This recipe was previously rejected. After updating, it will be automatically
          resubmitted with PENDING status for admin review.
        </p>
      </div>
    </div>
  );
}

// Usage in edit form
{originalStatus === 'REJECTED' && <RejectedRecipeInfo />}
```

---

## Check If Recipe Can Be Edited

### Helper Function to Validate Edit Permission

```typescript
function canEditRecipe(recipe: Recipe, currentUserId: string, userRole: string): boolean {
  // Cannot edit approved recipes
  if (recipe.status === 'APPROVED') {
    return false;
  }
  
  // Admin can edit any non-approved recipe
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // Chef can only edit their own non-approved recipes
  if (userRole === 'CHEF' && recipe.author.id === currentUserId) {
    return true;
  }
  
  return false;
}

// Usage
if (!canEditRecipe(recipe, user.id, user.role)) {
  navigate('/my-recipes');
  toast.error('You cannot edit this recipe');
}
```

---

## Integration with My Recipes Page

### Add Edit Button Logic

```tsx
function RecipeCard({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    // Only PENDING and REJECTED recipes can be edited
    if (recipe.status === 'APPROVED') {
      alert('Approved recipes cannot be edited');
      return;
    }
    
    navigate(`/recipes/${recipe.id}/edit`);
  };

  return (
    <div className="recipe-card">
      {/* ... recipe content ... */}
      
      <div className="recipe-actions">
        {recipe.status === 'APPROVED' && (
          <button onClick={() => navigate(`/recipes/${recipe.id}`)}>
            View Recipe
          </button>
        )}
        
        {(recipe.status === 'PENDING' || recipe.status === 'REJECTED') && (
          <button onClick={handleEdit} className="btn-edit">
            Edit Recipe
          </button>
        )}
        
        <button onClick={handleDelete} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  );
}
```

---

## Request Body Validation

### Frontend Validation Before Sending

```typescript
function validateRecipeForm(formData: RecipeFormData): string[] {
  const errors: string[] = [];

  if (formData.title.length < 3 || formData.title.length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }

  if (formData.description.length < 10 || formData.description.length > 500) {
    errors.push('Description must be between 10 and 500 characters');
  }

  if (formData.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }

  if (formData.instructions.length === 0) {
    errors.push('At least one instruction is required');
  }

  if (formData.instructions.length > 20) {
    errors.push('Maximum 20 instructions allowed');
  }

  if (formData.prepTime < 1 || formData.prepTime > 300) {
    errors.push('Prep time must be between 1 and 300 minutes');
  }

  if (formData.cookingTime < 1 || formData.cookingTime > 300) {
    errors.push('Cooking time must be between 1 and 300 minutes');
  }

  if (formData.servings < 1 || formData.servings > 20) {
    errors.push('Servings must be between 1 and 20');
  }

  if (formData.mealType.length === 0 || formData.mealType.length > 5) {
    errors.push('Select 1 to 5 meal types');
  }

  return errors;
}

// Usage before submitting
const errors = validateRecipeForm(formData);
if (errors.length > 0) {
  setError(errors.join('\n'));
  return;
}
```

---

## Sample CSS Styling

```css
/* Edit Recipe Page */
.edit-recipe-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.edit-recipe-page h1 {
  margin-bottom: 24px;
  color: #111827;
}

/* Info Banner */
.info-banner {
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #1e3a8a;
}

/* Error Banner */
.error-banner {
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #991b1b;
}

/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Form Row */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

/* Action Buttons */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  padding: 10px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 24px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-secondary:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

/* Error Container */
.error-container {
  text-align: center;
  padding: 60px 20px;
}

.error-container h2 {
  color: #111827;
  margin-bottom: 16px;
}

.error-container .error {
  color: #ef4444;
  margin-bottom: 24px;
}
```

---

## DO's ✅

1. **DO** load existing recipe data before showing the form
2. **DO** check if recipe status is APPROVED and prevent editing
3. **DO** show info banner for REJECTED recipes about resubmission
4. **DO** validate form data on frontend before submitting
5. **DO** use `Authorization: Bearer {token}` header
6. **DO** handle all error responses (400, 403, 404)
7. **DO** show appropriate success message based on original status
8. **DO** redirect to My Recipes page after successful update
9. **DO** disable submit button while submitting
10. **DO** pre-fill all form fields with current recipe data
11. **DO** validate max 3 images per recipe
12. **DO** upload images first via `/upload-image` endpoint before updating recipe
13. **DO** display image preview with remove buttons
14. **DO** understand that removed images are automatically deleted from storage

---

## DON'Ts ❌

1. **DON'T** forget to check recipe ownership before allowing edit
2. **DON'T** allow editing APPROVED recipes
3. **DON'T** forget to include the Authorization header
4. **DON'T** forget to validate mealType array (1-5 items required)
5. **DON'T** submit without validating required fields
6. **DON'T** forget to handle the case when recipe is not found
7. **DON'T** expose the JWT token in URLs
8. **DON'T** allow more than 3 images per recipe
9. **DON'T** manually call delete endpoint for images - backend handles it automatically
10. **DON'T** forget to validate image file types (JPEG, PNG, WebP, GIF only)
11. **DON'T** allow images larger than 5MB

---

## Testing Checklist

### Before Deployment
- [ ] Can load existing recipe data for editing
- [ ] APPROVED recipes block editing with error message
- [ ] PENDING recipes can be edited
- [ ] REJECTED recipes can be edited
- [ ] Info banner shows for REJECTED recipes
- [ ] Form validates all required fields
- [ ] MealType requires 1-5 selections
- [ ] Submit button disabled while submitting
- [ ] Success message shows after update
- [ ] REJECTED recipe resets to PENDING after update
- [ ] User redirected to My Recipes after success
- [ ] 403 error shows when editing someone else's recipe
- [ ] 404 error shows when recipe not found
- [ ] Loading state displays while fetching recipe
- [ ] Error messages display for validation failures
- [ ] Image upload works (single and multiple)
- [ ] Maximum 3 images enforced
- [ ] Image removal works correctly
- [ ] Removed images are deleted from storage on update
- [ ] Image file type validation (JPEG, PNG, WebP, GIF)
- [ ] Image size validation (max 5MB)
- [ ] Image preview displays correctly

---

## API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/recipes/:id` | GET | ✅ | Get recipe details for editing |
| `/api/v1/recipes/:id` | PUT | ✅ | Update recipe (auto-deletes removed images) |
| `/api/v1/recipes/my-recipes` | GET | ✅ | List user's recipes |
| `/api/v1/recipes/upload-image` | POST | ✅ | Upload single recipe image (max 5MB) |

---

## Complete Workflow

1. **User clicks "Edit" button** on My Recipes page (PENDING or REJECTED recipe)
2. **Navigate to edit page** with recipe ID in URL
3. **Fetch recipe data** via GET /recipes/:id
4. **Check if editable** (not APPROVED, user is owner/admin)
5. **Pre-fill form** with current recipe data
6. **Show info banner** if recipe was REJECTED
7. **User makes changes** to form fields
8. **Validate form** before submission
9. **Submit via PUT** /recipes/:id with updated data
10. **Handle response**:
    - Success → Show message → Redirect to My Recipes
    - Error → Display error message
11. **If was REJECTED** → Now shows as PENDING in My Recipes

---

## Environment Variables

```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Or for production
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

Usage:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const url = `${API_BASE_URL}/recipes/${recipeId}`;
```

---

## Summary

The Recipe Update endpoint:
- ✅ Updates PENDING and REJECTED recipes
- ✅ Blocks APPROVED recipe updates
- ✅ Auto-resets REJECTED → PENDING on update
- ✅ Clears rejection data when resubmitting
- ✅ Validates all input using same schema as submission
- ✅ Requires authentication and ownership
- ✅ Returns updated recipe with new timestamp
- ✅ Supports multiple images (up to 3 per recipe)
- ✅ Automatically deletes removed images from storage
- ✅ No manual image cleanup needed

**Authentication**: Always include `Authorization: Bearer {token}` header

**Image Management**:
- Upload images first via `POST /api/v1/recipes/upload-image`
- Get image URL, add to `imageUrls` array
- Max 3 images per recipe
- Removed images automatically deleted from Supabase Storage
- Supported formats: JPEG, PNG, WebP, GIF
- Max size: 5MB per image

**Typical Edit Flow**:
1. Load recipe → Check if editable → Pre-fill form
2. User edits → Validate → Submit
3. Success → Redirect to My Recipes
4. If REJECTED → Now PENDING (ready for re-review)

Now your frontend team can implement the recipe edit feature! 🚀
