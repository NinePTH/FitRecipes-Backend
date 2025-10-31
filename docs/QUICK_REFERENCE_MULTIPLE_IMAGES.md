# Quick Reference - Multiple Images API

## 🎯 What Changed?

**Before**: Recipes had single `imageUrl` field  
**Now**: Recipes have `imageUrls` array (max 3 images)

---

## 📤 Request Format

### Submit Recipe (POST /recipes)
```json
{
  "title": "Pasta Carbonara",
  "description": "Classic Italian pasta",
  "imageUrls": [
    "https://supabase.co/storage/recipes/img1.jpg",
    "https://supabase.co/storage/recipes/img2.jpg",
    "https://supabase.co/storage/recipes/img3.jpg"
  ]
}
```

### Update Recipe (PUT /recipes/:id)
```json
{
  "imageUrls": [
    "https://supabase.co/storage/recipes/img1.jpg"
  ]
}
```
☝️ **If recipe originally had 3 images, the 2 removed images are automatically deleted from storage!**

---

## 📥 Response Format

```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "abc123",
      "title": "Pasta Carbonara",
      "imageUrls": ["url1", "url2", "url3"],
      "..."
    }
  }
}
```

---

## ✨ Key Features

### 1. Maximum 3 Images
```json
// ✅ Valid
{ "imageUrls": ["url1"] }
{ "imageUrls": ["url1", "url2"] }
{ "imageUrls": ["url1", "url2", "url3"] }
{ "imageUrls": [] }

// ❌ Invalid - Returns 400 error
{ "imageUrls": ["url1", "url2", "url3", "url4"] }
```

### 2. Automatic Image Cleanup
```typescript
// Original recipe
imageUrls: ['img1.jpg', 'img2.jpg', 'img3.jpg']

// User updates to remove img2
PUT /recipes/:id
{
  "imageUrls": ['img1.jpg', 'img3.jpg']
}

// Backend automatically:
// ✅ Deletes img2.jpg from Supabase Storage
// ✅ Updates database with new array
// ✅ Returns success response
```

### 3. Image Upload Workflow

```typescript
// Step 1: Upload each image
const file1 = document.getElementById('file1').files[0];
const formData = new FormData();
formData.append('image', file1);

const response = await fetch('/api/v1/recipes/upload-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data } = await response.json();
const imageUrl = data.imageUrl; // "https://..."

// Step 2: Collect all uploaded URLs
const imageUrls = [imageUrl1, imageUrl2, imageUrl3];

// Step 3: Submit recipe with image URLs
await fetch('/api/v1/recipes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Recipe',
    imageUrls: imageUrls, // Max 3
    // ... other fields
  })
});
```

---

## 🚫 Validation Rules

| Rule | Enforcement | Error Code |
|------|-------------|------------|
| Max 3 images | Schema validation | 400 |
| Each URL must be valid | Zod validation | 400 |
| Array type required | Zod validation | 400 |
| Optional field | Can be empty array `[]` | - |

---

## 🔄 Migration Notes

### Data Preservation
- ✅ Existing `imageUrl` migrated to `imageUrls[0]`
- ✅ Recipes without images: `imageUrls = []`
- ✅ Zero data loss during migration
- ✅ Applied: `20251031000000_add_multiple_images_support`

### Breaking Changes
⚠️ **API Change**: `imageUrl` field no longer exists in responses

**Before**:
```json
{ "imageUrl": "https://..." }
```

**After**:
```json
{ "imageUrls": ["https://..."] }
```

**Frontend must update**:
```typescript
// ❌ Old code - Will break!
const image = recipe.imageUrl;

// ✅ New code - Works!
const images = recipe.imageUrls; // Array
const firstImage = recipe.imageUrls[0]; // First image (if exists)
```

---

## 🎨 Frontend Display Examples

### Display First Image Only
```tsx
{recipe.imageUrls.length > 0 && (
  <img src={recipe.imageUrls[0]} alt={recipe.title} />
)}
```

### Display All Images (Gallery)
```tsx
<div className="image-gallery">
  {recipe.imageUrls.map((url, index) => (
    <img 
      key={url} 
      src={url} 
      alt={`${recipe.title} - Photo ${index + 1}`} 
    />
  ))}
</div>
```

### Display with Fallback
```tsx
const imageUrl = recipe.imageUrls[0] || '/placeholder.jpg';
<img src={imageUrl} alt={recipe.title} />
```

---

## ❓ FAQ

### Q: What happens to removed images?
**A**: They are automatically deleted from Supabase Storage when you update the recipe.

### Q: Can I have 0 images?
**A**: Yes, `imageUrls: []` is valid.

### Q: Do I need to delete images manually?
**A**: No! Just remove the URL from the array and submit the update.

### Q: What if I want to keep all images but add one more?
**A**: 
```typescript
// Current: 2 images
imageUrls: ['img1.jpg', 'img2.jpg']

// Update: Keep old + add new
imageUrls: ['img1.jpg', 'img2.jpg', 'new-img3.jpg']
```

### Q: Can I reorder images?
**A**: Yes, just change the array order:
```typescript
// Before: ['img1', 'img2', 'img3']
// After:  ['img3', 'img1', 'img2']
```

### Q: What image formats are supported?
**A**: JPEG, PNG, WebP, GIF (max 5MB each)

### Q: Where should I upload images?
**A**: Use `POST /api/v1/recipes/upload-image` endpoint first, then use returned URL

---

## 🚀 Quick Start

### 1. Upload Images
```bash
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo1.jpg"

# Response:
# { "data": { "imageUrl": "https://..." } }
```

### 2. Create Recipe with Images
```bash
curl -X POST http://localhost:3000/api/v1/recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pasta",
    "description": "Yummy",
    "imageUrls": ["https://url1", "https://url2"],
    "..."
  }'
```

### 3. Update Recipe (Remove Image)
```bash
curl -X PUT http://localhost:3000/api/v1/recipes/RECIPE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": ["https://url1"]
  }'

# url2 is automatically deleted from storage!
```

---

## 📚 Full Documentation

- **Frontend Guide**: `docs/FRONTEND_RECIPE_UPDATE_GUIDE.md`
- **Implementation Details**: `docs/MULTIPLE_IMAGES_IMPLEMENTATION.md`
- **Image Upload**: `docs/FRONTEND_IMAGE_UPLOAD_GUIDE.md`

---

**Last Updated**: October 31, 2025  
**Status**: ✅ Ready for use
