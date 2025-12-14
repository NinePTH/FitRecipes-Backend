# Backend API Implementation Request - Recipe Features

Please implement the following recipe-related features for the FitRecipes backend. The frontend is already built and expects these specific API endpoints and response formats.

## 📋 Required Features

### 1. Recipe Submission (Chef & Admin Roles)
### 2. Recipe Detail View (All Roles)
### 3. Admin Recipe Approval (Admin Role)

---

## 🎯 Feature 1: Recipe Submission

### Endpoint
**`POST /api/v1/recipes`**

### Authentication
- ✅ **Required**: JWT Bearer token
- ✅ **Role Required**: `CHEF` or `ADMIN`
- ❌ **Reject**: Unauthenticated users or `USER` role

### Request Body
```json
{
  "title": "Grilled Chicken Salad",
  "description": "A healthy and delicious grilled chicken salad",
  "mainIngredient": "Chicken",
  "ingredients": [
    {
      "name": "Chicken breast",
      "amount": "200",
      "unit": "g"
    },
    {
      "name": "Mixed greens",
      "amount": "100",
      "unit": "g"
    },
    {
      "name": "Olive oil",
      "amount": "1",
      "unit": "tbsp"
    }
  ],
  "instructions": [
    "Season and grill the chicken breast until fully cooked",
    "Let chicken rest for 5 minutes, then slice",
    "Toss mixed greens with olive oil",
    "Top with sliced chicken and serve"
  ],
  "cookingTime": 25,
  "servings": 2,
  "difficulty": "EASY",
  "cuisineType": "MEDITERRANEAN",
  "dietaryInfo": {
    "isVegetarian": false,
    "isVegan": false,
    "isGlutenFree": true,
    "isDairyFree": true
  },
  "nutritionInfo": {
    "calories": 320,
    "protein": 35,
    "carbs": 8,
    "fat": 15,
    "fiber": 3
  },
  "tags": ["healthy", "high-protein", "low-carb"],
  "imageUrl": "https://example.com/image.jpg"
}
```

### Request Body Validation
**Required fields:**
- `title` (string, 3-200 chars)
- `description` (string, 10-1000 chars)
- `mainIngredient` (string, 2-50 chars) - Primary ingredient for filtering
- `ingredients` (array, min 1 item)
  - Each ingredient: `name` (required), `amount` (required), `unit` (required)
- `instructions` (array, min 1 step)
- `cookingTime` (number, 1-600 minutes)
- `servings` (number, 1-20)
- `difficulty` (enum: `"EASY"` | `"MEDIUM"` | `"HARD"`)

**Optional fields:**
- `cuisineType` (string)
- `dietaryInfo` (object with boolean flags)
- `nutritionInfo` (object with numbers)
- `tags` (array of strings)
- `imageUrl` (string, valid URL)

### Success Response (201 Created)
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "cm123abc...",
      "title": "Grilled Chicken Salad",
      "description": "A healthy and delicious grilled chicken salad",
      "mainIngredient": "Chicken",
      "ingredients": [...],
      "instructions": [...],
      "cookingTime": 25,
      "servings": 2,
      "difficulty": "EASY",
      "cuisineType": "MEDITERRANEAN",
      "dietaryInfo": {...},
      "nutritionInfo": {...},
      "tags": ["healthy", "high-protein", "low-carb"],
      "imageUrl": "https://example.com/image.jpg",
      "status": "PENDING",
      "authorId": "user123...",
      "author": {
        "id": "user123...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "averageRating": 0,
      "totalRatings": 0,
      "createdAt": "2025-10-14T10:00:00.000Z",
      "updatedAt": "2025-10-14T10:00:00.000Z"
    }
  },
  "message": "Recipe submitted successfully and pending approval"
}
```

### Error Responses
**400 Bad Request** - Invalid input
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "Title must be between 3 and 200 characters",
    "At least one ingredient is required",
    "Main ingredient is required"
  ]
}
```

**401 Unauthorized** - No token or invalid token
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

**403 Forbidden** - User role is not CHEF or ADMIN
```json
{
  "status": "error",
  "message": "Only chefs and admins can submit recipes"
}
```

---

## 🎯 Feature 2: Recipe Detail View

### Endpoint
**`GET /api/v1/recipes/:id`**

### Authentication
- ✅ **Required**: JWT Bearer token
- ✅ **All Roles**: USER, CHEF, ADMIN can access

### URL Parameters
- `id` (string, required) - Recipe ID

### Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "cm123abc...",
      "title": "Grilled Chicken Salad",
      "description": "A healthy and delicious grilled chicken salad",
      "mainIngredient": "Chicken",
      "ingredients": [
        {
          "name": "Chicken breast",
          "amount": "200",
          "unit": "g"
        },
        {
          "name": "Mixed greens",
          "amount": "100",
          "unit": "g"
        }
      ],
      "instructions": [
        "Season and grill the chicken breast until fully cooked",
        "Let chicken rest for 5 minutes, then slice"
      ],
      "cookingTime": 25,
      "servings": 2,
      "difficulty": "EASY",
      "cuisineType": "MEDITERRANEAN",
      "dietaryInfo": {
        "isVegetarian": false,
        "isVegan": false,
        "isGlutenFree": true,
        "isDairyFree": true
      },
      "nutritionInfo": {
        "calories": 320,
        "protein": 35,
        "carbs": 8,
        "fat": 15,
        "fiber": 3
      },
      "tags": ["healthy", "high-protein", "low-carb"],
      "imageUrl": "https://example.com/image.jpg",
      "status": "APPROVED",
      "authorId": "user123...",
      "author": {
        "id": "user123...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "CHEF"
      },
      "averageRating": 4.5,
      "totalRatings": 12,
      "ratings": [
        {
          "id": "rating123...",
          "userId": "user456...",
          "userName": "Jane Smith",
          "rating": 5,
          "comment": "Delicious and healthy!",
          "createdAt": "2025-10-12T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-10-14T10:00:00.000Z",
      "updatedAt": "2025-10-14T10:00:00.000Z",
      "approvedAt": "2025-10-14T11:00:00.000Z",
      "approvedBy": {
        "id": "admin123...",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  },
  "message": "Recipe retrieved successfully"
}
```

### Error Responses
**404 Not Found** - Recipe doesn't exist
```json
{
  "status": "error",
  "message": "Recipe not found"
}
```

**403 Forbidden** - User tries to view PENDING recipe they didn't create
```json
{
  "status": "error",
  "message": "You don't have permission to view this recipe"
}
```

### Business Rules
- **APPROVED recipes**: Visible to all authenticated users
- **PENDING recipes**: Only visible to:
  - The recipe author (chef who submitted it)
  - Admins (for approval)
- **REJECTED recipes**: Only visible to the author

---

## 🎯 Feature 3: Admin Recipe Approval

### Get Pending Recipes
**`GET /api/v1/admin/recipes/pending`**

### Authentication
- ✅ **Required**: JWT Bearer token
- ✅ **Role Required**: `ADMIN` only

### Query Parameters (optional)
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `sortBy` (string: `"createdAt"` | `"title"`, default: `"createdAt"`)
- `sortOrder` (string: `"asc"` | `"desc"`, default: `"desc"`)

### Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "cm123abc...",
        "title": "Grilled Chicken Salad",
        "description": "A healthy and delicious grilled chicken salad",
        "mainIngredient": "Chicken",
        "ingredients": [...],
        "instructions": [...],
        "cookingTime": 25,
        "servings": 2,
        "difficulty": "EASY",
        "status": "PENDING",
        "author": {
          "id": "user123...",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "createdAt": "2025-10-14T10:00:00.000Z",
        "imageUrl": "https://example.com/image.jpg"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Pending recipes retrieved successfully"
}
```

---

### Approve Recipe
**`PUT /api/v1/admin/recipes/:id/approve`**

### Authentication
- ✅ **Required**: JWT Bearer token
- ✅ **Role Required**: `ADMIN` only

### Request Body (optional)
```json
{
  "adminNote": "Great recipe! Approved for publication."
}
```

### Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "cm123abc...",
      "title": "Grilled Chicken Salad",
      "status": "APPROVED",
      "approvedAt": "2025-10-14T12:00:00.000Z",
      "approvedBy": {
        "id": "admin123...",
        "firstName": "Admin",
        "lastName": "User"
      },
      "adminNote": "Great recipe! Approved for publication."
    }
  },
  "message": "Recipe approved successfully"
}
```

### Error Responses
**404 Not Found**
```json
{
  "status": "error",
  "message": "Recipe not found"
}
```

**400 Bad Request** - Recipe already approved
```json
{
  "status": "error",
  "message": "Recipe is already approved"
}
```

**403 Forbidden** - Not an admin
```json
{
  "status": "error",
  "message": "Admin access required"
}
```

---

### Reject Recipe
**`PUT /api/v1/admin/recipes/:id/reject`**

### Authentication
- ✅ **Required**: JWT Bearer token
- ✅ **Role Required**: `ADMIN` only

### Request Body
```json
{
  "reason": "Recipe does not meet quality standards. Missing nutritional information."
}
```

**Required field:**
- `reason` (string, 10-500 chars) - Explanation for rejection

### Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "cm123abc...",
      "title": "Grilled Chicken Salad",
      "status": "REJECTED",
      "rejectedAt": "2025-10-14T12:00:00.000Z",
      "rejectedBy": {
        "id": "admin123...",
        "firstName": "Admin",
        "lastName": "User"
      },
      "rejectionReason": "Recipe does not meet quality standards. Missing nutritional information."
    }
  },
  "message": "Recipe rejected"
}
```

### Error Responses
**400 Bad Request** - No rejection reason provided
```json
{
  "status": "error",
  "message": "Rejection reason is required",
  "errors": [
    "Reason must be between 10 and 500 characters"
  ]
}
```

---

## 📊 Database Schema Requirements

### Recipe Model
```typescript
{
  id: string (UUID/CUID)
  title: string (3-200 chars)
  description: string (10-1000 chars)
  mainIngredient: string (2-50 chars) // Primary ingredient for filtering/search
  ingredients: Array<{
    name: string
    amount: string
    unit: string
  }>
  instructions: string[] (array of steps)
  cookingTime: number (minutes)
  servings: number (1-20)
  difficulty: "EASY" | "MEDIUM" | "HARD"
  cuisineType?: string
  dietaryInfo?: {
    isVegetarian: boolean
    isVegan: boolean
    isGlutenFree: boolean
    isDairyFree: boolean
  }
  nutritionInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  tags?: string[]
  imageUrl?: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  authorId: string (foreign key to User)
  averageRating: number (0-5, calculated)
  totalRatings: number (count)
  createdAt: DateTime
  updatedAt: DateTime
  approvedAt?: DateTime
  approvedBy?: string (foreign key to User)
  rejectedAt?: DateTime
  rejectedBy?: string (foreign key to User)
  rejectionReason?: string
  adminNote?: string
}
```

### Relationships
- `Recipe` belongs to `User` (author)
- `Recipe` has many `Rating` (one-to-many)
- `Recipe.approvedBy` references `User` (admin)
- `Recipe.rejectedBy` references `User` (admin)

---

## 🔒 Security & Business Rules

### Authorization Rules
1. **Submit Recipe**: Only `CHEF` or `ADMIN` roles
2. **View Recipe**:
   - `APPROVED`: All authenticated users
   - `PENDING`: Author + Admins only
   - `REJECTED`: Author only
3. **Approve/Reject**: Only `ADMIN` role
4. **Edit Recipe**: Author only (if status is PENDING or REJECTED)
5. **Delete Recipe**: Author (if PENDING/REJECTED) or Admin (any status)

### Validation Rules
1. Title must be unique per author
2. Main ingredient is required (used for filtering)
3. At least 1 ingredient required
4. At least 1 instruction step required
5. Cooking time: 1-600 minutes
6. Servings: 1-20
7. Difficulty: Must be EASY, MEDIUM, or HARD
8. Image URL: Must be valid URL format (if provided)
9. Rejection reason: Required when rejecting, 10-500 chars

### Status Transitions
```
PENDING → APPROVED (by admin)
PENDING → REJECTED (by admin, must provide reason)
REJECTED → PENDING (chef resubmits after fixing issues)
APPROVED → Cannot be changed back to PENDING/REJECTED
```

---

## 🧪 Testing Requirements

Please ensure your implementation includes:

1. **Unit Tests**: Test validation logic, status transitions, authorization
2. **Integration Tests**: Test full API flow with database
3. **Edge Cases**:
   - Invalid role tries to submit recipe
   - Non-admin tries to approve recipe
   - User tries to view another user's pending recipe
   - Approve already approved recipe
   - Reject without reason
   - Submit recipe with missing required fields (including mainIngredient)
   - Submit recipe with invalid difficulty enum
   - SQL injection attempts in text fields
   - XSS attempts in recipe content

---

## 📝 Additional Notes

### Frontend Expectations
The frontend will:
- Display "Pending Approval" status for chef's own pending recipes
- Hide pending recipes from browse page (only show APPROVED)
- Show rejection reason to chef on their recipe detail page
- Redirect to admin approval page after recipe submission
- Show loading states during submission/approval/rejection
- Display success/error toasts for all operations
- Use mainIngredient for filtering recipes by primary ingredient

### Email Notifications (Future)
Consider implementing email notifications for:
- Chef receives email when recipe is approved
- Chef receives email when recipe is rejected (include reason)
- Admin receives email when new recipe is submitted (optional)

### Performance Considerations
- Index on `status` field for fast filtering
- Index on `mainIngredient` field for ingredient-based filtering
- Index on `authorId` for user's recipe queries
- Cache approved recipes list (can use Redis)
- Paginate results (max 100 items per page)

---

## ✅ Implementation Checklist

- [ ] Create Recipe model with all fields (including mainIngredient)
- [ ] Implement `POST /api/v1/recipes` (submit)
- [ ] Implement `GET /api/v1/recipes/:id` (detail)
- [ ] Implement `GET /api/v1/admin/recipes/pending` (list)
- [ ] Implement `PUT /api/v1/admin/recipes/:id/approve`
- [ ] Implement `PUT /api/v1/admin/recipes/:id/reject`
- [ ] Add role-based authorization middleware
- [ ] Add input validation for all endpoints (including mainIngredient)
- [ ] Add unit tests for business logic
- [ ] Add integration tests for API endpoints
- [ ] Test all error scenarios
- [ ] Document API in Swagger/OpenAPI (optional)

---

**Frontend is ready and waiting for these endpoints!** Once implemented, the recipe submission, detail view, and admin approval features will work immediately. Let me know if you need clarification on any response format or business rule.
