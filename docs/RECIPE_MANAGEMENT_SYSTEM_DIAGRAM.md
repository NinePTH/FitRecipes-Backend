# Recipe Management System - Technical Documentation

**Feature**: Recipe CRUD, Image Upload, Admin Approval  
**Version**: 1.0  
**Status**: ✅ Complete  
**Last Updated**: October 31, 2025

---

## 📋 Overview

The Recipe Management System handles the complete lifecycle of recipes from creation to approval, including multi-image uploads, comprehensive filtering, and admin moderation workflow.

---

## 🎯 Features

- ✅ Recipe Submission (Chef/Admin only)
- ✅ Multi-Image Upload (max 3 images, optimized)
- ✅ Recipe Detail View with Authorization
- ✅ Update Own Recipes
- ✅ Delete Recipes (Owner/Admin)
- ✅ Admin Approval Workflow (PENDING → APPROVED/REJECTED)
- ✅ Recipe Status Management
- ✅ Automatic Image Cleanup on Deletion

---

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph "Client"
        CHEF[Chef User]
        ADMIN[Admin User]
        PUBLIC[Public User]
    end

    subgraph "Recipe Endpoints"
        UPLOAD[POST /recipes/upload-image]
        CREATE[POST /recipes]
        GET_ONE[GET /recipes/:id]
        UPDATE[PUT /recipes/:id]
        DELETE[DELETE /recipes/:id]
        MY_RECIPES[GET /recipes/my-recipes]
    end

    subgraph "Admin Endpoints"
        PENDING[GET /admin/recipes/pending]
        APPROVE[PUT /admin/recipes/:id/approve]
        REJECT[PUT /admin/recipes/:id/reject]
    end

    subgraph "Middleware"
        AUTH[authMiddleware]
        CHEF_ONLY[chefOrAdmin]
        ADMIN_ONLY[adminOnly]
        RATE_LIMIT[rateLimitMiddleware]
    end

    subgraph "Services"
        IMAGE_SVC[Image Service<br/>Sharp + Supabase]
        RECIPE_SVC[Recipe Service<br/>Business Logic]
    end

    subgraph "Data Layer"
        RECIPE_DB[(Recipe Table)]
        SUPABASE_STORAGE[Supabase Storage<br/>recipe-images bucket]
    end

    CHEF --> UPLOAD
    CHEF --> CREATE
    CHEF --> MY_RECIPES
    CHEF --> UPDATE
    CHEF --> DELETE
    
    ADMIN --> PENDING
    ADMIN --> APPROVE
    ADMIN --> REJECT
    
    PUBLIC --> GET_ONE

    UPLOAD --> RATE_LIMIT
    UPLOAD --> AUTH
    UPLOAD --> CHEF_ONLY
    UPLOAD --> IMAGE_SVC

    CREATE --> AUTH
    CREATE --> CHEF_ONLY
    CREATE --> RECIPE_SVC

    GET_ONE --> AUTH
    GET_ONE --> RECIPE_SVC

    UPDATE --> AUTH
    UPDATE --> CHEF_ONLY
    UPDATE --> RECIPE_SVC

    DELETE --> AUTH
    DELETE --> CHEF_ONLY
    DELETE --> RECIPE_SVC

    PENDING --> AUTH
    PENDING --> ADMIN_ONLY
    PENDING --> RECIPE_SVC

    APPROVE --> AUTH
    APPROVE --> ADMIN_ONLY
    APPROVE --> RECIPE_SVC

    REJECT --> AUTH
    REJECT --> ADMIN_ONLY
    REJECT --> RECIPE_SVC

    IMAGE_SVC --> SUPABASE_STORAGE
    RECIPE_SVC --> RECIPE_DB

    style CHEF fill:#fff3e0
    style ADMIN fill:#ffcdd2
    style PUBLIC fill:#e3f2fd
    style RECIPE_DB fill:#c8e6c9
    style SUPABASE_STORAGE fill:#c8e6c9
```

---

## 🔄 Recipe Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Chef Creates Recipe
    Draft --> ImageUpload: Upload Images (Optional)
    ImageUpload --> Draft: Images Uploaded
    Draft --> PENDING: Submit Recipe
    
    PENDING --> APPROVED: Admin Approves
    PENDING --> REJECTED: Admin Rejects
    
    APPROVED --> Public: Visible to All
    REJECTED --> ChefOnly: Only Chef Can View
    
    APPROVED --> Updated: Chef Updates
    Updated --> PENDING: Re-submit for Approval
    
    APPROVED --> Deleted: Chef/Admin Deletes
    REJECTED --> Deleted: Chef Deletes
    PENDING --> Deleted: Chef/Admin Deletes
    
    Deleted --> [*]

    note right of PENDING
        Visible to:
        - Chef (Author)
        - Admin
    end note

    note right of APPROVED
        Visible to:
        - Everyone (Public)
    end note

    note right of REJECTED
        Visible to:
        - Chef (Author only)
        Includes rejection reason
    end note
```

---

## 📸 Image Upload Flow

```mermaid
sequenceDiagram
    participant Chef
    participant API
    participant ImageService
    participant Sharp
    participant Supabase
    
    Chef->>API: POST /recipes/upload-image<br/>FormData: image file
    API->>API: Check Rate Limit (50/hour)
    API->>API: Verify Auth & Role (CHEF/ADMIN)
    
    API->>ImageService: processAndUpload()
    ImageService->>ImageService: Validate File Type<br/>(JPEG, PNG, WebP, GIF)
    
    alt Invalid Type
        ImageService-->>API: 400 Invalid File Type
        API-->>Chef: Error
    end

    ImageService->>ImageService: Check File Size (max 5MB)
    
    alt Too Large
        ImageService-->>API: 400 File Too Large
        API-->>Chef: Error
    end

    ImageService->>Sharp: Load Image Buffer
    Sharp->>Sharp: Get Image Dimensions
    
    alt Invalid Dimensions
        Sharp-->>ImageService: Out of Range
        ImageService-->>API: 400 Invalid Dimensions
        API-->>Chef: Error
    end

    Sharp->>Sharp: Resize to max 1200x900
    Sharp->>Sharp: Set Quality 85%
    Sharp->>Sharp: Convert to WebP/Original
    Sharp-->>ImageService: Optimized Buffer

    ImageService->>ImageService: Generate Unique Filename<br/>recipe-{timestamp}-{random}.{ext}
    ImageService->>Supabase: Upload to recipes/ folder
    Supabase-->>ImageService: Success
    ImageService->>Supabase: Get Public URL
    Supabase-->>ImageService: Public URL

    ImageService-->>API: {imageUrl, publicId, width, height, format, size}
    API-->>Chef: 200 OK + Image Details
```

---

## 📝 Recipe Submission Flow

```mermaid
sequenceDiagram
    participant Chef
    participant API
    participant RecipeService
    participant Database

    Chef->>API: POST /recipes<br/>{title, description, ingredients, imageUrls, etc.}
    API->>API: Verify Auth & Role (CHEF/ADMIN)
    API->>API: Validate Input (Zod Schema)
    
    alt Validation Failed
        API-->>Chef: 400 Bad Request
    end

    API->>RecipeService: submitRecipe()
    
    RecipeService->>RecipeService: Validate dietaryInfo Required
    RecipeService->>RecipeService: Normalize allergies (lowercase)
    RecipeService->>RecipeService: Set prepTime default (10 min)
    RecipeService->>RecipeService: Set mealType default ([DINNER])
    RecipeService->>RecipeService: Limit imageUrls (max 3)
    
    RecipeService->>Database: Create Recipe<br/>status: PENDING<br/>averageRating: 0<br/>totalRatings: 0<br/>totalComments: 0
    
    Database-->>RecipeService: Recipe Created
    RecipeService-->>API: Recipe with Author Info
    API-->>Chef: 201 Created
    
    Note over Chef,Database: Recipe now awaits admin approval
```

---

## ✅ Admin Approval Flow

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant RecipeService
    participant Database
    participant Chef

    Admin->>API: GET /admin/recipes/pending
    API->>API: Verify Auth & Role (ADMIN)
    API->>RecipeService: getPendingRecipes()
    RecipeService->>Database: Find PENDING Recipes
    Database-->>RecipeService: Recipe List
    RecipeService-->>API: Paginated Results
    API-->>Admin: 200 OK + Pending Recipes

    alt Approve Recipe
        Admin->>API: PUT /admin/recipes/:id/approve<br/>{adminNote?}
        API->>RecipeService: approveRecipe()
        RecipeService->>Database: Find Recipe (PENDING only)
        
        alt Not Found or Not PENDING
            Database-->>RecipeService: Error
            RecipeService-->>API: 404 Not Found
            API-->>Admin: Error
        end

        RecipeService->>Database: Update Recipe<br/>status: APPROVED<br/>approvedAt: now()<br/>approvedById: adminId<br/>adminNote: optional
        Database-->>RecipeService: Success
        RecipeService-->>API: Approved Recipe
        API-->>Admin: 200 OK
        
        Note over Chef: Recipe now visible to public
    else Reject Recipe
        Admin->>API: PUT /admin/recipes/:id/reject<br/>{rejectionReason}
        API->>RecipeService: rejectRecipe()
        RecipeService->>Database: Find Recipe (PENDING only)
        RecipeService->>Database: Update Recipe<br/>status: REJECTED<br/>rejectedAt: now()<br/>rejectedById: adminId<br/>rejectionReason: required
        Database-->>RecipeService: Success
        RecipeService-->>API: Rejected Recipe
        API-->>Admin: 200 OK
        
        Note over Chef: Recipe visible to author only<br/>with rejection reason
    end
```

---

## 🔍 Recipe Detail View Authorization

```mermaid
graph TB
    START[GET /recipes/:id]
    AUTH{User<br/>Authenticated?}
    FIND[Find Recipe]
    STATUS{Recipe<br/>Status?}
    
    PENDING{Is User<br/>Author or Admin?}
    REJECTED{Is User<br/>Author?}
    
    SHOW_PENDING[Show Recipe<br/>with Author Info]
    SHOW_REJECTED[Show Recipe<br/>with Rejection Reason]
    SHOW_APPROVED[Show Recipe<br/>with Ratings & Comments]
    
    ERROR_401[401 Unauthorized]
    ERROR_403[403 Forbidden]
    ERROR_404[404 Not Found]

    START --> AUTH
    AUTH -->|No| ERROR_401
    AUTH -->|Yes| FIND
    FIND -->|Not Found| ERROR_404
    FIND -->|Found| STATUS

    STATUS -->|PENDING| PENDING
    STATUS -->|REJECTED| REJECTED
    STATUS -->|APPROVED| SHOW_APPROVED

    PENDING -->|Yes| SHOW_PENDING
    PENDING -->|No| ERROR_403

    REJECTED -->|Yes| SHOW_REJECTED
    REJECTED -->|No| ERROR_403

    style SHOW_PENDING fill:#c8e6c9
    style SHOW_REJECTED fill:#ffcdd2
    style SHOW_APPROVED fill:#c8e6c9
    style ERROR_401 fill:#ffebee
    style ERROR_403 fill:#ffebee
    style ERROR_404 fill:#ffebee
```

---

## 🗑️ Recipe Deletion Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant RecipeService
    participant Database
    participant Supabase

    User->>API: DELETE /recipes/:id
    API->>API: Verify Auth
    API->>RecipeService: deleteRecipe()
    RecipeService->>Database: Find Recipe by ID
    
    alt Recipe Not Found
        Database-->>RecipeService: Not Found
        RecipeService-->>API: 404 Not Found
        API-->>User: Error
    end

    RecipeService->>RecipeService: Check Authorization
    
    alt Not Owner and Not Admin
        RecipeService-->>API: 403 Forbidden
        API-->>User: Error
    end

    RecipeService->>Database: Get Recipe imageUrls
    
    loop For Each Image URL
        RecipeService->>Supabase: Delete Image from Storage
        Supabase-->>RecipeService: Deleted
    end

    RecipeService->>Database: Delete Recipe<br/>CASCADE: Comments, Ratings
    Database-->>RecipeService: Success
    
    RecipeService-->>API: Deletion Success
    API-->>User: 204 No Content
```

---

## 🗄️ Database Schema

### Recipe Model

```prisma
model Recipe {
  id               String          @id @default(cuid())
  title            String
  description      String
  mainIngredient   String
  ingredients      Json            // [{name, amount, unit}]
  instructions     String[]
  prepTime         Int             @default(10)    // minutes
  cookingTime      Int                             // minutes
  servings         Int
  difficulty       DifficultyLevel
  mealType         MealType[]      @default([DINNER])
  cuisineType      String?
  dietaryInfo      Json            // REQUIRED: {isVegetarian, isVegan, etc.}
  nutritionInfo    Json?           // Optional: {calories, protein, etc.}
  allergies        String[]        // e.g., ["nuts", "dairy", "eggs"]
  imageUrls        String[]        @default([])    // Max 3 images
  status           RecipeStatus    @default(PENDING)
  averageRating    Float           @default(0)
  totalRatings     Int             @default(0)
  totalComments    Int             @default(0)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  
  // Approval/Rejection tracking
  approvedAt       DateTime?
  approvedById     String?
  rejectedAt       DateTime?
  rejectedById     String?
  rejectionReason  String?
  adminNote        String?
  
  authorId         String

  // Relations
  author           User      @relation(fields: [authorId], references: [id])
  approvedBy       User?     @relation("ApprovedRecipes", fields: [approvedById], references: [id])
  rejectedBy       User?     @relation("RejectedRecipes", fields: [rejectedById], references: [id])
  comments         Comment[]
  ratings          Rating[]

  @@index([status])
  @@index([mainIngredient])
  @@index([authorId])
  @@index([mealType])
  @@map("recipes")
}

enum RecipeStatus {
  PENDING
  APPROVED
  REJECTED
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
  DESSERT
}
```

---

## 🔒 Authorization Matrix

```mermaid
graph TB
    subgraph "Recipe Status: PENDING"
        P1[Author: Full Access]
        P2[Admin: Full Access]
        P3[Others: No Access 403]
    end

    subgraph "Recipe Status: REJECTED"
        R1[Author: Read Only]
        R2[Admin: No Access 404]
        R3[Others: No Access 404]
    end

    subgraph "Recipe Status: APPROVED"
        A1[Everyone: Read Access]
        A2[Author: Update & Delete]
        A3[Admin: Update & Delete]
    end

    style P1 fill:#c8e6c9
    style P2 fill:#c8e6c9
    style P3 fill:#ffcdd2
    style R1 fill:#fff3e0
    style R2 fill:#ffcdd2
    style R3 fill:#ffcdd2
    style A1 fill:#c8e6c9
    style A2 fill:#c8e6c9
    style A3 fill:#c8e6c9
```

---

## 📡 API Endpoints

### Image Upload
```http
POST /api/v1/recipes/upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
  image: <file>

Response 200:
{
  "status": "success",
  "data": {
    "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/recipes/recipe-xxx.webp",
    "publicId": "recipe-xxx",
    "width": 1200,
    "height": 900,
    "format": "webp",
    "size": 245678
  }
}
```

### Submit Recipe
```http
POST /api/v1/recipes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mediterranean Quinoa Bowl",
  "description": "Healthy and delicious...",
  "mainIngredient": "Quinoa",
  "ingredients": [
    {"name": "Quinoa", "amount": "1", "unit": "cup"},
    {"name": "Cherry tomatoes", "amount": "1", "unit": "cup"}
  ],
  "instructions": [
    "Cook quinoa according to package directions",
    "Chop vegetables",
    "Combine all ingredients"
  ],
  "prepTime": 15,
  "cookingTime": 20,
  "servings": 2,
  "difficulty": "EASY",
  "mealType": ["LUNCH", "DINNER"],
  "cuisineType": "Mediterranean",
  "dietaryInfo": {
    "isVegetarian": true,
    "isVegan": true,
    "isGlutenFree": true,
    "isDairyFree": true,
    "isKeto": false,
    "isPaleo": false
  },
  "nutritionInfo": {
    "calories": 350,
    "protein": 12,
    "carbs": 45,
    "fat": 8
  },
  "allergies": ["nuts"],
  "imageUrls": ["https://..."]
}

Response 201:
{
  "status": "success",
  "data": {
    "id": "xxx",
    "title": "Mediterranean Quinoa Bowl",
    "status": "PENDING",
    ...
  }
}
```

### Get Recipe Details
```http
GET /api/v1/recipes/:id
Authorization: Bearer <token>

Response 200:
{
  "status": "success",
  "data": {
    "id": "xxx",
    "title": "...",
    "status": "APPROVED",
    "author": {...},
    "ratings": [...],
    ...
  }
}
```

### Delete Recipe
```http
DELETE /api/v1/recipes/:id
Authorization: Bearer <token>

Response 204: No Content
```

### Admin: Get Pending Recipes
```http
GET /api/v1/admin/recipes/pending?page=1&limit=12
Authorization: Bearer <admin-token>

Response 200:
{
  "status": "success",
  "data": {
    "recipes": [...],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 48,
      "totalPages": 4
    }
  }
}
```

### Admin: Approve Recipe
```http
PUT /api/v1/admin/recipes/:id/approve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "adminNote": "Great recipe! Approved." // Optional
}

Response 200:
{
  "status": "success",
  "data": {
    "id": "xxx",
    "status": "APPROVED",
    "approvedAt": "2025-10-31T10:00:00Z",
    "approvedById": "admin-id"
  }
}
```

### Admin: Reject Recipe
```http
PUT /api/v1/admin/recipes/:id/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "rejectionReason": "Missing ingredient measurements" // Required
}

Response 200:
{
  "status": "success",
  "data": {
    "id": "xxx",
    "status": "REJECTED",
    "rejectedAt": "2025-10-31T10:00:00Z",
    "rejectedById": "admin-id",
    "rejectionReason": "Missing ingredient measurements"
  }
}
```

---

## 📊 Image Upload Specifications

| Constraint | Value |
|------------|-------|
| **Max File Size** | 5 MB |
| **Allowed Types** | JPEG, PNG, WebP, GIF |
| **Min Dimensions** | 400x300 pixels |
| **Max Dimensions** | 4000x3000 pixels |
| **Output Format** | WebP (or original if conversion fails) |
| **Output Quality** | 85% |
| **Max Output Width** | 1200 pixels |
| **Max Output Height** | 900 pixels |
| **Rate Limit** | 50 uploads/hour per IP |
| **Max Images per Recipe** | 3 images |

---

## 🧪 Testing Examples

```bash
# Upload Image
curl -X POST http://localhost:3000/api/v1/recipes/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"

# Submit Recipe
curl -X POST http://localhost:3000/api/v1/recipes \
  -H "Authorization: Bearer YOUR_CHEF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "description": "Test description",
    "mainIngredient": "Test",
    "ingredients": [{"name":"Test","amount":"1","unit":"cup"}],
    "instructions": ["Step 1"],
    "prepTime": 10,
    "cookingTime": 20,
    "servings": 2,
    "difficulty": "EASY",
    "dietaryInfo": {
      "isVegetarian": true,
      "isVegan": false,
      "isGlutenFree": false,
      "isDairyFree": false,
      "isKeto": false,
      "isPaleo": false
    }
  }'

# Get Recipe Details
curl -X GET http://localhost:3000/api/v1/recipes/RECIPE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete Recipe
curl -X DELETE http://localhost:3000/api/v1/recipes/RECIPE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin: Approve Recipe
curl -X PUT http://localhost:3000/api/v1/admin/recipes/RECIPE_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adminNote": "Looks great!"}'
```

---

## 📊 Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Image Upload | ✅ Complete | Sharp optimization, Supabase storage |
| Recipe Submission | ✅ Complete | Comprehensive validation |
| Recipe Detail View | ✅ Complete | Authorization-based visibility |
| Recipe Deletion | ✅ Complete | Automatic image cleanup |
| Admin Approval | ✅ Complete | With admin notes |
| Admin Rejection | ✅ Complete | With rejection reasons |
| My Recipes | ✅ Complete | Filter by author |
| Recipe Update | ⏳ TODO | Planned for next release |

---

**Last Updated**: October 31, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
