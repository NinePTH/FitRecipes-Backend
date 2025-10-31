# Admin Recipe Approval API Requirements

## 📋 Overview

This document outlines the backend API requirements for the **Admin Recipe Approval** feature in the FitRecipes application. This feature allows administrators to review, approve, or reject recipes submitted by chefs.

> **✅ IMPLEMENTATION STATUS: COMPLETE**
> 
> All required endpoints have been implemented in the backend. The API is ready for frontend integration.
> 
> **Implementation Date**: October 31, 2025  
> **Backend Repository**: FitRecipes-Backend (develop branch)

---

## 🎯 Feature Requirements

### User Story
As an admin, I want to:
- View all pending recipes submitted by chefs
- Review recipe details before approval
- Approve recipes to make them visible to all users
- Reject recipes with a reason for rejection
- Track approval statistics (pending, approved today, rejected today)

### Current Frontend Implementation
- **Page**: `AdminRecipeApprovalPage.tsx`
- **Route**: `/admin/recipes/approval` (protected, ADMIN role only)
- **Status**: ✅ UI complete, awaiting backend API integration

---

## 📡 Required API Endpoints

### 1. Get Pending Recipes

**Endpoint**: `GET /api/v1/admin/recipes/pending`

**Description**: Retrieve all recipes with status 'PENDING' that need admin approval.

**Authentication**: Required (Admin role only)

**Query Parameters**:
```typescript
{
  page?: number;        // Page number for pagination (default: 1)
  limit?: number;       // Items per page (default: 10)
  sortBy?: string;      // Sort field: 'createdAt' | 'updatedAt' | 'title' (default: 'createdAt')
  sortOrder?: string;   // Sort order: 'asc' | 'desc' (default: 'desc')
}
```

**Response** (200 OK):
```typescript
{
  status: 'success',
  data: {
    recipes: [
      {
        id: string;
        title: string;
        description: string;
        imageUrls: string[];           // Array of image URLs (max 3)
        ingredients: [
          {
            name: string;
            amount: string;
            unit: string;
          }
        ];
        instructions: string[];         // Array of instruction steps
        prepTime: number;               // In minutes
        cookingTime: number;            // In minutes
        servings: number;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';  // Uppercase enum
        mealType: ('BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DESSERT')[]; // Array of uppercase enums
        cuisineType: string;
        mainIngredient: string;
        dietaryInfo: {
          isVegan: boolean;
          isVegetarian: boolean;
          isGlutenFree: boolean;
          isDairyFree: boolean;
          isKeto: boolean;
          isPaleo: boolean;
        };
        nutritionInfo?: {
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sodium?: number;
        };
        allergies?: string[];
        status: 'PENDING';              // Only PENDING recipes
        averageRating: number;
        totalRatings: number;
        authorId: string;
        author: {                       // Chef who submitted the recipe
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: 'CHEF';
        };
        createdAt: string;              // ISO 8601 format
        updatedAt: string;              // ISO 8601 format
      }
    ];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message: string;
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Server error

---

### 2. Approve Recipe

**Endpoint**: `PUT /api/v1/admin/recipes/:id/approve`

**Description**: Approve a pending recipe and make it visible to all users.

**Authentication**: Required (Admin role only)

**URL Parameters**:
- `id`: Recipe ID to approve

**Request Body** (Optional):
```typescript
{
  adminNote?: string;  // Optional note from admin about the approval
}
```

**Response** (200 OK):
```typescript
{
  status: 'success',
  data: {
    recipe: {
      id: string;
      title: string;
      status: 'APPROVED';
      approvedAt: string;           // ISO 8601 timestamp
      approvedById: string;         // Admin user ID
      approvedBy: {                 // Admin who approved
        id: string;
        firstName: string;
        lastName: string;
      };
      adminNote?: string;           // Optional admin note
      // ... other recipe fields
    };
  };
  message: 'Recipe approved successfully';
}
```

**Error Responses**:
- `400 Bad Request`: Recipe is not in PENDING status
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Recipe not found
- `500 Internal Server Error`: Server error

**Side Effects**:
- Recipe status changes from `PENDING` to `APPROVED`
- `approvedAt` timestamp is set
- `approvedById` is set to current admin's ID
- Recipe becomes visible in public recipe lists
- Notification should be sent to the chef (if notification system exists)

---

### 3. Reject Recipe

**Endpoint**: `PUT /api/v1/admin/recipes/:id/reject`

**Description**: Reject a pending recipe with a reason.

**Authentication**: Required (Admin role only)

**URL Parameters**:
- `id`: Recipe ID to reject

**Request Body** (Required):
```typescript
{
  rejectionReason: string;  // Required: Reason for rejection (min 10 characters)
  adminNote?: string;       // Optional: Additional note from admin
}
```

**Response** (200 OK):
```typescript
{
  status: 'success',
  data: {
    recipe: {
      id: string;
      title: string;
      status: 'REJECTED';
      rejectedAt: string;           // ISO 8601 timestamp
      rejectedById: string;         // Admin user ID
      rejectedBy: {                 // Admin who rejected
        id: string;
        firstName: string;
        lastName: string;
      };
      rejectionReason: string;      // Reason provided by admin
      adminNote?: string;           // Optional admin note
      // ... other recipe fields
    };
  };
  message: 'Recipe rejected successfully';
}
```

**Error Responses**:
- `400 Bad Request`: 
  - Recipe is not in PENDING status
  - Rejection reason is missing or too short
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Recipe not found
- `500 Internal Server Error`: Server error

**Validation Rules**:
- `rejectionReason` is required
- `rejectionReason` must be at least 10 characters
- Recipe must be in `PENDING` status

**Side Effects**:
- Recipe status changes from `PENDING` to `REJECTED`
- `rejectedAt` timestamp is set
- `rejectedById` is set to current admin's ID
- Recipe is NOT visible in public recipe lists
- Notification should be sent to the chef with rejection reason (if notification system exists)

---

### 4. Get Approval Statistics

**Endpoint**: `GET /api/v1/admin/recipes/stats`

**Description**: Get statistics about recipe approvals.

**Authentication**: Required (Admin role only)

**Query Parameters**:
```typescript
{
  period?: 'today' | 'week' | 'month' | 'all';  // Time period for stats (default: 'today')
}
```

**Response** (200 OK):
```typescript
{
  status: 'success',
  data: {
    pending: number;          // Total pending recipes
    approvedToday: number;    // Recipes approved today
    rejectedToday: number;    // Recipes rejected today
    approvedThisWeek?: number;    // If period includes week
    rejectedThisWeek?: number;    // If period includes week
    approvedThisMonth?: number;   // If period includes month
    rejectedThisMonth?: number;   // If period includes month
    totalApproved?: number;       // If period is 'all'
    totalRejected?: number;       // If period is 'all'
  };
  message: string;
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Server error

---

### 5. Get Recipe by ID (Admin View)

**Endpoint**: `GET /api/v1/admin/recipes/:id`

**Description**: Get full recipe details including pending/rejected recipes (admin-only access).

**Authentication**: Required (Admin role only)

**URL Parameters**:
- `id`: Recipe ID

**Response** (200 OK):
```typescript
{
  status: 'success',
  data: {
    recipe: {
      // Full recipe object with all fields
      id: string;
      title: string;
      description: string;
      imageUrls: string[];
      ingredients: [...];
      instructions: [...];
      prepTime: number;
      cookingTime: number;
      servings: number;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      mealType: string[];
      cuisineType: string;
      mainIngredient: string;
      dietaryInfo: {...};
      nutritionInfo?: {...};
      allergies?: string[];
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      averageRating: number;
      totalRatings: number;
      authorId: string;
      author: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
      // Approval/Rejection details (if applicable)
      approvedAt?: string;
      approvedById?: string;
      approvedBy?: {
        id: string;
        firstName: string;
        lastName: string;
      };
      rejectedAt?: string;
      rejectedById?: string;
      rejectedBy?: {
        id: string;
        firstName: string;
        lastName: string;
      };
      rejectionReason?: string;
      adminNote?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  message: string;
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Recipe not found
- `500 Internal Server Error`: Server error

**Note**: This endpoint allows admins to view ANY recipe regardless of status, unlike the public recipe endpoint which only shows APPROVED recipes.

---

## 🗄️ Database Schema Updates

### Recipe Model Updates

Add the following fields to the existing Recipe model:

```typescript
{
  // Existing fields...
  
  // Approval/Rejection tracking
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    required: true
  },
  
  // Approval fields
  approvedAt?: Date;
  approvedById?: ObjectId;  // Reference to User (admin)
  
  // Rejection fields
  rejectedAt?: Date;
  rejectedById?: ObjectId;  // Reference to User (admin)
  rejectionReason?: String;
  
  // Optional admin note (for both approval and rejection)
  adminNote?: String;
  
  // Existing fields...
}
```

### Indexes

Consider adding indexes for performance:
```typescript
// For filtering pending recipes
{ status: 1, createdAt: -1 }

// For admin statistics
{ status: 1, approvedAt: -1 }
{ status: 1, rejectedAt: -1 }
```

---

## 🔐 Authorization Rules

### Admin-Only Endpoints
All endpoints in this feature require **ADMIN** role:
- Only users with `role: 'ADMIN'` can access these endpoints
- Return `403 Forbidden` for non-admin users
- Return `401 Unauthorized` for unauthenticated requests

### Recipe Status Workflow
```
NEW RECIPE → PENDING → APPROVED (visible to all users)
                   ↓
                REJECTED (not visible, chef can view rejection reason)
```

---

## 🔔 Notifications (Optional Enhancement)

If a notification system exists, consider sending notifications for:

1. **Recipe Approved**:
   - **To**: Recipe author (chef)
   - **Message**: "Your recipe '{title}' has been approved!"
   - **Include**: Link to the approved recipe

2. **Recipe Rejected**:
   - **To**: Recipe author (chef)
   - **Message**: "Your recipe '{title}' needs revisions"
   - **Include**: Rejection reason, admin note

---

## 📊 Frontend Integration Points

### Current Frontend State
The frontend currently uses **mock data** and simulates API calls with `setTimeout()`. All TODO comments in the code indicate where actual API calls should be integrated:

1. **Fetch Pending Recipes**: Line ~125
   ```typescript
   // TODO: Replace with actual API call
   const fetchPendingRecipes = async () => { ... }
   ```

2. **Approve Recipe**: Line ~155
   ```typescript
   // TODO: Call API to approve recipe
   const handleApprove = async (recipeId: string) => { ... }
   ```

3. **Reject Recipe**: Line ~170
   ```typescript
   // TODO: Call API to reject recipe
   const handleReject = async (recipeId: string) => { ... }
   ```

4. **Load More (Infinite Scroll)**: Line ~140
   ```typescript
   // TODO: Implement infinite scroll
   const loadMoreRecipes = () => { ... }
   ```

### Integration Steps for Frontend

Once the backend implements these endpoints:

1. Import the API client service
2. Replace `setTimeout()` mock calls with actual API requests
3. Add proper error handling with user-friendly messages
4. Implement success notifications (toast/alert)
5. Update the statistics section with real-time data

---

## 🧪 Testing Requirements

### Backend Testing Checklist

1. **Authentication & Authorization**:
   - [ ] Non-authenticated users cannot access admin endpoints
   - [ ] Non-admin users receive 403 Forbidden
   - [ ] Admin users can access all endpoints

2. **Get Pending Recipes**:
   - [ ] Returns only PENDING recipes
   - [ ] Pagination works correctly
   - [ ] Sorting works correctly
   - [ ] Returns empty array when no pending recipes

3. **Approve Recipe**:
   - [ ] Recipe status changes to APPROVED
   - [ ] Timestamps are set correctly
   - [ ] Admin info is recorded
   - [ ] Cannot approve non-PENDING recipe
   - [ ] Recipe becomes visible in public lists

4. **Reject Recipe**:
   - [ ] Recipe status changes to REJECTED
   - [ ] Rejection reason is required
   - [ ] Rejection reason minimum length validation
   - [ ] Timestamps are set correctly
   - [ ] Admin info is recorded
   - [ ] Cannot reject non-PENDING recipe
   - [ ] Recipe remains hidden from public lists

5. **Statistics**:
   - [ ] Counts are accurate
   - [ ] Time period filtering works
   - [ ] Real-time updates after approval/rejection

---

## 🚀 Implementation Priority

### Phase 1 (MVP - ✅ COMPLETE)
1. ✅ GET `/api/v1/admin/recipes/pending` - Fetch pending recipes
2. ✅ PUT `/api/v1/admin/recipes/:id/approve` - Approve recipe
3. ✅ PUT `/api/v1/admin/recipes/:id/reject` - Reject recipe
4. ✅ GET `/api/v1/admin/recipes/stats` - Get statistics
5. ✅ GET `/api/v1/admin/recipes/:id` - Admin view any recipe

### Phase 2 (Future Enhancements)
6. ⭐ Notification system integration
7. ⭐ Bulk approval/rejection actions
8. ⭐ Rejection reason templates
9. ⭐ Approval history/audit log

---

## 📝 Notes for Backend Team

### Existing Endpoints to Consider
- The public `GET /api/v1/recipes/:id` endpoint should **only return APPROVED recipes**
- The public `GET /api/v1/recipes` endpoint should **filter out PENDING and REJECTED recipes**
- Ensure chefs can view their own rejected recipes with rejection reasons (in "My Recipes" feature)

### Recipe Submission Flow
When a chef submits a new recipe:
1. Recipe is created with `status: 'PENDING'`
2. Recipe is NOT visible in public recipe lists
3. Admin sees recipe in approval queue
4. After approval → status becomes 'APPROVED' → visible to all users
5. After rejection → status becomes 'REJECTED' → chef can view rejection reason

### Data Consistency
- Ensure `approvedBy` and `rejectedBy` populate admin user details
- Clear rejection fields when a recipe is approved (if re-approval is possible)
- Consider archiving old rejection reasons if recipe is resubmitted

---

## 📞 Contact & Collaboration

**Frontend Repository**: FitRecipes-Frontend  
**Backend Repository**: FitRecipes-Backend  
**Current Branch**: develop

If there are any questions, conflicts with existing implementations, or suggested improvements to this API contract, please:
1. Create an issue in the respective repository
2. Tag the frontend/backend team for discussion
3. Update this document with agreed-upon changes

---

**Document Version**: 2.0.0  
**Last Updated**: October 31, 2025  
**Status**: ✅ IMPLEMENTED - Ready for Frontend Integration

---

## � Implementation Summary

All required endpoints have been implemented:

### Routes (`src/routes/admin.ts`)
- ✅ `GET /api/v1/admin/recipes/pending` → `recipeController.getPendingRecipes`
- ✅ `PUT /api/v1/admin/recipes/:id/approve` → `recipeController.approveRecipe`
- ✅ `PUT /api/v1/admin/recipes/:id/reject` → `recipeController.rejectRecipe`
- ✅ `GET /api/v1/admin/recipes/stats` → `recipeController.getApprovalStats`
- ✅ `GET /api/v1/admin/recipes/:id` → `recipeController.getRecipeByIdAdmin`

### Controllers (`src/controllers/recipeController.ts`)
- ✅ `getPendingRecipes` - Handles pagination, sorting
- ✅ `approveRecipe` - Validates, updates status, records admin
- ✅ `rejectRecipe` - Validates reason, updates status
- ✅ `getApprovalStats` - Returns counts by period (today/week/month/all)
- ✅ `getRecipeByIdAdmin` - Admin can view any recipe regardless of status

### Services (`src/services/recipeService.ts`)
- ✅ `getPendingRecipes` - Database query with pagination
- ✅ `approveRecipe` - Business logic for approval
- ✅ `rejectRecipe` - Business logic for rejection
- ✅ `getApprovalStats` - Statistics calculation
- ✅ `getRecipeByIdAdmin` - Fetch recipe without status restrictions

### Database Schema
All required fields already exist in Recipe model:
- ✅ `status` (PENDING/APPROVED/REJECTED)
- ✅ `approvedAt`, `approvedById`
- ✅ `rejectedAt`, `rejectedById`, `rejectionReason`
- ✅ `adminNote`

### Authentication & Authorization
- ✅ All admin routes protected with `authMiddleware` + `adminOnly`
- ✅ Returns 401 for unauthenticated users
- ✅ Returns 403 for non-admin users

**Ready for frontend integration!** 🚀

