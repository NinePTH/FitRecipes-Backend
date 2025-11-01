# Rating & Comment API Implementation Guide

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Status:** ✅ Fully Implemented  
**Backend Repository:** FitRecipes-Backend  
**Base URL:** `http://localhost:3000/api/v1` (Development) | `https://fitrecipes-backend.onrender.com/api/v1` (Production)

---

## 📋 Overview

This document provides the complete API specification for the Rating and Comment features implemented in the FitRecipes backend. All endpoints are **fully functional and tested**.

---

## 🎯 Implemented Endpoints

### **Rating Endpoints (4)**

1. `POST /api/v1/community/recipes/:recipeId/ratings` - Submit or update rating
2. `GET /api/v1/community/recipes/:recipeId/ratings/me` - Get user's rating
3. `GET /api/v1/community/recipes/:recipeId/ratings` - Get all ratings with stats
4. `DELETE /api/v1/community/recipes/:recipeId/ratings/me` - Delete user's rating

### **Comment Endpoints (4)**

5. `POST /api/v1/community/recipes/:recipeId/comments` - Add comment
6. `GET /api/v1/community/recipes/:recipeId/comments` - Get comments (paginated)
7. `PUT /api/v1/community/recipes/:recipeId/comments/:commentId` - Update comment
8. `DELETE /api/v1/community/recipes/:recipeId/comments/:commentId` - Delete comment

---

## 🔐 Authentication

All **POST**, **PUT**, **DELETE** operations require authentication via JWT token:

```
Authorization: Bearer {your-jwt-token}
```

**GET** endpoints for viewing ratings/comments are **public** (no authentication required).

---

## 📊 Rating Endpoints

### 1. Submit or Update Rating

#### **Endpoint**
```
POST /api/v1/community/recipes/:recipeId/ratings
```

#### **Description**
Submit a new rating or update an existing rating for a recipe. Uses **upsert** logic - if user has already rated, it updates; otherwise creates new rating.

#### **Authentication**
✅ Required (JWT token)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe to rate |

#### **Request Body**
```json
{
  "rating": 5
}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `rating` | integer | Yes | 1-5 | Star rating (1=worst, 5=best) |

#### **Validation Rules**
- `rating` must be an integer between 1 and 5 (inclusive)
- User cannot rate their own recipe (403 error)
- Recipe must have `status: 'APPROVED'` (404 if not)
- One rating per user per recipe (automatic upsert)

#### **Success Response (201 Created or 200 OK)**
```json
{
  "status": "success",
  "data": {
    "rating": {
      "id": "cm123456",
      "recipeId": "cmheoqu4u000jufys3uynv1c4",
      "userId": "cmhbkj5pb0000hiyl6uwue35i",
      "rating": 5,
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z",
      "user": {
        "id": "cmhbkj5pb0000hiyl6uwue35i",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER"
      }
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
  "message": "Validation failed",
  "errors": [
    "Rating must be between 1 and 5"
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

### 2. Get User's Rating

#### **Endpoint**
```
GET /api/v1/community/recipes/:recipeId/ratings/me
```

#### **Description**
Retrieve the current authenticated user's rating for a specific recipe.

#### **Authentication**
✅ Required (JWT token)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Success Response (200 OK) - Has Rating**
```json
{
  "status": "success",
  "data": {
    "rating": {
      "id": "cm123456",
      "recipeId": "cmheoqu4u000jufys3uynv1c4",
      "userId": "cmhbkj5pb0000hiyl6uwue35i",
      "rating": 4,
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z",
      "user": {
        "id": "cmhbkj5pb0000hiyl6uwue35i",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER"
      }
    }
  },
  "message": "Rating retrieved successfully"
}
```

#### **Success Response (200 OK) - No Rating**
```json
{
  "status": "success",
  "data": null,
  "message": "No rating found for this recipe"
}
```

---

### 3. Get All Ratings for Recipe

#### **Endpoint**
```
GET /api/v1/community/recipes/:recipeId/ratings
```

#### **Description**
Retrieve all ratings for a recipe with pagination and rating statistics.

#### **Authentication**
❌ Not required (public access)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Query Parameters**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Items per page (max: 100) |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "ratings": [
      {
        "id": "cm123456",
        "recipeId": "cmheoqu4u000jufys3uynv1c4",
        "userId": "cmhbkj5pb0000hiyl6uwue35i",
        "rating": 5,
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z",
        "user": {
          "id": "cmhbkj5pb0000hiyl6uwue35i",
          "firstName": "John",
          "lastName": "Doe",
          "role": "USER"
        }
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

**Rating Distribution Explanation:**
- Key = Star rating (1-5)
- Value = Number of users who gave that rating
- Example: `"5": 10` means 10 users gave 5-star ratings

---

### 4. Delete User's Rating

#### **Endpoint**
```
DELETE /api/v1/community/recipes/:recipeId/ratings/me
```

#### **Description**
Delete the current user's rating for a recipe. Automatically recalculates recipe statistics.

#### **Authentication**
✅ Required (JWT token)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Success Response (200 OK)**
```json
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

#### **Error Responses**

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

### 5. Add Comment to Recipe

#### **Endpoint**
```
POST /api/v1/community/recipes/:recipeId/comments
```

#### **Description**
Add a new comment to a recipe. Users can leave multiple comments on the same recipe.

#### **Authentication**
✅ Required (JWT token)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Request Body**
```json
{
  "content": "This recipe is amazing! I made it for my family and they loved it."
}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `content` | string | Yes | 1-1000 chars | Comment text (trimmed) |

#### **Validation Rules**
- `content` is required and cannot be empty after trimming
- `content` length: 1-1000 characters
- Recipe must have `status: 'APPROVED'`
- User can comment on their own recipe

#### **Success Response (201 Created)**
```json
{
  "status": "success",
  "data": {
    "comment": {
      "id": "cm789xyz",
      "recipeId": "cmheoqu4u000jufys3uynv1c4",
      "userId": "cmhbkj5pb0000hiyl6uwue35i",
      "content": "This recipe is amazing! I made it for my family and they loved it.",
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z",
      "user": {
        "id": "cmhbkj5pb0000hiyl6uwue35i",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "CHEF",
        "email": "jane@example.com"
      }
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
  "message": "Validation failed",
  "errors": [
    "Comment content is required"
  ]
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

### 6. Get Comments for Recipe

#### **Endpoint**
```
GET /api/v1/community/recipes/:recipeId/comments
```

#### **Description**
Retrieve all comments for a recipe with pagination, sorted by creation date (newest first by default).

#### **Authentication**
❌ Not required (public access)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |

#### **Query Parameters**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 10 | Items per page (max: 50) |
| `sortBy` | string | No | `createdAt` | Sort field (currently only `createdAt`) |
| `sortOrder` | string | No | `desc` | Sort order: `asc` or `desc` |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "id": "cm789xyz",
        "recipeId": "cmheoqu4u000jufys3uynv1c4",
        "userId": "cmhbkj5pb0000hiyl6uwue35i",
        "content": "Great recipe! Easy to follow and delicious.",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z",
        "user": {
          "id": "cmhbkj5pb0000hiyl6uwue35i",
          "firstName": "John",
          "lastName": "Doe",
          "role": "USER",
          "email": "john@example.com"
        }
      },
      {
        "id": "cm456abc",
        "recipeId": "cmheoqu4u000jufys3uynv1c4",
        "userId": "cmhbkj5pb0000hiyl6uwue36j",
        "content": "Thank you! Glad you enjoyed it!",
        "createdAt": "2025-10-31T11:30:00.000Z",
        "updatedAt": "2025-10-31T11:30:00.000Z",
        "user": {
          "id": "cmhbkj5pb0000hiyl6uwue36j",
          "firstName": "Maria",
          "lastName": "Rodriguez",
          "role": "CHEF",
          "email": "maria@example.com"
        }
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

### 7. Update Comment

#### **Endpoint**
```
PUT /api/v1/community/recipes/:recipeId/comments/:commentId
```

#### **Description**
Update a comment. Users can only update their own comments.

#### **Authentication**
✅ Required (JWT token)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |
| `commentId` | string (UUID) | Yes | The ID of the comment to update |

#### **Request Body**
```json
{
  "content": "Updated comment text here"
}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `content` | string | Yes | 1-1000 chars | Updated comment text (trimmed) |

#### **Success Response (200 OK)**
```json
{
  "status": "success",
  "data": {
    "comment": {
      "id": "cm789xyz",
      "recipeId": "cmheoqu4u000jufys3uynv1c4",
      "userId": "cmhbkj5pb0000hiyl6uwue35i",
      "content": "Updated comment text here",
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z",
      "user": {
        "id": "cmhbkj5pb0000hiyl6uwue35i",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER"
      }
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

### 8. Delete Comment

#### **Endpoint**
```
DELETE /api/v1/community/recipes/:recipeId/comments/:commentId
```

#### **Description**
Delete a comment. Users can delete their own comments. Admins can delete any comment.

#### **Authentication**
✅ Required (JWT token)

#### **Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string (UUID) | Yes | The ID of the recipe |
| `commentId` | string (UUID) | Yes | The ID of the comment to delete |

#### **Authorization Rules**
- Comment owner can delete their own comment
- ADMIN role can delete any comment
- Other users cannot delete comments (403 error)

#### **Success Response (200 OK)**
```json
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

## 🔄 Automatic Updates

### Rating Statistics
When a rating is submitted, updated, or deleted, the following fields on the Recipe model are **automatically recalculated**:
- `averageRating` - Average of all ratings (rounded to 1 decimal place)
- `totalRatings` - Total number of ratings

### Comment Counter
When a comment is added or deleted, the following field on the Recipe model is **automatically updated**:
- `totalComments` - Total number of comments

---

## 🎯 Business Logic

### Rating Rules
1. **Upsert Behavior**: If user has already rated, subsequent POST requests update the existing rating instead of creating a duplicate
2. **Self-Rating Prevention**: Users cannot rate their own recipes (403 error)
3. **Approved Recipes Only**: Only recipes with `status: 'APPROVED'` can be rated
4. **Automatic Stats**: Recipe statistics are recalculated on every rating change

### Comment Rules
1. **Multiple Comments**: Users can leave multiple comments on the same recipe
2. **Self-Commenting Allowed**: Users can comment on their own recipes
3. **Approved Recipes Only**: Only recipes with `status: 'APPROVED'` can receive comments
4. **Ownership**: Users can only update/delete their own comments (except admins)
5. **Admin Override**: Admins can delete any comment

---

## 📊 Database Schema

### Rating Model
```prisma
model Rating {
  id        String   @id @default(cuid())
  rating    Int      @db.SmallInt // 1-5 stars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  userId    String
  recipeId  String
  
  user      User   @relation(...)
  recipe    Recipe @relation(...)
  
  @@unique([userId, recipeId]) // One rating per user per recipe
  @@index([recipeId])
  @@index([userId])
}
```

### Comment Model
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  userId    String
  recipeId  String
  
  user      User   @relation(...)
  recipe    Recipe @relation(...)
  
  @@index([recipeId])
  @@index([userId])
  @@index([createdAt])
}
```

### Recipe Model (Related Fields)
```prisma
model Recipe {
  // ... other fields
  
  averageRating    Float           @default(0)
  totalRatings     Int             @default(0)
  totalComments    Int             @default(0)
  
  ratings          Rating[]
  comments         Comment[]
}
```

---

## ⚡ Performance Considerations

### Indexing
- `recipeId` indexed for fast recipe-specific queries
- `userId` indexed for user-specific queries
- `createdAt` indexed for sorted comment retrieval

### Pagination
- Default limits: 20 ratings, 10 comments per page
- Maximum limits: 100 ratings, 50 comments per page

### Optimization Tips
- Use pagination for large comment/rating lists
- Cache recipe statistics (averageRating, totalRatings) for faster retrieval
- Consider implementing cursor-based pagination for very large datasets (future enhancement)

---

## 🧪 Testing Examples

### Test Rating Submission
```bash
curl -X POST http://localhost:3000/api/v1/community/recipes/cmheoqu4u000jufys3uynv1c4/ratings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

### Test Comment Submission
```bash
curl -X POST http://localhost:3000/api/v1/community/recipes/cmheoqu4u000jufys3uynv1c4/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This recipe is amazing!"}'
```

### Test Get Comments (Public)
```bash
curl http://localhost:3000/api/v1/community/recipes/cmheoqu4u000jufys3uynv1c4/comments?page=1&limit=10
```

### Test Get Ratings with Stats (Public)
```bash
curl http://localhost:3000/api/v1/community/recipes/cmheoqu4u000jufys3uynv1c4/ratings?page=1&limit=20
```

---

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Submit/Update Rating | ✅ Complete | Upsert logic working |
| Get User's Rating | ✅ Complete | Returns null if no rating |
| Get All Ratings | ✅ Complete | Includes distribution stats |
| Delete Rating | ✅ Complete | Auto-recalculates stats |
| Add Comment | ✅ Complete | Auto-updates totalComments |
| Get Comments | ✅ Complete | Paginated, sorted newest first |
| Update Comment | ✅ Complete | Ownership validation |
| Delete Comment | ✅ Complete | Owner + Admin authorization |
| Rating Statistics | ✅ Complete | Auto-calculated on changes |
| Comment Counter | ✅ Complete | Auto-updated in transactions |

---

## 📞 Support

For questions or issues, contact the backend development team.

**Backend Developer**: NinePTH  
**Date**: October 31, 2025  
**Version**: 1.0
