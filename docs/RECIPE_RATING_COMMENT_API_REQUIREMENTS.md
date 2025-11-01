# Recipe Rating & Comment API Specification

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Frontend Repository:** FitRecipes-Frontend  
**Target Backend:** `https://fitrecipes-backend.onrender.com/api/v1`

---

## 📋 Overview

This document specifies the API requirements for implementing Recipe Rating and Comment features (Community Features) in the FitRecipes application. These features allow users to rate recipes (1-5 stars), leave comments, and view other users' ratings and comments.

---

## 🎯 Required Endpoints

### **1. Submit Recipe Rating**

#### **Endpoint**
```
POST /api/v1/recipes/:recipeId/ratings
```

#### **Description**
Submit or update a rating for a recipe. Users can rate a recipe once, and subsequent requests should update their existing rating (not create a new one).

#### **Authentication**
- **Required**: Yes (JWT token)
- Only authenticated users can submit ratings
- Users can only rate APPROVED recipes

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe to rate |

**Request Body:**
```typescript
{
  "rating": number // Integer 1-5
}
```

#### **Validation Rules**
- `rating` must be an integer between 1 and 5 (inclusive)
- User cannot rate their own recipe
- Recipe must have `status: 'APPROVED'`
- One rating per user per recipe (upsert behavior)

#### **Response Format**

**Success (201 Created or 200 OK for updates):**
```typescript
{
  "status": "success",
  "data": {
    "rating": {
      "id": "uuid",
      "recipeId": "uuid",
      "userId": "uuid",
      "rating": 5,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    },
    "recipeStats": {
      "averageRating": 4.5,
      "totalRatings": 23
    }
  },
  "message": "Rating submitted successfully"
}
```

#### **Error Responses**

**400 Bad Request** - Invalid rating value
```json
{
  "status": "error",
  "data": null,
  "message": "Invalid rating value",
  "errors": [
    {
      "code": "INVALID_RATING",
      "message": "Rating must be between 1 and 5",
      "path": ["rating"]
    }
  ]
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "status": "error",
  "data": null,
  "message": "Authentication required"
}
```

**403 Forbidden** - Cannot rate own recipe
```json
{
  "status": "error",
  "data": null,
  "message": "You cannot rate your own recipe"
}
```

**404 Not Found** - Recipe not found or not approved
```json
{
  "status": "error",
  "data": null,
  "message": "Recipe not found or not available for rating"
}
```

---

### **2. Get User's Rating for a Recipe**

#### **Endpoint**
```
GET /api/v1/recipes/:recipeId/ratings/me
```

#### **Description**
Retrieve the current user's rating for a specific recipe (if it exists).

#### **Authentication**
- **Required**: Yes (JWT token)

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Response Format**

**Success (200 OK):**
```typescript
{
  "status": "success",
  "data": {
    "rating": {
      "id": "uuid",
      "recipeId": "uuid",
      "userId": "uuid",
      "rating": 4,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  },
  "message": "Rating retrieved successfully"
}
```

**Success (200 OK) - No rating yet:**
```typescript
{
  "status": "success",
  "data": null,
  "message": "No rating found for this recipe"
}
```

---

### **3. Get All Ratings for a Recipe**

#### **Endpoint**
```
GET /api/v1/recipes/:recipeId/ratings
```

#### **Description**
Retrieve all ratings for a recipe with pagination (for analytics or displaying rating distribution).

#### **Authentication**
- Optional (public access)

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Items per page (max: 100) |

#### **Response Format**

**Success (200 OK):**
```typescript
{
  "status": "success",
  "data": {
    "ratings": [
      {
        "id": "uuid",
        "recipeId": "uuid",
        "userId": "uuid",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "role": "USER"
        },
        "rating": 5,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "stats": {
      "averageRating": 4.5,
      "totalRatings": 23,
      "distribution": {
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 7,
        "5": 10
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 23,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Ratings retrieved successfully"
}
```

---

### **4. Delete User's Rating**

#### **Endpoint**
```
DELETE /api/v1/recipes/:recipeId/ratings/me
```

#### **Description**
Delete the current user's rating for a recipe.

#### **Authentication**
- **Required**: Yes (JWT token)

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Response Format**

**Success (200 OK):**
```typescript
{
  "status": "success",
  "data": {
    "recipeStats": {
      "averageRating": 4.3,
      "totalRatings": 22
    }
  },
  "message": "Rating deleted successfully"
}
```

**404 Not Found** - No rating to delete
```json
{
  "status": "error",
  "data": null,
  "message": "No rating found to delete"
}
```

---

## 💬 Comment Endpoints

### **5. Add Comment to Recipe**

#### **Endpoint**
```
POST /api/v1/recipes/:recipeId/comments
```

#### **Description**
Add a comment to a recipe. Users can leave multiple comments on the same recipe.

#### **Authentication**
- **Required**: Yes (JWT token)
- Only authenticated users can comment
- Users can comment on APPROVED recipes only

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe to comment on |

**Request Body:**
```typescript
{
  "content": string // Comment text (min: 1 char, max: 1000 chars)
}
```

#### **Validation Rules**
- `content` is required and must not be empty after trimming
- `content` length: 1-1000 characters
- Recipe must have `status: 'APPROVED'`
- User can comment on their own recipe

#### **Response Format**

**Success (201 Created):**
```typescript
{
  "status": "success",
  "data": {
    "comment": {
      "id": "uuid",
      "recipeId": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "CHEF",
        "email": "jane@example.com" // Optional
      },
      "content": "This recipe is amazing! I made it for my family and they loved it.",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  },
  "message": "Comment added successfully"
}
```

#### **Error Responses**

**400 Bad Request** - Invalid comment
```json
{
  "status": "error",
  "data": null,
  "message": "Invalid comment content",
  "errors": [
    {
      "code": "INVALID_CONTENT",
      "message": "Comment content is required",
      "path": ["content"]
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "status": "error",
  "data": null,
  "message": "Authentication required"
}
```

**404 Not Found** - Recipe not found or not approved
```json
{
  "status": "error",
  "data": null,
  "message": "Recipe not found or not available for commenting"
}
```

---

### **6. Get Comments for Recipe**

#### **Endpoint**
```
GET /api/v1/recipes/:recipeId/comments
```

#### **Description**
Retrieve all comments for a recipe with pagination, sorted by creation date (newest first).

#### **Authentication**
- Optional (public access)

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 10 | Items per page (max: 50) |
| `sortBy` | string | No | `createdAt` | Sort field: `createdAt` |
| `sortOrder` | string | No | `desc` | Sort order: `asc` or `desc` |

#### **Response Format**

**Success (200 OK):**
```typescript
{
  "status": "success",
  "data": {
    "comments": [
      {
        "id": "uuid",
        "recipeId": "uuid",
        "userId": "uuid",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "role": "USER",
          "email": "john@example.com" // Optional
        },
        "content": "Great recipe! Easy to follow and delicious.",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      },
      {
        "id": "uuid",
        "recipeId": "uuid",
        "userId": "uuid",
        "user": {
          "id": "uuid",
          "firstName": "Maria",
          "lastName": "Rodriguez",
          "role": "CHEF",
          "email": "maria@example.com" // Optional
        },
        "content": "Thank you! Glad you enjoyed it!",
        "createdAt": "2025-01-15T11:30:00Z",
        "updatedAt": "2025-01-15T11:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Comments retrieved successfully"
}
```

---

### **7. Update Comment**

#### **Endpoint**
```
PUT /api/v1/recipes/:recipeId/comments/:commentId
```

#### **Description**
Update a comment. Users can only update their own comments.

#### **Authentication**
- **Required**: Yes (JWT token)

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |
| `commentId` | string (UUID) | Yes | The ID of the comment to update |

**Request Body:**
```typescript
{
  "content": string // Updated comment text (min: 1 char, max: 1000 chars)
}
```

#### **Validation Rules**
- `content` is required and must not be empty after trimming
- `content` length: 1-1000 characters
- User can only update their own comments

#### **Response Format**

**Success (200 OK):**
```typescript
{
  "status": "success",
  "data": {
    "comment": {
      "id": "uuid",
      "recipeId": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER"
      },
      "content": "Updated comment text",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T12:00:00Z"
    }
  },
  "message": "Comment updated successfully"
}
```

#### **Error Responses**

**403 Forbidden** - Not comment owner
```json
{
  "status": "error",
  "data": null,
  "message": "You can only update your own comments"
}
```

**404 Not Found** - Comment not found
```json
{
  "status": "error",
  "data": null,
  "message": "Comment not found"
}
```

---

### **8. Delete Comment**

#### **Endpoint**
```
DELETE /api/v1/recipes/:recipeId/comments/:commentId
```

#### **Description**
Delete a comment. Users can delete their own comments. Admins can delete any comment.

#### **Authentication**
- **Required**: Yes (JWT token)

#### **Request Parameters**

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |
| `commentId` | string (UUID) | Yes | The ID of the comment to delete |

#### **Authorization Rules**
- Comment owner can delete their own comment
- ADMIN role can delete any comment
- Other users cannot delete comments

#### **Response Format**

**Success (200 OK):**
```typescript
{
  "status": "success",
  "data": null,
  "message": "Comment deleted successfully"
}
```

#### **Error Responses**

**403 Forbidden** - Not authorized
```json
{
  "status": "error",
  "data": null,
  "message": "You can only delete your own comments"
}
```

**404 Not Found** - Comment not found
```json
{
  "status": "error",
  "data": null,
  "message": "Comment not found"
}
```

---

## 📊 Recipe Detail Page Integration

When fetching a recipe for the detail page (`GET /api/v1/recipes/:id`), include rating and comment metadata:

### **Enhanced Recipe Response**

```typescript
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "uuid",
      "title": "Mediterranean Quinoa Bowl",
      // ... other recipe fields ...
      
      // Rating Information
      "averageRating": 4.5,
      "totalRatings": 23,
      
      // Comment Information
      "totalComments": 45,
      
      // Recent Comments (optional - first 5 comments)
      "comments": [
        {
          "id": "uuid",
          "userId": "uuid",
          "user": {
            "id": "uuid",
            "firstName": "John",
            "lastName": "Doe",
            "role": "USER"
          },
          "content": "Amazing recipe!",
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        }
        // ... up to 5 comments
      ]
    }
  },
  "message": "Recipe retrieved successfully"
}
```

**Frontend will then:**
1. Display initial comments from recipe response
2. Load more comments via `GET /api/v1/recipes/:recipeId/comments` with pagination
3. Check user's rating via `GET /api/v1/recipes/:recipeId/ratings/me` (if authenticated)

---

## 🔔 Real-time Updates (Optional - Future Enhancement)

For real-time comment and rating updates without page refresh, consider implementing:

1. **WebSocket Connection** - Push new comments/ratings to connected clients
2. **Polling** - Frontend periodically checks for new comments/ratings
3. **Server-Sent Events (SSE)** - One-way real-time updates from server

**Not required for MVP** - Frontend will reload comments on action completion.

---

## 🎨 Frontend UI Components

### Current Implementation Status

#### ✅ **Fully Implemented (UI Ready)**

1. **Rating Display** - Star rating (read-only)
   - Shows average rating with total ratings count
   - Example: "★ 4.5 (23 reviews)"

2. **Rating Input** - Interactive star rating (1-5 stars)
   - Click to submit rating
   - Visual feedback on hover
   - Display user's current rating

3. **Comment Form**
   - Textarea for comment input (placeholder text)
   - Submit button with loading state
   - Character validation

4. **Comment List**
   - Display all comments with pagination
   - User avatar (initials)
   - User name and role badge (Chef)
   - Timestamp (formatted: "Jan 15, 2025 at 10:00 AM")
   - Comment content
   - Empty state when no comments

5. **Comment Actions** (Planned)
   - Edit button (own comments only)
   - Delete button (own comments + admin)

---

## 🔧 Implementation Notes

### Rating Logic

**Upsert Behavior:**
- When user submits a rating, check if they already rated this recipe
- If exists: Update existing rating
- If not: Create new rating
- Always return updated `averageRating` and `totalRatings` in response

**Average Rating Calculation:**
```javascript
averageRating = SUM(all_ratings) / COUNT(all_ratings)
```

**Recipe Statistics Update:**
- Update `Recipe.averageRating` field on every rating submission/deletion
- Update `Recipe.totalRatings` counter
- Consider using database triggers or transaction hooks for consistency

### Comment Sorting

**Default Sort:** Newest first (`createdAt DESC`)
- Most recent comments appear at the top
- Users see the latest discussion first

**Alternative Sorts (Future):**
- Oldest first
- Most liked (if like feature is added)

### Content Moderation

**Basic Validation:**
- Trim whitespace from comment content
- Check minimum length (1 character)
- Check maximum length (1000 characters)
- Prevent empty or whitespace-only comments

**Advanced Moderation (Future):**
- Profanity filter
- Spam detection
- Rate limiting (max comments per minute/hour)
- Admin moderation queue for flagged comments

---

## 🚀 Performance Requirements

### Response Times (Target)
- Submit rating: < 300ms
- Get user's rating: < 200ms
- Load comments (first page): < 500ms
- Load more comments (pagination): < 300ms
- Submit comment: < 500ms

### Optimization Recommendations

1. **Database Indexing:**
   - Index on `recipeId` for ratings and comments
   - Index on `userId` for user's ratings lookup
   - Index on `createdAt` for comment sorting
   - Composite index on `(recipeId, userId)` for rating upsert

2. **Caching:**
   - Cache recipe average rating and total ratings (update on write)
   - Cache comment counts per recipe
   - Consider caching top comments (most recent 5-10)

3. **Pagination:**
   - Default limit: 10 comments per page
   - Max limit: 50 comments per page
   - Use cursor-based pagination for better performance (optional)

4. **Aggregation:**
   - Store `averageRating` and `totalRatings` on Recipe model (denormalized)
   - Update these fields on rating create/update/delete
   - Avoid calculating on every recipe fetch

---

## 🧪 Testing Checklist

### Rating Tests
- [ ] User can submit rating (1-5 stars)
- [ ] Rating value is validated (1-5 only)
- [ ] User can update their existing rating
- [ ] User cannot rate their own recipe
- [ ] User cannot rate PENDING or REJECTED recipes
- [ ] Average rating is calculated correctly
- [ ] Total ratings counter is updated
- [ ] User can delete their rating
- [ ] Deleting rating updates recipe statistics

### Comment Tests
- [ ] User can submit comment
- [ ] Comment content is validated (length, empty check)
- [ ] Comments are sorted newest first
- [ ] Pagination works correctly
- [ ] User can update their own comment
- [ ] User cannot update other users' comments
- [ ] User can delete their own comment
- [ ] Admin can delete any comment
- [ ] Comment counter updates on create/delete
- [ ] Empty state displays when no comments

### Edge Cases
- [ ] Concurrent rating submissions (last write wins)
- [ ] Concurrent comment submissions (all succeed)
- [ ] Rating/commenting on deleted recipe (404)
- [ ] Very long comments are rejected (>1000 chars)
- [ ] Empty/whitespace-only comments are rejected
- [ ] Unauthenticated users cannot rate/comment

---

## 📝 Example API Calls

### 1. Submit Rating
```bash
POST /api/v1/recipes/recipe-uuid-123/ratings
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5
}
```

### 2. Get User's Rating
```bash
GET /api/v1/recipes/recipe-uuid-123/ratings/me
Authorization: Bearer {token}
```

### 3. Get All Ratings (with distribution)
```bash
GET /api/v1/recipes/recipe-uuid-123/ratings?page=1&limit=20
```

### 4. Submit Comment
```bash
POST /api/v1/recipes/recipe-uuid-123/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "This recipe is amazing! I made it for my family and they loved it."
}
```

### 5. Get Comments (Paginated)
```bash
GET /api/v1/recipes/recipe-uuid-123/comments?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### 6. Update Comment
```bash
PUT /api/v1/recipes/recipe-uuid-123/comments/comment-uuid-456
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated: This recipe is absolutely amazing!"
}
```

### 7. Delete Comment
```bash
DELETE /api/v1/recipes/recipe-uuid-123/comments/comment-uuid-456
Authorization: Bearer {token}
```

### 8. Delete User's Rating
```bash
DELETE /api/v1/recipes/recipe-uuid-123/ratings/me
Authorization: Bearer {token}
```

---

## 🔗 Related Documentation

- **Recipe Browse API**: See `RECIPE_BROWSE_API_REQUIREMENTS.md`
- **Recipe Detail API**: See `RECIPE_API_IMPLEMENTATION_GUIDE.md`
- **Admin Approval API**: See `ADMIN_APPROVAL_API_REQUIREMENTS.md`
- **Frontend Types**: `src/types/index.ts` (lines 146-165)
- **Recipe Detail Page**: `src/pages/RecipeDetailPage.tsx`

---

## ✅ Acceptance Criteria

1. ✅ **Users can submit ratings (1-5 stars) for APPROVED recipes**
2. ✅ **Rating submission updates or creates user's rating (upsert)**
3. ✅ **Users cannot rate their own recipes**
4. ✅ **Average rating and total ratings are calculated accurately**
5. ✅ **Users can retrieve their own rating for a recipe**
6. ✅ **Users can delete their rating**
7. ✅ **Users can submit comments on APPROVED recipes**
8. ✅ **Comments are paginated and sorted newest first**
9. ✅ **Users can update/delete their own comments**
10. ✅ **Admins can delete any comment**
11. ✅ **Recipe statistics (totalComments, averageRating) are accurate**
12. ✅ **Response times meet performance requirements**
13. ✅ **Error handling follows standard backend format**
14. ✅ **API matches existing backend response format (status, data, message)**

---

## 📞 Questions or Clarifications?

Please contact the frontend team if you need:
- Comment edit/delete UI mockups
- Like/upvote feature on comments (future enhancement)
- Nested replies/threading (future enhancement)
- Comment moderation workflows
- Real-time update implementation details

**Frontend Developer**: NinePTH  
**Date**: October 31, 2025
