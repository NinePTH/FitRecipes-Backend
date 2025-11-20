# Admin & Chef Dashboard Backend API Specification

## Overview

This document specifies the backend API requirements for the FitRecipes Admin and Chef Dashboard features, including user management, content moderation, analytics, and audit logging capabilities.

**Target Audience**: Backend Development Team  
**Frontend Implementation**: React TypeScript with Chart.js visualizations  
**Authentication**: JWT Bearer tokens (existing auth system)  
**Base URL**: `/api/v1`

---

## 1. User Management APIs

### 1.1 Get All Users (Admin Only)

**Endpoint**: `GET /api/v1/admin/users`

**Description**: Retrieve paginated list of all users with filtering and search capabilities.

**Authorization**: Admin role required

**Query Parameters**:
```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  search?: string;         // Search by name or email
  role?: 'USER' | 'CHEF' | 'ADMIN';  // Filter by role
  status?: 'active' | 'banned';      // Filter by ban status
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';       // Default: desc
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    users: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'USER' | 'CHEF' | 'ADMIN';
      isOAuthUser: boolean;
      termsAccepted: boolean;
      emailVerified: boolean;
      isBanned: boolean;
      bannedAt?: string;      // ISO 8601 datetime
      bannedBy?: string;      // Admin user ID
      banReason?: string;
      createdAt: string;
      lastLoginAt?: string;
      recipeCount?: number;   // Total recipes submitted (for chefs)
      commentCount?: number;  // Total comments made
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}
```

---

### 1.2 Get User Details (Admin Only)

**Endpoint**: `GET /api/v1/admin/users/:userId`

**Description**: Get detailed information about a specific user, including statistics and activity history.

**Authorization**: Admin role required

**Response**:
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'USER' | 'CHEF' | 'ADMIN';
      isOAuthUser: boolean;
      termsAccepted: boolean;
      emailVerified: boolean;
      isBanned: boolean;
      bannedAt?: string;
      bannedBy?: string;
      banReason?: string;
      createdAt: string;
      lastLoginAt?: string;
    };
    statistics: {
      recipesSubmitted: number;
      recipesApproved: number;
      recipesPending: number;
      recipesRejected: number;
      commentsPosted: number;
      ratingsGiven: number;
      averageRecipeRating?: number;  // For chefs
      totalRecipeViews?: number;     // For chefs
    };
    recentActivity: Array<{
      type: 'recipe_submitted' | 'comment_posted' | 'rating_given';
      timestamp: string;
      details: string;
    }>;
  };
  message?: string;
}
```

---

### 1.3 Ban User (Admin Only)

**Endpoint**: `PUT /api/v1/admin/users/:userId/ban`

**Description**: Ban a user from the platform. Banned users cannot log in or perform any actions.

**Authorization**: Admin role required

**Request Body**:
```typescript
{
  reason: string;  // Required, min 10 characters
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    isBanned: boolean;
    bannedAt: string;
    bannedBy: string;
    banReason: string;
  };
  message: string;  // e.g., "User banned successfully"
}
```

**Side Effects**:
- User's JWT tokens should be invalidated (if token blacklist implemented)
- User cannot log in until unbanned
- Audit log entry created
- Optional: Send email notification to banned user

---

### 1.4 Unban User (Admin Only)

**Endpoint**: `PUT /api/v1/admin/users/:userId/unban`

**Description**: Remove ban from a user, restoring their access.

**Authorization**: Admin role required

**Request Body**: None required

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    isBanned: boolean;
    unbannedAt: string;
    unbannedBy: string;
  };
  message: string;  // e.g., "User unbanned successfully"
}
```

**Side Effects**:
- User can log in again
- Audit log entry created
- Optional: Send email notification to unbanned user

---

### 1.5 Change User Role (Admin Only)

**Endpoint**: `PUT /api/v1/admin/users/:userId/role`

**Description**: Change a user's role (USER ↔ CHEF ↔ ADMIN).

**Authorization**: Admin role required

**Request Body**:
```typescript
{
  newRole: 'USER' | 'CHEF' | 'ADMIN';
  reason?: string;  // Optional, for audit logging
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
    changedBy: string;
  };
  message: string;  // e.g., "User role updated successfully"
}
```

**Side Effects**:
- User's permissions updated immediately
- Audit log entry created
- Optional: Send email notification to user about role change

**Validation Rules**:
- Cannot change own role (admin cannot promote/demote themselves)
- Cannot have zero admins in the system (prevent lockout)

---

## 2. Recipe Management (Admin Override)

### 2.1 Admin Delete Recipe

**Endpoint**: `DELETE /api/v1/admin/recipes/:recipeId`

**Description**: Admin can delete any recipe (override owner-only restriction).

**Authorization**: Admin role required

**Request Body**:
```typescript
{
  reason: string;  // Required for audit log, min 10 characters
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    recipeId: string;
    deletedAt: string;
    deletedBy: string;
    reason: string;
  };
  message: string;  // e.g., "Recipe deleted successfully"
}
```

**Side Effects**:
- Recipe soft-deleted or hard-deleted (backend decision)
- All associated comments, ratings, and saved recipe entries removed
- Audit log entry created
- Optional: Notify recipe owner about deletion

---

### 2.2 Bulk Delete Recipes (Admin Only)

**Endpoint**: `POST /api/v1/admin/recipes/bulk-delete`

**Description**: Delete multiple recipes at once.

**Authorization**: Admin role required

**Request Body**:
```typescript
{
  recipeIds: string[];  // Array of recipe IDs
  reason: string;       // Required for audit log
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    deletedCount: number;
    failedCount: number;
    results: Array<{
      recipeId: string;
      success: boolean;
      error?: string;
    }>;
  };
  message: string;
}
```

---

## 3. Comment Moderation

### 3.1 Get All Comments (Admin Only)

**Endpoint**: `GET /api/v1/admin/comments`

**Description**: Retrieve paginated list of all comments across all recipes with filtering.

**Authorization**: Admin role required

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  recipeId?: string;     // Filter by specific recipe
  userId?: string;       // Filter by specific user
  search?: string;       // Search comment text
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    comments: Array<{
      id: string;
      recipeId: string;
      recipeName: string;
      userId: string;
      userName: string;
      userEmail: string;
      text: string;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}
```

---

### 3.2 Bulk Delete Comments (Admin Only)

**Endpoint**: `POST /api/v1/admin/comments/bulk-delete`

**Description**: Delete multiple comments at once.

**Authorization**: Admin role required

**Request Body**:
```typescript
{
  commentIds: string[];  // Array of comment IDs
  reason: string;        // Required for audit log
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    deletedCount: number;
    failedCount: number;
    results: Array<{
      commentId: string;
      success: boolean;
      error?: string;
    }>;
  };
  message: string;
}
```

**Side Effects**:
- Comments removed from database
- Audit log entries created
- Optional: Notify comment authors about deletion

---

## 4. System Analytics (Admin Dashboard)

### 4.1 Get Admin Dashboard Overview

**Endpoint**: `GET /api/v1/admin/analytics/overview`

**Description**: Get high-level statistics for admin dashboard landing page.

**Authorization**: Admin role required

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | 'all';  // Default: 30d
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    users: {
      total: number;
      active: number;       // Logged in within timeRange
      banned: number;
      newInPeriod: number;  // New registrations in timeRange
      byRole: {
        USER: number;
        CHEF: number;
        ADMIN: number;
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
    topChefs: Array<{
      userId: string;
      name: string;
      recipeCount: number;
      averageRating: number;
      totalViews: number;
    }>;
    recentActivity: Array<{
      type: 'user_registered' | 'recipe_submitted' | 'recipe_approved' | 'user_banned';
      timestamp: string;
      details: string;
    }>;
  };
  message?: string;
}
```

---

### 4.2 Get Recipe Submission Trends

**Endpoint**: `GET /api/v1/admin/analytics/recipe-trends`

**Description**: Get time-series data for recipe submissions (for Chart.js line chart).

**Authorization**: Admin role required

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | '1y';  // Default: 30d
  groupBy?: 'day' | 'week' | 'month';       // Default: day for 7d/30d, week for 90d, month for 1y
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    trends: Array<{
      date: string;          // ISO 8601 date
      submitted: number;
      approved: number;
      rejected: number;
    }>;
    summary: {
      totalSubmitted: number;
      totalApproved: number;
      totalRejected: number;
      approvalRate: number;  // Percentage
    };
  };
  message?: string;
}
```

---

### 4.3 Get User Growth Trends

**Endpoint**: `GET /api/v1/admin/analytics/user-growth`

**Description**: Get time-series data for user registrations (for Chart.js line chart).

**Authorization**: Admin role required

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | '1y';
  groupBy?: 'day' | 'week' | 'month';
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    trends: Array<{
      date: string;
      newUsers: number;
      newChefs: number;
      newAdmins: number;
      total: number;
    }>;
    summary: {
      totalNewUsers: number;
      growthRate: number;    // Percentage change vs previous period
    };
  };
  message?: string;
}
```

---

## 5. Chef Analytics (Chef Dashboard)

### 5.1 Get Chef Analytics Overview

**Endpoint**: `GET /api/v1/chef/analytics/overview`

**Description**: Get personalized analytics for the logged-in chef.

**Authorization**: Chef or Admin role required

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | 'all';  // Default: 30d
}
```

**Response**:
```typescript
{
  success: boolean;
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
    };
    topRecipes: Array<{
      id: string;
      name: string;
      views: number;
      rating: number;
      ratingCount: number;
      commentCount: number;
    }>;
    rankings: {
      viewRank: number;      // Chef's rank by total views
      ratingRank: number;    // Chef's rank by average rating
      totalChefs: number;
    };
    recentActivity: Array<{
      type: 'recipe_approved' | 'recipe_rejected' | 'comment_received' | 'rating_received';
      timestamp: string;
      details: string;
    }>;
  };
  message?: string;
}
```

---

### 5.2 Get Recipe Analytics (Per-Recipe)

**Endpoint**: `GET /api/v1/chef/recipes/:recipeId/analytics`

**Description**: Get detailed analytics for a specific recipe owned by the chef.

**Authorization**: Chef or Admin role required (chef can only access own recipes)

**Query Parameters**:
```typescript
{
  timeRange?: '7d' | '30d' | '90d' | 'all';
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    recipe: {
      id: string;
      name: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
      approvedAt?: string;
    };
    views: {
      total: number;
      viewsInPeriod: number;
      viewTrends: Array<{
        date: string;
        views: number;
      }>;
    };
    ratings: {
      total: number;
      average: number;
      distribution: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
      };
      ratingsInPeriod: number;
    };
    comments: {
      total: number;
      commentsInPeriod: number;
      recentComments: Array<{
        id: string;
        userName: string;
        text: string;
        createdAt: string;
      }>;
    };
    engagement: {
      viewToRatingRate: number;   // Percentage
      viewToCommentRate: number;  // Percentage
    };
  };
  message?: string;
}
```

---

### 5.3 Track Recipe View

**Endpoint**: `POST /api/v1/recipes/:recipeId/view`

**Description**: Record a view for a recipe (called when user views recipe detail page).

**Authorization**: Optional (can be called by authenticated or anonymous users)

**Request Body**: None required (user ID from JWT if authenticated)

**Response**:
```typescript
{
  success: boolean;
  message: string;  // e.g., "View recorded"
}
```

**Implementation Notes**:
- Should be idempotent (same user viewing same recipe multiple times per day counts as 1 view)
- Consider using IP address for anonymous views
- Rate limit to prevent abuse (e.g., max 1 view per user per recipe per hour)
- Can be implemented asynchronously (fire-and-forget) to avoid blocking page load

---

## 6. Audit Logging

### 6.1 Get Audit Logs (Admin Only)

**Endpoint**: `GET /api/v1/admin/audit-logs`

**Description**: Retrieve audit logs for admin actions (user bans, role changes, recipe deletions, etc.).

**Authorization**: Admin role required

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  action?: 'user_banned' | 'user_unbanned' | 'role_changed' | 'recipe_deleted' | 'comments_deleted';
  adminId?: string;         // Filter by admin who performed action
  targetUserId?: string;    // Filter by affected user
  startDate?: string;       // ISO 8601 datetime
  endDate?: string;         // ISO 8601 datetime
  sortOrder?: 'asc' | 'desc';
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    logs: Array<{
      id: string;
      action: string;
      adminId: string;
      adminName: string;
      targetType: 'user' | 'recipe' | 'comment';
      targetId: string;
      targetName?: string;
      reason?: string;
      details: object;       // JSON object with action-specific details
      timestamp: string;
      ipAddress?: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}
```

---

## 7. Database Schema Suggestions

### 7.1 Users Table Updates

Add the following columns to the existing `users` table:

```sql
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN banned_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN banned_by VARCHAR(255) NULL;  -- Admin user ID
ALTER TABLE users ADD COLUMN ban_reason TEXT NULL;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
```

### 7.2 Audit Logs Table (New)

```sql
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  admin_id VARCHAR(255) NOT NULL,
  target_type VARCHAR(50) NOT NULL,  -- 'user', 'recipe', 'comment'
  target_id VARCHAR(255) NOT NULL,
  reason TEXT,
  details JSONB,                     -- PostgreSQL JSON type
  ip_address VARCHAR(45),            -- IPv6 compatible
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_admin_id (admin_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_timestamp (timestamp)
);
```

### 7.3 Recipe Views Table (New)

```sql
CREATE TABLE recipe_views (
  id VARCHAR(255) PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),              -- NULL for anonymous views
  ip_address VARCHAR(45),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_user_id (user_id),
  INDEX idx_viewed_at (viewed_at),
  UNIQUE KEY unique_view (recipe_id, user_id, DATE(viewed_at))  -- One view per user per recipe per day
);
```

---

## 8. Notification Integration

All admin actions should trigger notifications to affected users:

### 8.1 User Ban Notification
- Type: `USER_BANNED`
- Recipient: Banned user
- Title: "Your account has been suspended"
- Body: Include ban reason and instructions to contact support

### 8.2 User Unban Notification
- Type: `USER_UNBANNED`
- Recipient: Unbanned user
- Title: "Your account has been restored"
- Body: Welcome back message

### 8.3 Role Change Notification
- Type: `ROLE_CHANGED`
- Recipient: User whose role changed
- Title: "Your account role has been updated"
- Body: Explain new permissions

### 8.4 Recipe Deleted Notification
- Type: `RECIPE_DELETED_ADMIN`
- Recipient: Recipe owner
- Title: "Your recipe has been removed"
- Body: Include deletion reason

### 8.5 Comment Deleted Notification
- Type: `COMMENT_DELETED_ADMIN`
- Recipient: Comment author
- Title: "Your comment has been removed"
- Body: Include deletion reason

**Note**: These should integrate with the existing notification system documented in `NOTIFICATION_SYSTEM_BACKEND_SPEC.md`.

---

## 9. Implementation Priority

### Phase 1: User Management (High Priority)
1. ✅ User ban/unban endpoints
2. ✅ User role change endpoint
3. ✅ Get all users endpoint with filtering
4. ✅ Get user details endpoint
5. ✅ Audit logging for user management actions

### Phase 2: Analytics Foundation (Medium Priority)
6. ✅ Admin analytics overview endpoint
7. ✅ Chef analytics overview endpoint
8. ✅ Recipe view tracking system
9. ✅ Recipe analytics per-recipe endpoint
10. ✅ Time-series trend endpoints

### Phase 3: Content Moderation & Advanced Features (Low Priority)
11. ✅ Admin recipe deletion endpoint
12. ✅ Bulk recipe deletion endpoint
13. ✅ Get all comments endpoint
14. ✅ Bulk comment deletion endpoint
15. ✅ Advanced analytics (user growth, recipe trends)
16. ✅ Audit log retrieval endpoint

---

## 10. Security & Performance Considerations

### Security
- ✅ **Rate Limiting**: All admin endpoints should be rate-limited (e.g., 100 requests/15 minutes)
- ✅ **Input Validation**: Validate all user inputs (email format, reason length, etc.)
- ✅ **Authorization**: Double-check role permissions on every endpoint
- ✅ **Audit Logging**: Log all admin actions with IP address and timestamp
- ✅ **Data Privacy**: Mask sensitive information in logs (passwords, tokens)
- ✅ **Soft Deletes**: Consider soft deletes for recipes/comments for data recovery

### Performance
- ✅ **Caching**: Cache analytics data (invalidate on relevant changes)
- ✅ **Pagination**: All list endpoints must support pagination
- ✅ **Indexing**: Add database indexes on frequently queried columns
- ✅ **Async Processing**: Recipe view tracking should be async
- ✅ **Query Optimization**: Use efficient queries for trend calculations

---

## 11. Testing Requirements

### Unit Tests
- ✅ Test each API endpoint with valid inputs
- ✅ Test authorization (admin-only endpoints reject non-admin users)
- ✅ Test validation (invalid inputs return proper errors)
- ✅ Test edge cases (empty arrays, missing optional fields)

### Integration Tests
- ✅ Test complete ban/unban workflow
- ✅ Test role change workflow
- ✅ Test bulk operations (multiple recipes/comments)
- ✅ Test audit log creation

### End-to-End Tests
- ✅ Test admin dashboard loading with real data
- ✅ Test chef dashboard loading with real data
- ✅ Test user management UI with backend integration
- ✅ Test analytics charts rendering with API data

---

## 12. Frontend Integration Notes

### Chart.js Configuration
The frontend will use Chart.js for data visualization. Backend should return data in formats compatible with Chart.js datasets:

```typescript
// Example for line chart (recipe trends)
{
  labels: ['2025-01-01', '2025-01-02', ...],  // X-axis dates
  datasets: [
    {
      label: 'Submitted',
      data: [5, 8, 12, ...]  // Y-axis values
    },
    {
      label: 'Approved',
      data: [3, 6, 10, ...]
    }
  ]
}
```

### Error Handling
All endpoints should return consistent error format:
```typescript
{
  success: false,
  message: "User-friendly error message",
  errors?: ["Detailed error 1", "Detailed error 2"]
}
```

### Loading States
Frontend will show loading indicators while fetching analytics data. Endpoints should respond within 2 seconds for good UX.

---

## 13. Backend Team Questions & Flexibility

The backend team has full flexibility on implementation details, including:

1. **Database Choice**: PostgreSQL, MySQL, MongoDB, etc.
2. **ORM**: Prisma, TypeORM, Sequelize, raw SQL, etc.
3. **Caching Strategy**: Redis, in-memory, etc.
4. **View Tracking**: Real-time or batch processing
5. **Soft vs Hard Deletes**: Preference for data retention
6. **Authentication**: JWT validation method (existing system should work)

**Questions for Backend Team**:
1. Should banned users be soft-deleted or just flagged?
2. How long should audit logs be retained?
3. Should we implement real-time analytics updates (WebSockets)?
4. Do you need help with database migration scripts?
5. Should recipe view tracking use a message queue for scalability?

---

## 14. API Versioning & Deployment

- All new endpoints use `/api/v1` prefix (consistent with existing APIs)
- No breaking changes to existing endpoints
- Backward compatible with current frontend authentication system
- Can be deployed incrementally (Phase 1 → Phase 2 → Phase 3)

---

## Appendix A: Example Workflow

### Admin Bans a User
1. Admin navigates to User Management page
2. Frontend calls `GET /api/v1/admin/users` to list users
3. Admin clicks "Ban" button on a user
4. Frontend shows confirmation dialog with reason input
5. Frontend calls `PUT /api/v1/admin/users/:userId/ban` with reason
6. Backend:
   - Updates user's `is_banned` flag
   - Invalidates user's JWT tokens
   - Creates audit log entry
   - Sends notification to banned user
7. Backend returns success response
8. Frontend shows success toast and refreshes user list

### Chef Views Their Analytics
1. Chef navigates to Chef Dashboard
2. Frontend calls `GET /api/v1/chef/analytics/overview?timeRange=30d`
3. Backend calculates stats for chef's recipes from last 30 days
4. Backend returns overview data with top recipes
5. Frontend renders cards with stats and Chart.js charts
6. Chef clicks on a specific recipe card
7. Frontend navigates to recipe analytics page
8. Frontend calls `GET /api/v1/chef/recipes/:recipeId/analytics`
9. Backend returns detailed recipe analytics
10. Frontend renders line chart (views over time), bar chart (rating distribution), recent comments list

---

**Document Version**: 1.0  
**Last Updated**: November 20, 2025  
**Status**: Ready for Backend Implementation
