# Community Engagement System - Technical Documentation

**Feature**: Recipe Ratings & Comments  
**Version**: 1.0  
**Status**: ✅ Complete  
**Last Updated**: October 31, 2025

---

## 📋 Overview

The Community Engagement System enables users to rate recipes (1-5 stars) and leave comments, fostering community interaction and providing valuable feedback to recipe creators.

---

## 🎯 Features

- ✅ Recipe Ratings (1-5 stars, one per user per recipe)
- ✅ Upsert Rating Logic (create or update)
- ✅ Automatic Rating Statistics Updates
- ✅ Rating Distribution Calculation
- ✅ Recipe Comments (CRUD operations)
- ✅ Paginated Comment Listing
- ✅ Comment Ownership Validation
- ✅ Admin Override for Deletions
- ✅ Automatic Comment Counter Updates

---

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph "Client"
        USER[Authenticated User]
        ADMIN[Admin User]
    end

    subgraph "Rating Endpoints"
        RATE[POST /community/recipes/:id/ratings]
        GET_MY_RATING[GET /community/recipes/:id/ratings/me]
        GET_RATINGS[GET /community/recipes/:id/ratings]
        DELETE_RATING[DELETE /community/recipes/:id/ratings/me]
    end

    subgraph "Comment Endpoints"
        ADD_COMMENT[POST /community/recipes/:id/comments]
        GET_COMMENTS[GET /community/recipes/:id/comments]
        UPDATE_COMMENT[PUT /community/recipes/:id/comments/:commentId]
        DELETE_COMMENT[DELETE /community/recipes/:id/comments/:commentId]
    end

    subgraph "Middleware"
        AUTH[authMiddleware<br/>JWT Verification]
    end

    subgraph "Community Service"
        SUBMIT_RATING[submitRating<br/>Upsert Logic]
        GET_USER_RATING[getUserRating]
        GET_RECIPE_RATINGS[getRecipeRatings<br/>With Distribution]
        DELETE_RATING_SVC[deleteRating<br/>Recalculate Stats]
        RECALC[recalculateRecipeRatingStats]
        
        ADD_COMMENT_SVC[addComment<br/>Transaction]
        GET_COMMENTS_SVC[getRecipeComments<br/>Paginated]
        UPDATE_COMMENT_SVC[updateComment<br/>Ownership Check]
        DELETE_COMMENT_SVC[deleteComment<br/>Transaction]
    end

    subgraph "Data Layer"
        RATING_TBL[(Rating Table)]
        COMMENT_TBL[(Comment Table)]
        RECIPE_TBL[(Recipe Table<br/>Stats: averageRating<br/>totalRatings<br/>totalComments)]
    end

    USER --> RATE
    USER --> GET_MY_RATING
    USER --> GET_RATINGS
    USER --> DELETE_RATING
    USER --> ADD_COMMENT
    USER --> GET_COMMENTS
    USER --> UPDATE_COMMENT
    USER --> DELETE_COMMENT

    ADMIN --> DELETE_COMMENT

    RATE --> AUTH
    GET_MY_RATING --> AUTH
    GET_RATINGS --> AUTH
    DELETE_RATING --> AUTH
    ADD_COMMENT --> AUTH
    GET_COMMENTS --> AUTH
    UPDATE_COMMENT --> AUTH
    DELETE_COMMENT --> AUTH

    AUTH --> SUBMIT_RATING
    AUTH --> GET_USER_RATING
    AUTH --> GET_RECIPE_RATINGS
    AUTH --> DELETE_RATING_SVC
    AUTH --> ADD_COMMENT_SVC
    AUTH --> GET_COMMENTS_SVC
    AUTH --> UPDATE_COMMENT_SVC
    AUTH --> DELETE_COMMENT_SVC

    SUBMIT_RATING --> RATING_TBL
    SUBMIT_RATING --> RECALC
    DELETE_RATING_SVC --> RATING_TBL
    DELETE_RATING_SVC --> RECALC
    RECALC --> RECIPE_TBL

    ADD_COMMENT_SVC --> COMMENT_TBL
    ADD_COMMENT_SVC --> RECIPE_TBL
    DELETE_COMMENT_SVC --> COMMENT_TBL
    DELETE_COMMENT_SVC --> RECIPE_TBL

    style USER fill:#e3f2fd
    style ADMIN fill:#ffcdd2
    style RATING_TBL fill:#c8e6c9
    style COMMENT_TBL fill:#c8e6c9
    style RECIPE_TBL fill:#c8e6c9
```

---

## ⭐ Rating System Flow

### Submit/Update Rating Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: POST /community/recipes/:recipeId/ratings<br/>{rating: 4}
    API->>API: Verify Auth
    API->>API: Validate Input (1-5 stars)
    
    API->>CommunityService: submitRating()
    CommunityService->>Database: Find Recipe by ID
    
    alt Recipe Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Recipe Not Found
        API-->>User: Error
    end

    CommunityService->>CommunityService: Check Recipe Status
    
    alt Recipe Not APPROVED
        CommunityService-->>API: 400 Cannot Rate
        API-->>User: Error
    end

    CommunityService->>Database: Check Existing Rating<br/>(userId + recipeId)
    
    alt Rating Exists
        Database-->>CommunityService: Found Rating
        CommunityService->>Database: Update Rating<br/>Set rating = 4<br/>Update updatedAt
        Note over Database: Upsert Operation
    else No Rating
        Database-->>CommunityService: Not Found
        CommunityService->>Database: Create Rating<br/>rating = 4<br/>userId, recipeId
        Note over Database: New Rating Created
    end

    Database-->>CommunityService: Rating Saved
    
    CommunityService->>CommunityService: recalculateRecipeRatingStats()
    CommunityService->>Database: Get All Recipe Ratings
    Database-->>CommunityService: All Ratings
    
    CommunityService->>CommunityService: Calculate Average<br/>Count Total
    CommunityService->>Database: Update Recipe<br/>averageRating: 4.2<br/>totalRatings: 15
    
    Database-->>CommunityService: Stats Updated
    CommunityService-->>API: Updated Rating
    API-->>User: 201 Created (or 200 OK)
```

### Get Recipe Ratings with Distribution

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: GET /community/recipes/:recipeId/ratings?page=1&limit=12
    API->>API: Verify Auth
    API->>CommunityService: getRecipeRatings()
    
    CommunityService->>Database: Find Recipe by ID
    
    alt Recipe Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Not Found
        API-->>User: Error
    end

    CommunityService->>Database: Get Paginated Ratings<br/>Include User Info
    Database-->>CommunityService: Ratings List
    
    CommunityService->>Database: Count Total Ratings
    Database-->>CommunityService: Total Count
    
    CommunityService->>Database: Count Ratings by Value<br/>(1 star, 2 stars, etc.)
    Database-->>CommunityService: Distribution
    
    CommunityService->>CommunityService: Build Distribution Object<br/>{1: count, 2: count, ...}
    
    CommunityService-->>API: {<br/>  ratings: [...],<br/>  pagination: {...},<br/>  summary: {<br/>    average: 4.2,<br/>    total: 15,<br/>    distribution: {1:0, 2:1, 3:2, 4:5, 5:7}<br/>  }<br/>}
    API-->>User: 200 OK + Ratings Data
```

### Delete Rating Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: DELETE /community/recipes/:recipeId/ratings/me
    API->>API: Verify Auth
    API->>CommunityService: deleteRating()
    
    CommunityService->>Database: Find Rating<br/>(userId + recipeId)
    
    alt Rating Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Not Found
        API-->>User: Error
    end

    CommunityService->>Database: Delete Rating
    Database-->>CommunityService: Deleted
    
    CommunityService->>CommunityService: recalculateRecipeRatingStats()
    CommunityService->>Database: Get Remaining Ratings
    Database-->>CommunityService: Ratings List
    
    CommunityService->>CommunityService: Calculate New Average<br/>Count Total
    CommunityService->>Database: Update Recipe<br/>averageRating: 4.3<br/>totalRatings: 14
    
    Database-->>CommunityService: Stats Updated
    CommunityService-->>API: Success
    API-->>User: 204 No Content
```

---

## 💬 Comment System Flow

### Add Comment Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: POST /community/recipes/:recipeId/comments<br/>{content: "Great recipe!"}
    API->>API: Verify Auth
    API->>API: Validate Input (10-500 chars)
    
    API->>CommunityService: addComment()
    CommunityService->>Database: Find Recipe by ID
    
    alt Recipe Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Not Found
        API-->>User: Error
    end

    CommunityService->>CommunityService: Check Recipe Status
    
    alt Recipe Not APPROVED
        CommunityService-->>API: 400 Cannot Comment
        API-->>User: Error
    end

    CommunityService->>Database: BEGIN TRANSACTION
    
    CommunityService->>Database: Create Comment<br/>content: "Great recipe!"<br/>userId, recipeId
    Database-->>CommunityService: Comment Created
    
    CommunityService->>Database: Update Recipe<br/>totalComments += 1
    Database-->>CommunityService: Counter Updated
    
    CommunityService->>Database: COMMIT TRANSACTION
    Database-->>CommunityService: Success
    
    CommunityService->>Database: Get Comment with User Info
    Database-->>CommunityService: Full Comment
    
    CommunityService-->>API: Comment + User
    API-->>User: 201 Created
```

### Get Comments Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: GET /community/recipes/:recipeId/comments?page=1&limit=12
    API->>API: Verify Auth
    API->>CommunityService: getRecipeComments()
    
    CommunityService->>Database: Find Recipe by ID
    
    alt Recipe Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Not Found
        API-->>User: Error
    end

    CommunityService->>Database: Get Paginated Comments<br/>ORDER BY createdAt DESC<br/>Include User Info
    Database-->>CommunityService: Comments List
    
    CommunityService->>Database: Count Total Comments
    Database-->>CommunityService: Total Count
    
    CommunityService-->>API: {<br/>  comments: [...],<br/>  pagination: {<br/>    page: 1,<br/>    limit: 12,<br/>    total: 25,<br/>    hasNext: true<br/>  }<br/>}
    API-->>User: 200 OK + Comments
```

### Update Comment Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: PUT /community/recipes/:recipeId/comments/:commentId<br/>{content: "Updated content"}
    API->>API: Verify Auth
    API->>API: Validate Input (10-500 chars)
    
    API->>CommunityService: updateComment()
    CommunityService->>Database: Find Comment by ID
    
    alt Comment Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Not Found
        API-->>User: Error
    end

    CommunityService->>CommunityService: Check Ownership
    
    alt Not Comment Owner
        CommunityService-->>API: 403 Forbidden
        API-->>User: Error
    end

    CommunityService->>Database: Update Comment<br/>content: "Updated content"<br/>updatedAt: now()
    Database-->>CommunityService: Updated
    
    CommunityService->>Database: Get Comment with User Info
    Database-->>CommunityService: Full Comment
    
    CommunityService-->>API: Updated Comment
    API-->>User: 200 OK
```

### Delete Comment Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: DELETE /community/recipes/:recipeId/comments/:commentId
    API->>API: Verify Auth
    API->>CommunityService: deleteComment()
    
    CommunityService->>Database: Find Comment by ID
    
    alt Comment Not Found
        Database-->>CommunityService: Not Found
        CommunityService-->>API: 404 Not Found
        API-->>User: Error
    end

    CommunityService->>CommunityService: Check Authorization
    
    alt Not Owner and Not Admin
        CommunityService-->>API: 403 Forbidden
        API-->>User: Error
    end

    CommunityService->>Database: BEGIN TRANSACTION
    
    CommunityService->>Database: Delete Comment
    Database-->>CommunityService: Deleted
    
    CommunityService->>Database: Update Recipe<br/>totalComments -= 1
    Database-->>CommunityService: Counter Updated
    
    CommunityService->>Database: COMMIT TRANSACTION
    Database-->>CommunityService: Success
    
    CommunityService-->>API: Deletion Success
    API-->>User: 204 No Content
```

---

## 🗄️ Database Schema

### Rating Model

```prisma
model Rating {
  id        String   @id @default(cuid())
  rating    Int      @db.SmallInt  // 1-5 stars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  recipeId  String

  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, recipeId])  // One rating per user per recipe
  @@index([recipeId])
  @@index([userId])
  @@map("ratings")
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

  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([recipeId])
  @@index([userId])
  @@index([createdAt])
  @@map("comments")
}
```

### Recipe Model (Stats Fields)

```prisma
model Recipe {
  // ... other fields ...
  averageRating    Float           @default(0)
  totalRatings     Int             @default(0)
  totalComments    Int             @default(0)
  
  // Relations
  ratings          Rating[]
  comments         Comment[]
}
```

---

## 🔄 Automatic Updates

```mermaid
graph LR
    subgraph "Rating Actions"
        R_CREATE[Create Rating]
        R_UPDATE[Update Rating]
        R_DELETE[Delete Rating]
    end

    subgraph "Comment Actions"
        C_CREATE[Create Comment]
        C_DELETE[Delete Comment]
    end

    subgraph "Automatic Updates"
        RECALC[Recalculate Stats]
        UPDATE_AVG[Update averageRating]
        UPDATE_TOTAL_R[Update totalRatings]
        UPDATE_TOTAL_C[Update totalComments]
    end

    R_CREATE --> RECALC
    R_UPDATE --> RECALC
    R_DELETE --> RECALC
    
    RECALC --> UPDATE_AVG
    RECALC --> UPDATE_TOTAL_R

    C_CREATE --> UPDATE_TOTAL_C
    C_DELETE --> UPDATE_TOTAL_C

    style RECALC fill:#fff3e0
    style UPDATE_AVG fill:#c8e6c9
    style UPDATE_TOTAL_R fill:#c8e6c9
    style UPDATE_TOTAL_C fill:#c8e6c9
```

---

## 🔐 Authorization Rules

### Rating Authorization

```mermaid
graph TB
    START[Rating Action]
    AUTH{User<br/>Authenticated?}
    APPROVED{Recipe<br/>APPROVED?}
    OWNER_CHECK{Deleting<br/>Own Rating?}
    
    ALLOW[✅ Allow Action]
    DENY_401[❌ 401 Unauthorized]
    DENY_400[❌ 400 Cannot Rate]
    DENY_404[❌ 404 Not Found]

    START --> AUTH
    AUTH -->|No| DENY_401
    AUTH -->|Yes| APPROVED
    APPROVED -->|No| DENY_400
    APPROVED -->|Yes| OWNER_CHECK
    OWNER_CHECK -->|Submit/Update: Any User| ALLOW
    OWNER_CHECK -->|Delete: Own Rating Only| ALLOW
    OWNER_CHECK -->|Delete: Not Owner| DENY_404

    style ALLOW fill:#c8e6c9
    style DENY_401 fill:#ffebee
    style DENY_400 fill:#ffebee
    style DENY_404 fill:#ffebee
```

### Comment Authorization

```mermaid
graph TB
    START[Comment Action]
    AUTH{User<br/>Authenticated?}
    APPROVED{Recipe<br/>APPROVED?}
    ACTION{Action<br/>Type?}
    OWNER{Is Owner<br/>or Admin?}
    
    ALLOW[✅ Allow Action]
    DENY_401[❌ 401 Unauthorized]
    DENY_400[❌ 400 Cannot Comment]
    DENY_403[❌ 403 Forbidden]

    START --> AUTH
    AUTH -->|No| DENY_401
    AUTH -->|Yes| APPROVED
    APPROVED -->|No| DENY_400
    APPROVED -->|Yes| ACTION
    
    ACTION -->|Create/Read| ALLOW
    ACTION -->|Update/Delete| OWNER
    OWNER -->|Yes| ALLOW
    OWNER -->|No| DENY_403

    style ALLOW fill:#c8e6c9
    style DENY_401 fill:#ffebee
    style DENY_400 fill:#ffebee
    style DENY_403 fill:#ffebee
```

---

## 📡 API Endpoints Summary

### Rating Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/community/recipes/:id/ratings` | POST | ✅ Required | Submit or update rating (upsert) |
| `/community/recipes/:id/ratings/me` | GET | ✅ Required | Get user's rating for recipe |
| `/community/recipes/:id/ratings` | GET | ✅ Required | Get all ratings with distribution |
| `/community/recipes/:id/ratings/me` | DELETE | ✅ Required | Delete user's rating |

### Comment Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/community/recipes/:id/comments` | POST | ✅ Required | Add comment to recipe |
| `/community/recipes/:id/comments` | GET | ✅ Required | Get paginated comments |
| `/community/recipes/:id/comments/:commentId` | PUT | ✅ Required | Update own comment |
| `/community/recipes/:id/comments/:commentId` | DELETE | ✅ Required | Delete comment (owner/admin) |

---

## 📊 Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Submit Rating | ✅ Complete | Upsert logic (create/update) |
| Get User Rating | ✅ Complete | Single rating lookup |
| Get All Ratings | ✅ Complete | With distribution stats |
| Delete Rating | ✅ Complete | Auto-recalculate stats |
| Add Comment | ✅ Complete | Transaction with counter |
| Get Comments | ✅ Complete | Paginated, sorted by date |
| Update Comment | ✅ Complete | Ownership validation |
| Delete Comment | ✅ Complete | Admin override, transaction |
| Rating Statistics | ✅ Complete | Auto-update on changes |
| Comment Counter | ✅ Complete | Auto-update on create/delete |

---

**Last Updated**: October 31, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
