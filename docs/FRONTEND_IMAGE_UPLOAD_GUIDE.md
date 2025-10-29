# Recipe Image Upload - Frontend Integration Guide

## Quick Overview

Upload recipe images to the backend with automatic validation, optimization, and secure storage.

**Endpoint**: `POST /api/v1/recipes/upload-image`  
**Auth Required**: Yes (JWT Bearer token)  
**Role Required**: CHEF or ADMIN  
**Content-Type**: `multipart/form-data`  
**Rate Limit**: 50 uploads per hour per IP

---

## 📤 Basic Implementation

### Step 1: Upload Image

```typescript
// TypeScript/React Example
const uploadRecipeImage = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append('image', file); // Field name MUST be "image"

  const response = await fetch('http://localhost:3000/api/v1/recipes/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // DO NOT set Content-Type - browser handles it automatically
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  return result.data.imageUrl; // Use this URL in recipe submission
};
```

### Step 2: Use Image URL in Recipe Submission

```typescript
const submitRecipe = async (recipeData: RecipeData, imageUrl: string, token: string) => {
  const response = await fetch('http://localhost:3000/api/v1/recipes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...recipeData,
      imageUrl: imageUrl, // URL from image upload
    }),
  });

  return await response.json();
};
```

---

## 🎯 Complete React Component Example

```tsx
import { useState } from 'react';

interface ImageUploadResult {
  imageUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export function RecipeImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend validation (optional but recommended)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken'); // Get your auth token
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:3000/api/v1/recipes/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const result = await response.json();
      const uploadResult: ImageUploadResult = result.data;
      
      setImageUrl(uploadResult.imageUrl);
      console.log('Upload successful:', uploadResult);
      
      // Now use uploadResult.imageUrl in your recipe form
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && (
        <div>
          <p>Upload successful!</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '200px' }} />
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Validation Rules

### Frontend Validation (Optional but Recommended)

```typescript
const validateImageFile = (file: File): string | null => {
  // 1. Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, and GIF images are allowed';
  }

  // 2. Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return 'File size must be less than 5MB';
  }

  // 3. Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const extension = file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/);
  if (!extension) {
    return 'Invalid file extension';
  }

  return null; // Validation passed
};

// Usage
const error = validateImageFile(file);
if (error) {
  alert(error);
  return;
}
```

### Backend Validation (Automatic)

The backend automatically validates:
- ✅ **File Type**: JPEG, PNG, WebP, GIF (checks both MIME type and extension)
- ✅ **File Size**: Maximum 5MB
- ✅ **Image Dimensions**: Min 400x300px, Max 4000x3000px
- ✅ **Real Image**: Verifies actual image data (not just extension)

---

## ✅ Success Response

```typescript
interface SuccessResponse {
  status: 'success';
  data: {
    imageUrl: string;    // Use this URL in recipe submission
    publicId: string;    // Internal use (for deletion)
    width: number;       // Final width after optimization
    height: number;      // Final height after optimization
    format: string;      // 'jpg', 'png', 'webp', 'gif'
    size: number;        // Final file size in bytes
  };
  message: string;       // "Image uploaded successfully"
}

// Example response
{
  "status": "success",
  "data": {
    "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/recipe-images/recipes/recipe-1698765432100-x7k2m9p.jpg",
    "publicId": "recipes/recipe-1698765432100-x7k2m9p.jpg",
    "width": 1200,
    "height": 900,
    "format": "jpg",
    "size": 245678
  },
  "message": "Image uploaded successfully"
}
```

---

## ❌ Error Responses

### Common Error Scenarios

```typescript
// 400 Bad Request - No file provided
{
  "status": "error",
  "message": "No image file provided"
}

// 400 Bad Request - Invalid file type
{
  "status": "error",
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed"
}

// 400 Bad Request - File too large
{
  "status": "error",
  "message": "File size exceeds 5MB limit"
}

// 400 Bad Request - Invalid dimensions
{
  "status": "error",
  "message": "Image dimensions must be between 400x300 and 4000x3000 pixels"
}

// 401 Unauthorized
{
  "status": "error",
  "message": "Authentication required"
}

// 403 Forbidden - USER role trying to upload
{
  "status": "error",
  "message": "Only chefs and admins can upload images"
}

// 429 Too Many Requests - Rate limited
{
  "status": "error",
  "message": "Rate limit exceeded"
}

// 500 Internal Server Error
{
  "status": "error",
  "message": "Failed to upload image. Please try again"
}
```

### Error Handling Example

```typescript
const handleUpload = async (file: File, token: string) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:3000/api/v1/recipes/upload-image', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (response.status) {
        case 400:
          alert(`Validation error: ${result.message}`);
          break;
        case 401:
          alert('Please log in to upload images');
          // Redirect to login
          break;
        case 403:
          alert('Only chefs and admins can upload recipe images');
          break;
        case 429:
          alert('Too many uploads. Please try again in an hour');
          break;
        default:
          alert('Upload failed. Please try again');
      }
      return null;
    }

    return result.data.imageUrl;
  } catch (error) {
    console.error('Upload error:', error);
    alert('Network error. Please check your connection');
    return null;
  }
};
```

---

## 🎨 Image Optimization (Automatic)

The backend automatically optimizes all uploaded images:

- **Resize**: If image > 1200x900, it's resized (maintains aspect ratio)
- **Compress**: Quality set to 85% for optimal balance
- **Format**: Original format preserved (JPEG stays JPEG, PNG stays PNG)
- **No Upscaling**: Small images are never enlarged

**Example**:
```
Original: 4000x3000 @ 8MB
    ↓ (automatic)
Optimized: 1200x900 @ 250KB
```

You don't need to do anything - optimization is automatic!

---

## 🔄 Complete Workflow Example

### Two-Step Process: Upload Image → Submit Recipe

```typescript
// Full example with Next.js and TypeScript
import { useState } from 'react';

interface RecipeFormData {
  title: string;
  description: string;
  mainIngredient: string;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  prepTime: number;
  mealType: string[];
  imageUrl?: string;
}

export function CreateRecipeForm() {
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    mainIngredient: '',
    ingredients: [],
    instructions: [],
    cookingTime: 0,
    servings: 0,
    difficulty: 'EASY',
    prepTime: 10,
    mealType: ['DINNER'],
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await fetch('/api/v1/recipes/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      setImageUrl(result.data.imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Submit recipe with image URL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      alert('Please upload an image first');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: imageUrl, // Include uploaded image URL
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      alert('Recipe created successfully!');
      console.log('Recipe:', result.data.recipe);
      
      // Redirect or reset form
    } catch (error) {
      alert(`Failed to create recipe: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Image upload */}
      <div>
        <label>Recipe Image (Required)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageUpload}
          disabled={uploading}
          required
        />
        {uploading && <p>Uploading image...</p>}
        {imageUrl && (
          <img src={imageUrl} alt="Preview" style={{ maxWidth: '200px' }} />
        )}
      </div>

      {/* Rest of recipe form fields... */}
      <input
        type="text"
        placeholder="Recipe Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      
      {/* ... other fields ... */}

      <button type="submit" disabled={submitting || !imageUrl}>
        {submitting ? 'Creating Recipe...' : 'Create Recipe'}
      </button>
    </form>
  );
}
```

---

## 🔑 Key Points for Frontend

### ✅ DO:
1. **Use FormData** for image upload (not JSON)
2. **Field name must be "image"** exactly
3. **Include Authorization header** with JWT token
4. **Do NOT set Content-Type header** (browser handles it)
5. **Upload image BEFORE recipe submission**
6. **Use returned `imageUrl` in recipe data**
7. **Validate file on frontend** for better UX (optional)
8. **Show upload progress/loading state**
9. **Handle all error responses appropriately**
10. **Display preview after upload**

### ❌ DON'T:
1. Don't send image as base64 in JSON
2. Don't set Content-Type to 'application/json'
3. Don't forget the Authorization header
4. Don't use wrong field name (must be 'image')
5. Don't submit recipe before image upload completes
6. Don't upload files > 5MB (validate first)
7. Don't allow USER role to upload (check role first)

---

## 🔒 Authorization Requirements

```typescript
// Check user role before showing upload button
interface User {
  id: string;
  email: string;
  role: 'USER' | 'CHEF' | 'ADMIN';
}

const canUploadImage = (user: User): boolean => {
  return user.role === 'CHEF' || user.role === 'ADMIN';
};

// Usage in component
{canUploadImage(currentUser) ? (
  <input type="file" onChange={handleImageUpload} />
) : (
  <p>Only chefs and admins can upload recipe images</p>
)}
```

---

## 📊 TypeScript Types

```typescript
// Response types for type safety
interface ImageUploadResponse {
  status: 'success' | 'error';
  data?: {
    imageUrl: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
  };
  message: string;
  errors?: string[];
}

// Upload function with proper typing
async function uploadImage(
  file: File,
  token: string
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/v1/recipes/upload-image', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  const result: ImageUploadResponse = await response.json();

  if (!response.ok || result.status === 'error') {
    throw new Error(result.message);
  }

  return result.data!.imageUrl;
}
```

---

## 🧪 Testing Checklist

Frontend testing checklist:

- [ ] Upload JPEG image (should succeed)
- [ ] Upload PNG image (should succeed)
- [ ] Upload WebP image (should succeed)
- [ ] Upload GIF image (should succeed)
- [ ] Try uploading PDF (should show error)
- [ ] Try uploading > 5MB file (should show error)
- [ ] Try uploading without auth token (should get 401)
- [ ] Try uploading as USER role (should get 403)
- [ ] Verify image preview shows after upload
- [ ] Verify imageUrl is included in recipe submission
- [ ] Test upload progress indicator
- [ ] Test error message display
- [ ] Test image optimization (check returned size)
- [ ] Verify uploaded image loads in browser

---

## 🌐 API Endpoints Reference

### Upload Image
```
POST /api/v1/recipes/upload-image
Content-Type: multipart/form-data
Authorization: Bearer {token}
Body: { image: File }
```

### Submit Recipe (with image)
```
POST /api/v1/recipes
Content-Type: application/json
Authorization: Bearer {token}
Body: { ...recipeData, imageUrl: string }
```

### Delete Recipe (auto-deletes image)
```
DELETE /api/v1/recipes/:id
Authorization: Bearer {token}
```

---

## 🔗 Environment Variables

```env
# .env.local or .env.production
NEXT_PUBLIC_API_URL=http://localhost:3000
# or
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

```typescript
// Usage
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

fetch(`${API_URL}/api/v1/recipes/upload-image`, {
  // ...
});
```

---

## 📝 Summary

**Upload Process**:
1. User selects image file
2. Frontend validates (optional)
3. Create FormData with 'image' field
4. POST to `/api/v1/recipes/upload-image` with Bearer token
5. Backend validates, optimizes, uploads to Supabase
6. Returns `imageUrl`
7. Use `imageUrl` in recipe submission

**Key Requirements**:
- Auth token required (CHEF or ADMIN role)
- FormData with field name "image"
- Max 5MB, JPEG/PNG/WebP/GIF only
- Dimensions: 400x300 to 4000x3000 px
- Rate limit: 50 uploads/hour

**What Backend Does Automatically**:
- Validates file type, size, dimensions
- Optimizes and resizes images
- Generates secure filenames
- Uploads to Supabase Storage
- Returns public URL
- Deletes images when recipe is deleted

---

**Last Updated**: October 29, 2025  
**Backend Version**: 1.0.0  
**Status**: ✅ Ready for Frontend Integration
