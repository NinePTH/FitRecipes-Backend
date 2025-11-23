# Admin & Chef Dashboard API - Frontend Integration Guide

This guide covers the Admin User Management and Analytics APIs implemented for the FitRecipes platform. These endpoints power the admin dashboard for platform management and chef dashboard for recipe performance tracking.

## 📋 Table of Contents

1. [Admin User Management](#admin-user-management)
2. [Admin Content Moderation](#admin-content-moderation)
3. [Admin Analytics](#admin-analytics)
4. [Chef Analytics](#chef-analytics)
5. [Recipe View Tracking](#recipe-view-tracking)
6. [Audit Logs](#audit-logs)
7. [TypeScript Types](#typescript-types)
8. [React Implementation Examples](#react-implementation-examples)

---

## 🔐 Authentication

All endpoints require authentication via Bearer token:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Role Requirements:
- **Admin-Only Endpoints**: Require `role: "ADMIN"`
- **Chef Endpoints**: Require `role: "CHEF"` or `role: "ADMIN"`

---

## 1. Admin User Management

### 1.1 Get All Users (with Pagination & Filters)

**Endpoint**: `GET /api/v1/admin/users`

**Required Role**: ADMIN

**Query Parameters**:
```typescript
{
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 10, max: 100)
  search?: string;      // Search by name or email
  role?: 'USER' | 'CHEF' | 'ADMIN';  // Filter by role
  isBanned?: boolean;   // Filter by ban status
  sortBy?: 'createdAt' | 'lastLoginAt' | 'firstName' | 'email';
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    users: [
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: 'USER' | 'CHEF' | 'ADMIN';
        isBanned: boolean;
        bannedAt: string | null;
        bannedBy: string | null;
        banReason: string | null;
        lastLoginAt: string | null;
        createdAt: string;
        _count: {
          recipes: number;
          comments: number;
          ratings: number;
        };
      }
    ],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }
  }
}
```

**Example Request**:
```typescript
const response = await fetch(
  `/api/v1/admin/users?page=1&limit=20&role=CHEF&sortBy=createdAt`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

---

### 1.2 Get User Details

**Endpoint**: `GET /api/v1/admin/users/:userId`

**Required Role**: ADMIN

**Response**:
```typescript
{
  status: 'success',
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'USER' | 'CHEF' | 'ADMIN';
      isBanned: boolean;
      bannedAt: string | null;
      bannedBy: string | null;
      banReason: string | null;
      lastLoginAt: string | null;
      emailVerified: boolean;
      createdAt: string;
      updatedAt: string;
    };
    statistics: {
      totalRecipes: number;
      approvedRecipes: number;
      pendingRecipes: number;
      rejectedRecipes: number;
      totalComments: number;
      totalRatings: number;
      averageRating: number;
    };
    recentActivity: [
      {
        type: 'recipe' | 'comment' | 'rating';
        recipeId?: string;
        recipeName?: string;
        commentId?: string;
        commentContent?: string;
        rating?: number;
        createdAt: string;
      }
    ];
  }
}
```

---

### 1.3 Ban User

**Endpoint**: `PUT /api/v1/admin/users/:userId/ban`

**Required Role**: ADMIN

**Request Body**:
```typescript
{
  reason: string;  // Min 10 characters, required
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    id: string;
    isBanned: true;
    bannedAt: string;
    bannedBy: string;  // Admin ID
    banReason: string;
  },
  message: 'User banned successfully'
}
```

**Error Responses**:
- `400` - Reason too short (< 10 chars)
- `400` - User already banned
- `404` - User not found

---

### 1.4 Unban User

**Endpoint**: `PUT /api/v1/admin/users/:userId/unban`

**Required Role**: ADMIN

**Response**:
```typescript
{
  status: 'success',
  data: {
    id: string;
    isBanned: false;
    bannedAt: null;
    bannedBy: null;
    banReason: null;
  },
  message: 'User unbanned successfully'
}
```

**Error Responses**:
- `400` - User is not banned
- `404` - User not found

---

### 1.5 Change User Role

**Endpoint**: `PUT /api/v1/admin/users/:userId/role`

**Required Role**: ADMIN

**Request Body**:
```typescript
{
  newRole: 'USER' | 'CHEF' | 'ADMIN';
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    id: string;
    role: 'USER' | 'CHEF' | 'ADMIN';
  },
  message: 'User role updated successfully'
}
```

**Error Responses**:
- `400` - Cannot change own role
- `400` - Cannot demote the last admin
- `404` - User not found

---

## 2. Admin Content Moderation

### 2.1 Admin Delete Recipe (Override)

**Endpoint**: `DELETE /api/v1/admin/recipes/:recipeId`

**Required Role**: ADMIN

**Purpose**: Allow admins to delete any recipe regardless of ownership (override normal permissions)

**URL Parameters**:
```typescript
{
  recipeId: string;  // The ID of the recipe to delete
}
```

**Request Body**:
```typescript
{
  reason: string;  // Deletion reason (minimum 10 characters)
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    recipeId: string;
    recipeName: string;
    message: string;
  }
}
```

**Example Request**:
```typescript
const deleteRecipe = async (recipeId: string, reason: string) => {
  const response = await fetch(`/api/v1/admin/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete recipe');
  }
  
  return response.json();
};

// Usage
await deleteRecipe('recipe123', 'Contains inappropriate content that violates community guidelines');
```

**Features**:
- ✅ Cascade deletes all comments, ratings, and saved recipes
- ✅ Creates audit log with recipe details
- ✅ Tracks admin ID and IP address
- ✅ Returns 404 if recipe not found

**Error Responses**:
```typescript
// Reason too short
{
  status: 'error',
  message: 'Deletion reason must be at least 10 characters long'
}

// Recipe not found
{
  status: 'error',
  message: 'Recipe not found'
}

// Unauthorized
{
  status: 'error',
  message: 'Unauthorized'
}
```

---

### 2.2 Bulk Delete Recipes

**Endpoint**: `POST /api/v1/admin/recipes/bulk-delete`

**Required Role**: ADMIN

**Purpose**: Delete multiple recipes in a single operation with individual error handling

**Request Body**:
```typescript
{
  recipeIds: string[];  // Array of recipe IDs to delete
  reason: string;       // Deletion reason (minimum 10 characters)
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    deletedCount: number;
    failedCount: number;
    results: Array<{
      recipeId: string;
      success: boolean;
      error?: string;  // Only present if success = false
    }>;
  }
}
```

**Example Request**:
```typescript
const bulkDeleteRecipes = async (recipeIds: string[], reason: string) => {
  const response = await fetch('/api/v1/admin/recipes/bulk-delete', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipeIds, reason })
  });
  
  return response.json();
};

// Usage
const result = await bulkDeleteRecipes(
  ['recipe123', 'recipe456', 'recipe789'],
  'Bulk cleanup of spam recipes from automated bot'
);

console.log(`Deleted: ${result.data.deletedCount}`);
console.log(`Failed: ${result.data.failedCount}`);
console.log('Details:', result.data.results);
```

**Features**:
- ✅ Processes each recipe independently
- ✅ Continues on individual failures (doesn't stop at first error)
- ✅ Creates audit log for each successful deletion
- ✅ Returns detailed results for each recipe
- ✅ Tracks which recipes succeeded and which failed

---

### 2.3 Get All Comments (with Filtering)

**Endpoint**: `GET /api/v1/admin/comments`

**Required Role**: ADMIN

**Purpose**: List all comments with comprehensive filtering and pagination

**Query Parameters**:
```typescript
{
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 20, max: 100)
  recipeId?: string;      // Filter by recipe ID
  userId?: string;        // Filter by user ID
  search?: string;        // Search in comment content (case-insensitive)
  sortBy?: 'createdAt' | 'updatedAt';  // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc';          // Default: 'desc'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    comments: Array<{
      id: string;
      content: string;
      recipeId: string;
      recipeName: string;
      userId: string;
      userName: string;
      userEmail: string;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
}
```

**Example Request**:
```typescript
const getComments = async (filters: {
  page?: number;
  limit?: number;
  recipeId?: string;
  userId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.recipeId) params.append('recipeId', filters.recipeId);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const response = await fetch(`/api/v1/admin/comments?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};

// Usage examples:

// Get all comments (paginated)
const allComments = await getComments({ page: 1, limit: 50 });

// Get comments for a specific recipe
const recipeComments = await getComments({ recipeId: 'recipe123' });

// Get comments by a specific user
const userComments = await getComments({ userId: 'user456' });

// Search comments containing specific text
const searchResults = await getComments({ 
  search: 'inappropriate',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

**Features**:
- ✅ Paginated results (default 20 per page, max 100)
- ✅ Filter by recipe ID
- ✅ Filter by user ID
- ✅ Search within comment content (case-insensitive)
- ✅ Sort by creation or update date
- ✅ Ascending or descending order
- ✅ Includes user and recipe information
- ✅ Returns total count and pagination metadata

---

### 2.4 Bulk Delete Comments

**Endpoint**: `POST /api/v1/admin/comments/bulk-delete`

**Required Role**: ADMIN

**Purpose**: Delete multiple comments in a single operation with individual error handling

**Request Body**:
```typescript
{
  commentIds: string[];  // Array of comment IDs to delete
  reason: string;        // Deletion reason (minimum 10 characters)
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    deletedCount: number;
    failedCount: number;
    results: Array<{
      commentId: string;
      success: boolean;
      error?: string;  // Only present if success = false
    }>;
  }
}
```

**Example Request**:
```typescript
const bulkDeleteComments = async (commentIds: string[], reason: string) => {
  const response = await fetch('/api/v1/admin/comments/bulk-delete', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ commentIds, reason })
  });
  
  return response.json();
};

// Usage
const result = await bulkDeleteComments(
  ['comment123', 'comment456', 'comment789'],
  'Removal of spam comments violating community standards'
);

console.log(`Deleted: ${result.data.deletedCount}`);
console.log(`Failed: ${result.data.failedCount}`);

// Check individual results
result.data.results.forEach(r => {
  if (!r.success) {
    console.error(`Failed to delete ${r.commentId}:`, r.error);
  }
});
```

**Features**:
- ✅ Processes each comment independently
- ✅ Continues on individual failures
- ✅ Creates audit log for each successful deletion
- ✅ Logs comment content (first 100 characters)
- ✅ Logs user and recipe information
- ✅ Returns detailed results for each comment

---

## 3. Admin Analytics

### 2.1 Admin Dashboard Overview

**Endpoint**: `GET /api/v1/admin/analytics/overview`

**Required Role**: ADMIN

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | 'all';  // Default: '30d'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    users: {
      total: number;
      active: number;        // Users who logged in during time period
      banned: number;
      newInPeriod: number;   // New registrations during time period
      byRole: {
        user: number;
        chef: number;
        admin: number;
      };
    };
    recipes: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      newInPeriod: number;   // New submissions during time period
    };
    engagement: {
      totalComments: number;
      totalRatings: number;
      averageRating: number;
      commentsInPeriod: number;
      ratingsInPeriod: number;
    };
    topChefs: [
      {
        userId: string;
        firstName: string;
        lastName: string;
        recipeCount: number;
        averageRating: number;
        totalViews: number;
      }
    ];
    recentActivity: [
      {
        type: 'user_registered' | 'recipe_submitted' | 'recipe_approved' | 'recipe_rejected';
        timestamp: string;
        details: {
          userId?: string;
          userName?: string;
          recipeId?: string;
          recipeName?: string;
        };
      }
    ];
  }
}
```

**Example Request**:
```typescript
const response = await fetch(
  `/api/v1/admin/analytics/overview?timeRange=30d`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

---

### 2.2 Recipe Submission Trends

**Endpoint**: `GET /api/v1/admin/analytics/recipe-trends`

**Required Role**: ADMIN

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | '1y';  // Default: '30d'
  groupBy?: 'day' | 'week' | 'month';       // Default: 'day'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    trends: [
      {
        date: string;      // ISO date or week/month label
        submitted: number;
        approved: number;
        rejected: number;
      }
    ];
    summary: {
      totalSubmitted: number;
      totalApproved: number;
      totalRejected: number;
      approvalRate: number;  // Percentage (0-100)
    };
  }
}
```

---

### 2.3 User Growth Trends

**Endpoint**: `GET /api/v1/admin/analytics/user-growth`

**Required Role**: ADMIN

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | '1y';  // Default: '30d'
  groupBy?: 'day' | 'week' | 'month';       // Default: 'day'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    trends: [
      {
        date: string;
        newUsers: number;
        newChefs: number;
        newAdmins: number;
        total: number;
      }
    ];
    summary: {
      totalNewUsers: number;
      growthRate: number;  // Percentage change from previous period
    };
  }
}
```

---

## 4. Chef Analytics

### 4.1 Chef Dashboard Overview

**Endpoint**: `GET /api/v1/chef/analytics/overview`

**Required Role**: CHEF or ADMIN

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | 'all';  // Default: '30d'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    myRecipes: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      newInPeriod: number;
    };
    performance: {
      totalViews: number;
      viewsInPeriod: number;
      totalRatings: number;
      averageRating: number;
      totalComments: number;
      commentsInPeriod: number;
    };
    topRecipes: [
      {
        id: string;
        name: string;
        views: number;
        rating: number;
        ratingCount: number;
        commentCount: number;
      }
    ];
    rankings: {
      viewRank: number;       // Chef's rank by total views (1 = top)
      ratingRank: number;     // Chef's rank by average rating (1 = top)
      totalChefs: number;     // Total number of chefs for context
    };
    recentActivity: [
      {
        type: 'recipe_viewed' | 'recipe_rated' | 'recipe_commented';
        timestamp: string;
        details: {
          recipeId: string;
          recipeName: string;
          userName?: string;
          rating?: number;
          commentSnippet?: string;
        };
      }
    ];
  }
}
```

---

### 3.2 Recipe Analytics (Detailed Per-Recipe)

**Endpoint**: `GET /api/v1/chef/recipes/:recipeId/analytics`

**Required Role**: CHEF or ADMIN

**Path Parameters**:
- `recipeId`: Recipe ID to get analytics for

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | 'all';  // Default: '30d'
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    recipe: {
      id: string;
      name: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
      approvedAt: string | null;
    };
    views: {
      total: number;
      viewsInPeriod: number;
      viewTrends: [
        {
          date: string;
          views: number;
        }
      ];
    };
    ratings: {
      total: number;
      average: number;
      distribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
      ratingsInPeriod: number;
    };
    comments: {
      total: number;
      commentsInPeriod: number;
      recentComments: [
        {
          id: string;
          content: string;
          userName: string;
          createdAt: string;
        }
      ];
    };
    engagement: {
      viewToRatingRate: number;   // Percentage (0-100)
      viewToCommentRate: number;  // Percentage (0-100)
    };
  }
}
```

**Error Responses**:
- `404` - Recipe not found or you don't own it

---

## 5. Recipe View Tracking

### 5.1 Track Recipe View

**Endpoint**: `POST /api/v1/recipes/:recipeId/view`

**Authentication**: Optional (works for both authenticated and anonymous users)

**Path Parameters**:
- `recipeId`: Recipe ID to track view for

**Idempotency**: Only 1 view per user/IP per day is recorded

**Response**:
```typescript
{
  status: 'success',
  data: {
    recorded: boolean;  // true if new view, false if already viewed today
    message: string;
  }
}
```

**Example Response (New View)**:
```typescript
{
  status: 'success',
  data: {
    recorded: true,
    message: 'Recipe view recorded successfully'
  }
}
```

**Example Response (Already Viewed)**:
```typescript
{
  status: 'success',
  data: {
    recorded: false,
    message: 'Recipe view already recorded for today'
  }
}
```

**Usage in Frontend**:
```typescript
// Track view when recipe page loads (fire and forget)
useEffect(() => {
  fetch(`/api/v1/recipes/${recipeId}/view`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }).catch(console.error); // Silent fail if tracking fails
}, [recipeId, token]);
```

---

## 6. Audit Logs

### 6.1 Get Audit Logs

**Endpoint**: `GET /api/v1/admin/audit-logs`

**Required Role**: ADMIN

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  action?: 'ban_user' | 'unban_user' | 'change_role' | 'delete_recipe' | 'delete_comment';
  adminId?: string;     // Filter by admin who performed action
  targetType?: 'user' | 'recipe' | 'comment';
  targetId?: string;    // Filter by target (e.g., specific user ID)
  startDate?: string;   // ISO date
  endDate?: string;     // ISO date
  sortOrder?: 'asc' | 'desc';
}
```

**Response**:
```typescript
{
  status: 'success',
  data: {
    logs: [
      {
        id: string;
        action: string;
        adminId: string;
        targetType: string;
        targetId: string;
        reason: string | null;
        details: object | null;  // JSON with additional context
        ipAddress: string | null;
        timestamp: string;
        admin: {
          firstName: string;
          lastName: string;
          email: string;
        };
      }
    ],
    pagination: { /* same as user list */ }
  }
}
```

---

## 7. TypeScript Types

```typescript
// User Types
export type UserRole = 'USER' | 'CHEF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isBanned: boolean;
  bannedAt: string | null;
  bannedBy: string | null;
  banReason: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface AdminOverview {
  users: {
    total: number;
    active: number;
    banned: number;
    newInPeriod: number;
    byRole: {
      user: number;
      chef: number;
      admin: number;
    };
  };
  recipes: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    newInPeriod: number;
  };
  engagement: {
    totalComments: number;
    totalRatings: number;
    averageRating: number;
    commentsInPeriod: number;
    ratingsInPeriod: number;
  };
  topChefs: TopChef[];
  recentActivity: Activity[];
}

export interface ChefOverview {
  myRecipes: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    newInPeriod: number;
  };
  performance: {
    totalViews: number;
    viewsInPeriod: number;
    totalRatings: number;
    averageRating: number;
    totalComments: number;
    commentsInPeriod: number;
  };
  topRecipes: TopRecipe[];
  rankings: {
    viewRank: number;
    ratingRank: number;
    totalChefs: number;
  };
  recentActivity: Activity[];
}

export interface RecipeAnalytics {
  recipe: {
    id: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    approvedAt: string | null;
  };
  views: {
    total: number;
    viewsInPeriod: number;
    viewTrends: { date: string; views: number }[];
  };
  ratings: {
    total: number;
    average: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
    ratingsInPeriod: number;
  };
  comments: {
    total: number;
    commentsInPeriod: number;
    recentComments: Comment[];
  };
  engagement: {
    viewToRatingRate: number;
    viewToCommentRate: number;
  };
}

// Pagination Type
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Content Moderation Types
export interface DeleteRecipeRequest {
  reason: string;  // Minimum 10 characters
}

export interface DeleteRecipeResponse {
  recipeId: string;
  recipeName: string;
  message: string;
}

export interface BulkDeleteRecipesRequest {
  recipeIds: string[];
  reason: string;  // Minimum 10 characters
}

export interface BulkDeleteRecipesResponse {
  deletedCount: number;
  failedCount: number;
  results: Array<{
    recipeId: string;
    success: boolean;
    error?: string;
  }>;
}

export interface Comment {
  id: string;
  content: string;
  recipeId: string;
  recipeName: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsListResponse {
  comments: Comment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BulkDeleteCommentsRequest {
  commentIds: string[];
  reason: string;  // Minimum 10 characters
}

export interface BulkDeleteCommentsResponse {
  deletedCount: number;
  failedCount: number;
  results: Array<{
    commentId: string;
    success: boolean;
    error?: string;
  }>;
}
```

---

## 8. React Implementation Examples

### 8.1 Admin User List with Search & Filters

```typescript
import { useState, useEffect } from 'react';

interface UserListProps {
  token: string;
}

export function AdminUserList({ token }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '' as '' | UserRole,
    isBanned: undefined as boolean | undefined,
    page: 1,
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  async function fetchUsers() {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);
    if (filters.isBanned !== undefined) params.set('isBanned', String(filters.isBanned));
    params.set('page', String(filters.page));
    params.set('limit', '20');

    const response = await fetch(`/api/v1/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.status === 'success') {
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    }
  }

  async function banUser(userId: string, reason: string) {
    const response = await fetch(`/api/v1/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (response.ok) {
      fetchUsers(); // Refresh list
    }
  }

  return (
    <div>
      {/* Search & Filters */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
      />
      
      <select
        value={filters.role}
        onChange={(e) => setFilters({ ...filters, role: e.target.value as UserRole, page: 1 })}
      >
        <option value="">All Roles</option>
        <option value="USER">User</option>
        <option value="CHEF">Chef</option>
        <option value="ADMIN">Admin</option>
      </select>

      {/* User Table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isBanned ? 'Banned' : 'Active'}</td>
              <td>
                <button onClick={() => {
                  const reason = prompt('Ban reason (min 10 chars):');
                  if (reason && reason.length >= 10) banUser(user.id, reason);
                }}>
                  Ban
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div>
          <button 
            disabled={!pagination.hasPrev}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button 
            disabled={!pagination.hasNext}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
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

### 7.2 Admin Dashboard with Overview Statistics

```typescript
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2'; // Example: Chart.js integration

interface AdminDashboardProps {
  token: string;
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  async function fetchData() {
    // Fetch overview
    const overviewRes = await fetch(
      `/api/v1/admin/analytics/overview?timeRange=${timeRange}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const overviewData = await overviewRes.json();
    if (overviewData.status === 'success') {
      setOverview(overviewData.data);
    }

    // Fetch recipe trends
    const trendsRes = await fetch(
      `/api/v1/admin/analytics/recipe-trends?timeRange=${timeRange}&groupBy=day`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const trendsData = await trendsRes.json();
    if (trendsData.status === 'success') {
      setTrends(trendsData.data);
    }
  }

  if (!overview) return <div>Loading...</div>;

  return (
    <div>
      {/* Time Range Selector */}
      <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
      </select>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{overview.users.total}</p>
          <p className="stat-change">+{overview.users.newInPeriod} this period</p>
        </div>

        <div className="stat-card">
          <h3>Total Recipes</h3>
          <p className="stat-value">{overview.recipes.total}</p>
          <p className="stat-change">+{overview.recipes.newInPeriod} this period</p>
        </div>

        <div className="stat-card">
          <h3>Pending Approvals</h3>
          <p className="stat-value">{overview.recipes.pending}</p>
        </div>

        <div className="stat-card">
          <h3>Average Rating</h3>
          <p className="stat-value">{overview.engagement.averageRating.toFixed(1)}</p>
        </div>
      </div>

      {/* Top Chefs */}
      <div className="top-chefs">
        <h2>Top Chefs</h2>
        <table>
          <thead>
            <tr>
              <th>Chef</th>
              <th>Recipes</th>
              <th>Avg Rating</th>
              <th>Total Views</th>
            </tr>
          </thead>
          <tbody>
            {overview.topChefs.map((chef) => (
              <tr key={chef.userId}>
                <td>{chef.firstName} {chef.lastName}</td>
                <td>{chef.recipeCount}</td>
                <td>{chef.averageRating.toFixed(1)}</td>
                <td>{chef.totalViews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recipe Trends Chart */}
      {trends && (
        <div className="trends-chart">
          <h2>Recipe Submission Trends</h2>
          <Line
            data={{
              labels: trends.trends.map((t: any) => t.date),
              datasets: [
                {
                  label: 'Submitted',
                  data: trends.trends.map((t: any) => t.submitted),
                  borderColor: 'blue',
                },
                {
                  label: 'Approved',
                  data: trends.trends.map((t: any) => t.approved),
                  borderColor: 'green',
                },
                {
                  label: 'Rejected',
                  data: trends.trends.map((t: any) => t.rejected),
                  borderColor: 'red',
                },
              ],
            }}
          />
          <div className="trends-summary">
            <p>Approval Rate: {trends.summary.approvalRate.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 7.3 Chef Dashboard with Performance Metrics

```typescript
import { useState, useEffect } from 'react';

interface ChefDashboardProps {
  token: string;
}

export function ChefDashboard({ token }: ChefDashboardProps) {
  const [overview, setOverview] = useState<ChefOverview | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchOverview();
  }, [timeRange]);

  async function fetchOverview() {
    const response = await fetch(
      `/api/v1/chef/analytics/overview?timeRange=${timeRange}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();
    if (data.status === 'success') {
      setOverview(data.data);
    }
  }

  if (!overview) return <div>Loading...</div>;

  return (
    <div>
      {/* Time Range Selector */}
      <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
      </select>

      {/* Recipe Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>My Recipes</h3>
          <p className="stat-value">{overview.myRecipes.total}</p>
          <p className="stat-detail">
            {overview.myRecipes.approved} Approved, {overview.myRecipes.pending} Pending
          </p>
        </div>

        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{overview.performance.totalViews}</p>
          <p className="stat-change">+{overview.performance.viewsInPeriod} this period</p>
        </div>

        <div className="stat-card">
          <h3>Average Rating</h3>
          <p className="stat-value">{overview.performance.averageRating.toFixed(1)}</p>
          <p className="stat-detail">from {overview.performance.totalRatings} ratings</p>
        </div>

        <div className="stat-card">
          <h3>Total Comments</h3>
          <p className="stat-value">{overview.performance.totalComments}</p>
          <p className="stat-change">+{overview.performance.commentsInPeriod} this period</p>
        </div>
      </div>

      {/* Rankings */}
      <div className="rankings">
        <h2>Your Rankings</h2>
        <div className="ranking-cards">
          <div className="ranking-card">
            <h4>View Rank</h4>
            <p>#{overview.rankings.viewRank} of {overview.rankings.totalChefs} chefs</p>
          </div>
          <div className="ranking-card">
            <h4>Rating Rank</h4>
            <p>#{overview.rankings.ratingRank} of {overview.rankings.totalChefs} chefs</p>
          </div>
        </div>
      </div>

      {/* Top Recipes */}
      <div className="top-recipes">
        <h2>Your Top Recipes</h2>
        <div className="recipe-list">
          {overview.topRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              <h3>{recipe.name}</h3>
              <div className="recipe-stats">
                <span>👀 {recipe.views} views</span>
                <span>⭐ {recipe.rating.toFixed(1)} ({recipe.ratingCount} ratings)</span>
                <span>💬 {recipe.commentCount} comments</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 7.4 Recipe Analytics Page

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface RecipeAnalyticsProps {
  token: string;
}

export function RecipeAnalytics({ token }: RecipeAnalyticsProps) {
  const { recipeId } = useParams<{ recipeId: string }>();
  const [analytics, setAnalytics] = useState<RecipeAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [recipeId, timeRange]);

  async function fetchAnalytics() {
    const response = await fetch(
      `/api/v1/chef/recipes/${recipeId}/analytics?timeRange=${timeRange}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();
    if (data.status === 'success') {
      setAnalytics(data.data);
    }
  }

  if (!analytics) return <div>Loading...</div>;

  return (
    <div>
      {/* Recipe Info */}
      <div className="recipe-header">
        <h1>{analytics.recipe.name}</h1>
        <span className={`status-badge ${analytics.recipe.status.toLowerCase()}`}>
          {analytics.recipe.status}
        </span>
      </div>

      {/* Time Range Selector */}
      <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
      </select>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{analytics.views.total}</p>
          <p className="stat-change">+{analytics.views.viewsInPeriod} this period</p>
        </div>

        <div className="stat-card">
          <h3>Average Rating</h3>
          <p className="stat-value">{analytics.ratings.average.toFixed(1)}</p>
          <p className="stat-detail">{analytics.ratings.total} total ratings</p>
        </div>

        <div className="stat-card">
          <h3>Comments</h3>
          <p className="stat-value">{analytics.comments.total}</p>
          <p className="stat-change">+{analytics.comments.commentsInPeriod} this period</p>
        </div>

        <div className="stat-card">
          <h3>Engagement Rate</h3>
          <p className="stat-value">{analytics.engagement.viewToRatingRate.toFixed(1)}%</p>
          <p className="stat-detail">views to ratings</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="rating-distribution">
        <h2>Rating Distribution</h2>
        {[5, 4, 3, 2, 1].map((stars) => (
          <div key={stars} className="rating-bar">
            <span>{stars} ⭐</span>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${(analytics.ratings.distribution[stars] / analytics.ratings.total) * 100}%`,
                }}
              />
            </div>
            <span>{analytics.ratings.distribution[stars]}</span>
          </div>
        ))}
      </div>

      {/* Recent Comments */}
      <div className="recent-comments">
        <h2>Recent Comments</h2>
        {analytics.comments.recentComments.map((comment) => (
          <div key={comment.id} className="comment-card">
            <p>{comment.content}</p>
            <small>
              {comment.userName} • {new Date(comment.createdAt).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 Best Practices

### 1. Error Handling
Always check the response status and handle errors gracefully:
```typescript
const response = await fetch(url, options);
const data = await response.json();

if (data.status === 'error') {
  console.error(data.message);
  // Show error toast/notification
  return;
}
```

### 2. Loading States
Show loading indicators while fetching data:
```typescript
const [loading, setLoading] = useState(false);

async function fetchData() {
  setLoading(true);
  try {
    // ... fetch logic
  } finally {
    setLoading(false);
  }
}
```

### 3. Debounce Search Inputs
Use debouncing for search inputs to reduce API calls:
```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 500);

useEffect(() => {
  fetchUsers();
}, [debouncedSearch]);
```

### 4. Cache Analytics Data
Consider caching analytics data to reduce server load:
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['chef-overview', timeRange],
  queryFn: () => fetchChefOverview(timeRange),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

### 5. Silent View Tracking
Track recipe views silently without blocking UI:
```typescript
useEffect(() => {
  // Fire and forget - don't block UI for tracking
  trackRecipeView(recipeId).catch((err) => {
    // Log error silently, don't show to user
    console.debug('View tracking failed:', err);
  });
}, [recipeId]);
```

---

### 8.2 Content Moderation - Recipe Management

```typescript
import { useState, useEffect } from 'react';

interface Recipe {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function RecipeModerationPanel() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Delete single recipe
  const deleteRecipe = async (recipeId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/admin/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to delete recipe');

      const data = await response.json();
      alert(`Recipe "${data.data.recipeName}" deleted successfully`);
      
      // Refresh list
      fetchRecipes();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete recipe');
    }
  };

  // Bulk delete recipes
  const bulkDeleteRecipes = async () => {
    if (selectedRecipes.length === 0) {
      alert('No recipes selected');
      return;
    }

    if (deleteReason.trim().length < 10) {
      alert('Deletion reason must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/recipes/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeIds: selectedRecipes,
          reason: deleteReason,
        }),
      });

      const data = await response.json();
      
      alert(
        `Bulk delete complete:\n` +
        `Deleted: ${data.data.deletedCount}\n` +
        `Failed: ${data.data.failedCount}`
      );

      // Show failed items
      const failed = data.data.results.filter((r: any) => !r.success);
      if (failed.length > 0) {
        console.log('Failed deletions:', failed);
      }

      // Clear selections and refresh
      setSelectedRecipes([]);
      setDeleteReason('');
      setShowDeleteModal(false);
      fetchRecipes();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to bulk delete recipes');
    } finally {
      setLoading(false);
    }
  };

  // Toggle recipe selection
  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  return (
    <div>
      <h2>Recipe Moderation</h2>

      {/* Bulk Actions */}
      {selectedRecipes.length > 0 && (
        <div style={{ background: '#fff3cd', padding: '10px', marginBottom: '10px' }}>
          <p>{selectedRecipes.length} recipe(s) selected</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ background: '#dc3545', color: 'white' }}
          >
            Bulk Delete Selected
          </button>
          <button onClick={() => setSelectedRecipes([])}>Clear Selection</button>
        </div>
      )}

      {/* Recipe List */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedRecipes.length === recipes.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRecipes(recipes.map(r => r.id));
                  } else {
                    setSelectedRecipes([]);
                  }
                }}
              />
            </th>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => (
            <tr key={recipe.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedRecipes.includes(recipe.id)}
                  onChange={() => toggleRecipeSelection(recipe.id)}
                />
              </td>
              <td>{recipe.title}</td>
              <td>{recipe.authorName}</td>
              <td>{recipe.status}</td>
              <td>{new Date(recipe.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => {
                    const reason = prompt('Delete reason (min 10 chars):');
                    if (reason && reason.length >= 10) {
                      deleteRecipe(recipe.id, reason);
                    } else {
                      alert('Reason must be at least 10 characters');
                    }
                  }}
                  style={{ background: '#dc3545', color: 'white' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bulk Delete Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Bulk Delete {selectedRecipes.length} Recipe(s)</h3>
            <p>This action cannot be undone. Please provide a reason:</p>
            
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter deletion reason (minimum 10 characters)"
              rows={4}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            
            <p style={{ fontSize: '12px', color: '#666' }}>
              {deleteReason.length}/10 characters minimum
            </p>

            <div>
              <button
                onClick={bulkDeleteRecipes}
                disabled={loading || deleteReason.trim().length < 10}
                style={{ 
                  background: deleteReason.trim().length >= 10 ? '#dc3545' : '#ccc',
                  color: 'white',
                  marginRight: '10px'
                }}
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 8.3 Content Moderation - Comment Management

```typescript
import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  content: string;
  recipeId: string;
  recipeName: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsFilters {
  search: string;
  recipeId: string;
  userId: string;
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export default function CommentModerationPanel() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [filters, setFilters] = useState<CommentsFilters>({
    search: '',
    recipeId: '',
    userId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Fetch comments with filters
  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.recipeId) params.append('recipeId', filters.recipeId);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await fetch(`/api/v1/admin/comments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      setComments(data.data.comments);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Fetch comments error:', error);
      alert('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete comments
  const bulkDeleteComments = async () => {
    if (selectedComments.length === 0) {
      alert('No comments selected');
      return;
    }

    if (deleteReason.trim().length < 10) {
      alert('Deletion reason must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/comments/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentIds: selectedComments,
          reason: deleteReason,
        }),
      });

      const data = await response.json();
      
      alert(
        `Bulk delete complete:\n` +
        `Deleted: ${data.data.deletedCount}\n` +
        `Failed: ${data.data.failedCount}`
      );

      // Clear selections and refresh
      setSelectedComments([]);
      setDeleteReason('');
      setShowDeleteModal(false);
      fetchComments();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to bulk delete comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [pagination.page, filters]);

  return (
    <div>
      <h2>Comment Moderation</h2>

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search comments..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ marginRight: '10px' }}
        />
        
        <input
          type="text"
          placeholder="Filter by Recipe ID"
          value={filters.recipeId}
          onChange={(e) => setFilters({ ...filters, recipeId: e.target.value })}
          style={{ marginRight: '10px' }}
        />
        
        <input
          type="text"
          placeholder="Filter by User ID"
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          style={{ marginRight: '10px' }}
        />

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
          style={{ marginRight: '10px' }}
        >
          <option value="createdAt">Created Date</option>
          <option value="updatedAt">Updated Date</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <div style={{ background: '#fff3cd', padding: '10px', marginBottom: '10px' }}>
          <p>{selectedComments.length} comment(s) selected</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ background: '#dc3545', color: 'white' }}
          >
            Bulk Delete Selected
          </button>
          <button onClick={() => setSelectedComments([])}>Clear Selection</button>
        </div>
      )}

      {/* Comments List */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedComments.length === comments.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedComments(comments.map(c => c.id));
                  } else {
                    setSelectedComments([]);
                  }
                }}
              />
            </th>
            <th>Content</th>
            <th>Recipe</th>
            <th>User</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <tr key={comment.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedComments.includes(comment.id)}
                  onChange={() => {
                    setSelectedComments(prev =>
                      prev.includes(comment.id)
                        ? prev.filter(id => id !== comment.id)
                        : [...prev, comment.id]
                    );
                  }}
                />
              </td>
              <td style={{ maxWidth: '300px' }}>
                {comment.content.substring(0, 100)}
                {comment.content.length > 100 && '...'}
              </td>
              <td>{comment.recipeName}</td>
              <td>
                {comment.userName}<br />
                <small>{comment.userEmail}</small>
              </td>
              <td>{new Date(comment.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => {
                    const reason = prompt('Delete reason (min 10 chars):');
                    if (reason && reason.length >= 10) {
                      bulkDeleteComments(); // Can reuse for single delete
                    } else {
                      alert('Reason must be at least 10 characters');
                    }
                  }}
                  style={{ background: '#dc3545', color: 'white' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          disabled={pagination.page === pagination.totalPages}
        >
          Next
        </button>
      </div>

      {/* Bulk Delete Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Bulk Delete {selectedComments.length} Comment(s)</h3>
            <p>This action cannot be undone. Please provide a reason:</p>
            
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter deletion reason (minimum 10 characters)"
              rows={4}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            
            <p style={{ fontSize: '12px', color: '#666' }}>
              {deleteReason.length}/10 characters minimum
            </p>

            <div>
              <button
                onClick={bulkDeleteComments}
                disabled={loading || deleteReason.trim().length < 10}
                style={{ 
                  background: deleteReason.trim().length >= 10 ? '#dc3545' : '#ccc',
                  color: 'white',
                  marginRight: '10px'
                }}
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Notes

1. **Pagination**: Default limit is 10, maximum is 100 items per page
2. **Time Ranges**: Use standard formats: `7d`, `30d`, `90d`, `1y`, `all`
3. **Date Grouping**: For trends, use `day`, `week`, or `month` for appropriate time ranges
4. **Ban Reasons**: Must be at least 10 characters long
5. **Deletion Reasons**: Must be at least 10 characters long (recipes and comments)
6. **Bulk Operations**: Process items independently - some may succeed while others fail
7. **View Tracking**: Idempotent by design - only 1 view per user/IP per day
8. **Audit Logs**: All admin actions are automatically logged with IP address
9. **Role Changes**: Cannot change own role, cannot demote last admin
10. **Authorization**: All analytics endpoints verify ownership/permissions
11. **Cascade Deletion**: Deleting recipes automatically deletes associated comments, ratings, and saved recipes

---

## 🐛 Common Issues

### Issue: "Recipe not found or you do not have permission"
- **Cause**: Trying to view analytics for a recipe you don't own
- **Solution**: Only chefs can view analytics for their own recipes (admins can view all)

### Issue: "Cannot change own role"
- **Cause**: Admin trying to change their own role
- **Solution**: Another admin must change your role

### Issue: "Cannot demote the last admin"
- **Cause**: Trying to change role of the only admin in the system
- **Solution**: Promote another user to admin first

### Issue: "Invalid time range format"
- **Cause**: Using incorrect time range format
- **Solution**: Use only: `7d`, `30d`, `90d`, `1y`, `all`

### Issue: "Deletion reason must be at least 10 characters long"
- **Cause**: Provided deletion reason is too short
- **Solution**: Provide a detailed reason with at least 10 characters

### Issue: Bulk deletion partially fails
- **Cause**: Some items may not exist or have been already deleted
- **Solution**: Check the `results` array to see which items succeeded/failed

---

## 🔄 Related Documentation

- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Saved Recipes Guide](./FRONTEND_SAVED_RECIPES_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Last Updated**: 2025-01-20  
**API Version**: 1.0  
**Backend Status**: ✅ All Phases Complete (User Management + Analytics + Content Moderation)
