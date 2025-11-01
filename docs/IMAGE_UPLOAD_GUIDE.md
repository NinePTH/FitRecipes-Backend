# Recipe Image Upload - Implementation Guide

## Overview

Complete image upload functionality for recipe submissions with automatic validation, optimization, and secure storage in Supabase.

---

## 📋 Endpoint Summary

### POST /api/v1/recipes/upload-image

Upload a recipe image with automatic validation, optimization, and storage.

**Authentication**: Required (JWT Bearer token)  
**Authorization**: CHEF or ADMIN role only  
**Rate Limit**: 50 uploads per hour per IP  
**Content-Type**: multipart/form-data

---

## 🔐 Authentication & Authorization

### Required Headers
```http
Authorization: Bearer {jwt-token}
Content-Type: multipart/form-data
```

### Role Requirements
- ✅ **CHEF** - Can upload images
- ✅ **ADMIN** - Can upload images
- ❌ **USER** - Cannot upload (403 Forbidden)
- ❌ **Unauthenticated** - Cannot upload (401 Unauthorized)

---

## 📤 Request Format

### Form Data
```typescript
{
  image: File  // Required field name: "image"
}
```

### Frontend Example (React/Next.js)
```typescript
// Example: Upload recipe image
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:3000/api/v1/recipes/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Do NOT set Content-Type - browser will set it automatically with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
};

// Usage in component
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const result = await uploadImage(file);
    const imageUrl = result.data.imageUrl;
    
    // Store imageUrl for recipe submission
    console.log('Image uploaded:', imageUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### cURL Example
```bash
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/recipe-image.jpg"
```

---

## ✅ Validation Rules

### 1. File Required
- Field name must be `image`
- Must be a valid file upload

**Error Response (400)**:
```json
{
  "status": "error",
  "message": "No image file provided"
}
```

### 2. File Type Validation
**Allowed MIME Types**:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

**Validation**:
- Checks both MIME type AND file extension
- Extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

**Error Response (400)**:
```json
{
  "status": "error",
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed"
}
```

### 3. File Size Limit
**Maximum**: 5MB (5,242,880 bytes)

**Error Response (400)**:
```json
{
  "status": "error",
  "message": "File size exceeds 5MB limit"
}
```

### 4. Image Dimensions
**Minimum**: 400x300 pixels  
**Maximum**: 4000x3000 pixels  
**Recommended**: 1200x900 pixels

**Error Response (400)**:
```json
{
  "status": "error",
  "message": "Image dimensions must be between 400x300 and 4000x3000 pixels"
}
```

---

## 🎨 Automatic Image Optimization

The system automatically optimizes uploaded images:

### Optimization Features
1. **Resize**: If image is larger than 1200x900, it's resized (maintaining aspect ratio)
2. **Compression**: Quality set to 85% for all formats
3. **Format Preservation**: Original format is maintained (JPEG stays JPEG, PNG stays PNG, etc.)
4. **No Upscaling**: Small images are NOT enlarged
5. **Aspect Ratio**: Always maintained during resize

### Processing Flow
```
Original Image (e.g., 4000x3000 @ 8MB)
    ↓
Validation (dimensions, size, format)
    ↓
Optimization (resize to 1200x900, quality 85%)
    ↓
Result (1200x900 @ 250KB)
    ↓
Upload to Supabase Storage
```

---

## 📦 Success Response

### HTTP Status: 200 OK

```json
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

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `imageUrl` | string | Public URL to access the image (use this in recipe submission) |
| `publicId` | string | Storage path identifier (used internally for deletion) |
| `width` | number | Final image width in pixels (after optimization) |
| `height` | number | Final image height in pixels (after optimization) |
| `format` | string | Image format (`jpg`, `png`, `webp`, `gif`) |
| `size` | number | Final file size in bytes (after optimization) |

---

## ❌ Error Responses

### 400 Bad Request - No File
```json
{
  "status": "error",
  "message": "No image file provided"
}
```

### 400 Bad Request - Invalid File Type
```json
{
  "status": "error",
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed"
}
```

### 400 Bad Request - File Too Large
```json
{
  "status": "error",
  "message": "File size exceeds 5MB limit"
}
```

### 400 Bad Request - Invalid Dimensions
```json
{
  "status": "error",
  "message": "Image dimensions must be at least 400x300 pixels"
}
```
or
```json
{
  "status": "error",
  "message": "Image dimensions must not exceed 4000x3000 pixels"
}
```

### 400 Bad Request - Invalid Image
```json
{
  "status": "error",
  "message": "Invalid image file. Please upload a valid image."
}
```

### 401 Unauthorized - No Token
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 403 Forbidden - Wrong Role
```json
{
  "status": "error",
  "message": "Only chefs and admins can upload images"
}
```

### 429 Too Many Requests - Rate Limited
```json
{
  "status": "error",
  "message": "Rate limit exceeded"
}
```

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 3600
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Failed to upload image. Please try again"
}
```

---

## 🔒 Security Features

### 1. File Type Validation
- **Double Check**: Both MIME type AND file extension validated
- **No Executables**: Rejects .exe, .sh, .bat, etc.
- **No Scripts**: Rejects .js, .php, .html embedded in images

### 2. File Size Enforcement
- **Hard Limit**: 5MB maximum
- **DOS Prevention**: Large files rejected before processing
- **Memory Protection**: Prevents memory exhaustion attacks

### 3. Image Validation
- **Real Image Check**: Uses Sharp library to verify actual image data
- **Malware Prevention**: Validates image headers and structure
- **Dimension Validation**: Ensures reasonable image sizes

### 4. Rate Limiting
- **Upload Limit**: 50 uploads per hour per IP address
- **Abuse Prevention**: Prevents spam and resource exhaustion
- **Per-IP Tracking**: Each IP has independent rate limit

### 5. Filename Sanitization
- **No Original Filenames**: Original names discarded
- **UUID-Based**: Uses timestamp + random string
- **Format**: `recipe-{timestamp}-{random}.{ext}`
- **Example**: `recipe-1698765432100-x7k2m9p.jpg`

### 6. Storage Security
- **Supabase Storage**: Secure cloud storage with access controls
- **Public URLs**: Images are publicly accessible (read-only)
- **Automatic Cleanup**: Images deleted when recipe is deleted

---

## 🗑️ Automatic Image Deletion

When a recipe is deleted, the associated image is automatically removed from storage.

### DELETE /api/v1/recipes/:id

**Authorization**:
- Chef can delete own recipes (and their images)
- Admin can delete any recipe (and their images)

**Process**:
1. Verify user authorization
2. Extract image URL from recipe
3. Extract publicId from URL
4. Delete image from Supabase Storage
5. Delete recipe from database (cascade deletes comments/ratings)

**Error Handling**:
- Image deletion failures are logged but don't block recipe deletion
- Recipe is always deleted even if image deletion fails

---

## 📊 Technical Implementation

### Technology Stack
- **Image Processing**: Sharp library (fast, production-ready)
- **Storage**: Supabase Storage (S3-compatible)
- **Validation**: Custom validators + Sharp metadata
- **Rate Limiting**: In-memory rate limiter (per-IP)

### File Structure
```
src/
├── utils/
│   └── imageUpload.ts          # Complete image processing utilities
├── controllers/
│   └── recipeController.ts     # uploadImage controller
├── services/
│   └── recipeService.ts        # deleteRecipe with image cleanup
├── routes/
│   └── recipe.ts               # Route definitions
└── middlewares/
    └── rateLimit.ts            # uploadRateLimitMiddleware
```

### Key Functions

**`uploadRecipeImage(buffer, filename, mimeType)`**
- Validates file type, size, dimensions
- Optimizes image (resize + compress)
- Uploads to Supabase Storage
- Returns image metadata

**`deleteRecipeImage(publicId)`**
- Deletes image from Supabase Storage
- Called automatically when recipe is deleted

**`extractPublicIdFromUrl(imageUrl)`**
- Extracts storage path from public URL
- Used for image deletion

---

## 🧪 Testing Guide

### Manual Testing

#### 1. Valid Upload (200 OK)
```bash
# Upload a valid JPEG
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"

# Expected: 200 OK with imageUrl, publicId, dimensions, etc.
```

#### 2. Invalid File Type (400)
```bash
# Try to upload a PDF
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@document.pdf"

# Expected: 400 "Invalid file type"
```

#### 3. File Too Large (400)
```bash
# Upload 10MB image
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@huge-image.jpg"

# Expected: 400 "File size exceeds 5MB limit"
```

#### 4. Missing File (400)
```bash
# No file uploaded
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 400 "No image file provided"
```

#### 5. No Authentication (401)
```bash
# No token
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -F "image=@test-image.jpg"

# Expected: 401 "Authentication required"
```

#### 6. Wrong Role (403)
```bash
# USER role token
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer USER_ROLE_TOKEN" \
  -F "image=@test-image.jpg"

# Expected: 403 "Only chefs and admins can upload images"
```

#### 7. Rate Limiting (429)
```bash
# Upload 51 images in one hour
for i in {1..51}; do
  curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "image=@test-image.jpg"
done

# Expected: First 50 succeed, 51st gets 429 "Rate limit exceeded"
```

### Frontend Testing Checklist

- [ ] Upload JPEG image (< 5MB)
- [ ] Upload PNG image (< 5MB)
- [ ] Upload WebP image (< 5MB)
- [ ] Upload GIF image (< 5MB)
- [ ] Try uploading non-image file (expect error)
- [ ] Try uploading > 5MB file (expect error)
- [ ] Try uploading tiny image (< 400x300) (expect error)
- [ ] Try uploading huge image (> 4000x3000) (expect error)
- [ ] Verify image is optimized (check returned size)
- [ ] Verify imageUrl works (can load in browser)
- [ ] Use imageUrl in recipe submission
- [ ] Delete recipe and verify image is removed from storage
- [ ] Test rate limiting (50+ uploads)
- [ ] Test with USER role (expect 403)
- [ ] Test without authentication (expect 401)

---

## 📝 Usage Workflow

### Complete Recipe Submission with Image

```typescript
// Step 1: Upload image first
const formData = new FormData();
formData.append('image', selectedFile);

const uploadResponse = await fetch('/api/v1/recipes/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const uploadResult = await uploadResponse.json();
const imageUrl = uploadResult.data.imageUrl;

// Step 2: Submit recipe with imageUrl
const recipeData = {
  title: "Delicious Pasta",
  description: "A tasty pasta dish",
  mainIngredient: "pasta",
  ingredients: [
    { name: "pasta", amount: "500", unit: "g" },
    { name: "tomato sauce", amount: "300", unit: "ml" }
  ],
  instructions: [
    "Boil pasta",
    "Add sauce",
    "Serve hot"
  ],
  cookingTime: 20,
  servings: 4,
  difficulty: "EASY",
  prepTime: 10,
  mealType: ["LUNCH", "DINNER"],
  imageUrl: imageUrl,  // Image URL from step 1
};

const recipeResponse = await fetch('/api/v1/recipes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(recipeData),
});

const recipe = await recipeResponse.json();
console.log('Recipe created:', recipe);
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Supabase Storage Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_BUCKET_NAME=recipe-images

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes (global)
RATE_LIMIT_MAX_REQUESTS=100       # 100 requests per window
```

### Image Configuration (in code)

Located in `src/utils/imageUpload.ts`:

```typescript
export const IMAGE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024,     // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  minWidth: 400,
  minHeight: 300,
  maxWidth: 4000,
  maxHeight: 3000,
  recommendedWidth: 1200,
  recommendedHeight: 900,
  optimizeQuality: 85,
};
```

To adjust limits, modify these values and redeploy.

---

## 📚 Related Documentation

- [Recipe Submission Guide](./RECIPE_API_IMPLEMENTATION_GUIDE.md)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)

---

**Last Updated**: October 29, 2025  
**Status**: ✅ Fully Implemented  
**Endpoint**: POST /api/v1/recipes/upload-image  
**Version**: 1.0.0
