# FitRecipes Backend - System Architecture

**Version:** 1.0  
**Date:** October 31, 2025  
**Status:** Production Ready

---

## 📋 Overview

FitRecipes Backend is a RESTful API built with **Hono.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL** (Supabase). The system provides recipe management, user authentication, community engagement (ratings/comments), and advanced recipe browsing capabilities.

---

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Frontend<br/>React/Next.js]
        MOBILE[Mobile App<br/>React Native]
    end

    subgraph "API Gateway Layer"
        LB[Load Balancer<br/>Nginx]
    end

    subgraph "Application Layer"
        API1[Hono API<br/>Instance 1]
        API2[Hono API<br/>Instance 2]
        API3[Hono API<br/>Instance 3]
    end

    subgraph "Middleware Stack"
        CORS[CORS Handler]
        AUTH[JWT Auth]
        RATE[Rate Limiter]
        ERROR[Error Handler]
    end

    subgraph "Business Logic Layer"
        AUTH_SVC[Auth Service]
        RECIPE_SVC[Recipe Service]
        COMM_SVC[Community Service]
        ADMIN_SVC[Admin Service]
    end

    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        PG[(PostgreSQL<br/>Supabase)]
        STORAGE[Supabase Storage<br/>Recipe Images]
    end

    subgraph "External Services"
        GOOGLE[Google OAuth]
        EMAIL[Resend Email]
    end

    WEB --> LB
    MOBILE --> LB
    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> CORS
    API2 --> CORS
    API3 --> CORS

    CORS --> RATE
    RATE --> AUTH
    AUTH --> ERROR

    ERROR --> AUTH_SVC
    ERROR --> RECIPE_SVC
    ERROR --> COMM_SVC
    ERROR --> ADMIN_SVC

    AUTH_SVC --> PRISMA
    RECIPE_SVC --> PRISMA
    COMM_SVC --> PRISMA
    ADMIN_SVC --> PRISMA

    PRISMA --> PG
    RECIPE_SVC --> STORAGE

    AUTH_SVC --> GOOGLE
    AUTH_SVC --> EMAIL

    style WEB fill:#e3f2fd
    style MOBILE fill:#e3f2fd
    style LB fill:#fff3e0
    style API1 fill:#f3e5f5
    style API2 fill:#f3e5f5
    style API3 fill:#f3e5f5
    style PG fill:#c8e6c9
    style STORAGE fill:#c8e6c9
```

---

## 📊 Database Schema Overview

```mermaid
erDiagram
    USER ||--o{ RECIPE : creates
    USER ||--o{ COMMENT : writes
    USER ||--o{ RATING : gives
    USER ||--o{ SESSION : has
    USER ||--o{ RECIPE : approves
    USER ||--o{ RECIPE : rejects
    
    RECIPE ||--o{ COMMENT : has
    RECIPE ||--o{ RATING : receives
    
    USER {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        enum role
        boolean emailVerified
        boolean termsAccepted
        string googleId
        datetime createdAt
    }
    
    RECIPE {
        string id PK
        string title
        string description
        json ingredients
        string[] instructions
        int prepTime
        int cookingTime
        enum difficulty
        enum[] mealType
        json dietaryInfo
        json nutritionInfo
        string[] allergies
        string[] imageUrls
        enum status
        float averageRating
        int totalRatings
        int totalComments
        string authorId FK
        datetime approvedAt
    }
    
    RATING {
        string id PK
        int rating
        string userId FK
        string recipeId FK
        datetime createdAt
    }
    
    COMMENT {
        string id PK
        string content
        string userId FK
        string recipeId FK
        datetime createdAt
    }
    
    SESSION {
        string id PK
        string userId FK
        string token UK
        datetime expiresAt
    }
```

---

## 🔄 Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant CORS
    participant RateLimit
    participant Auth
    participant Controller
    participant Service
    participant Prisma
    participant Database

    Client->>CORS: HTTP Request
    CORS->>RateLimit: Check Origin
    RateLimit->>Auth: Check Rate Limit
    
    alt Protected Route
        Auth->>Auth: Verify JWT Token
        Auth-->>Client: 401 Unauthorized (if invalid)
    end

    Auth->>Controller: Validated Request
    Controller->>Controller: Validate Input (Zod)
    
    alt Validation Failed
        Controller-->>Client: 400 Bad Request
    end

    Controller->>Service: Business Logic
    Service->>Prisma: Database Query
    Prisma->>Database: SQL Query
    Database-->>Prisma: Result
    Prisma-->>Service: Data
    Service->>Service: Process Data
    Service-->>Controller: Response Data
    Controller-->>Client: 200 OK + JSON
```

---

## 🎯 Feature Modules

### 1. Authentication Module
- **Email/Password Authentication**
- **Google OAuth 2.0**
- **Email Verification**
- **Password Reset**
- **Session Management**
- **Role-Based Access Control (RBAC)**

### 2. Recipe Management Module
- **Recipe CRUD Operations**
- **Multi-Image Upload (max 3)**
- **Recipe Status Workflow (PENDING → APPROVED/REJECTED)**
- **Chef-Only Recipe Submission**
- **Admin Approval System**

### 3. Community Engagement Module
- **Recipe Ratings (1-5 stars)**
- **Recipe Comments**
- **Automatic Statistics Updates**
- **User Rating History**

### 4. Browse & Discovery Module
- **Advanced Filtering (10+ filters)**
- **Multi-Criteria Search**
- **Sorting Options (4 types)**
- **Recommended Recipes**
- **Trending Recipes**
- **New Recipes**

### 5. Admin Module
- **Pending Recipe Review**
- **Recipe Approval/Rejection**
- **User Management (future)**
- **Platform Analytics (future)**

---

## 🔐 Security Architecture

```mermaid
graph LR
    subgraph "Security Layers"
        INPUT[Input Validation<br/>Zod Schemas]
        AUTH[JWT Authentication<br/>24h Expiration]
        RBAC[Role-Based Access<br/>USER/CHEF/ADMIN]
        RATE[Rate Limiting<br/>100 req/15min]
        HASH[Password Hashing<br/>bcrypt]
        SANITIZE[Input Sanitization]
    end

    subgraph "Protection Against"
        SQL[SQL Injection<br/>✅ Prisma ORM]
        XSS[XSS Attacks<br/>✅ Sanitization]
        BRUTE[Brute Force<br/>✅ Rate Limit]
        CSRF[CSRF<br/>✅ OAuth State]
        LEAK[Data Leaks<br/>✅ RBAC]
    end

    INPUT --> SQL
    AUTH --> LEAK
    RBAC --> LEAK
    RATE --> BRUTE
    HASH --> BRUTE
    SANITIZE --> XSS
    AUTH --> CSRF

    style SQL fill:#c8e6c9
    style XSS fill:#c8e6c9
    style BRUTE fill:#c8e6c9
    style CSRF fill:#c8e6c9
    style LEAK fill:#c8e6c9
```

---

## 📈 Scalability Strategy

### Horizontal Scaling
- **Docker Compose**: 3 API replicas
- **Nginx Load Balancer**: Round-robin distribution
- **Stateless API**: No server-side session storage
- **Database Connection Pooling**: PgBouncer ready

### Performance Optimizations
1. **Database Indexing**: 9 indexes on frequently queried fields
2. **Pagination**: All list endpoints support pagination
3. **Query Optimization**: Prisma query optimization
4. **Image Optimization**: Sharp library for image processing
5. **Caching Strategy**: Redis ready (future implementation)

### Current Capacity
- **Concurrent Users**: 1,000+
- **Response Time**: < 2 seconds (95th percentile)
- **Throughput**: 100+ req/sec per instance

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_CODE[Code Changes]
        DEV_TEST[Local Testing]
        DEV_LINT[Linting/Type Check]
    end

    subgraph "CI/CD Pipeline"
        GH[GitHub Actions]
        TEST[Unit Tests]
        BUILD[Docker Build]
        SCAN[Security Scan<br/>Trivy]
    end

    subgraph "Environments"
        STAGING[Staging<br/>Render FREE]
        PROD[Production<br/>Render]
    end

    subgraph "Database"
        STAGING_DB[(Staging DB<br/>Supabase)]
        PROD_DB[(Production DB<br/>Supabase)]
    end

    DEV_CODE --> DEV_TEST
    DEV_TEST --> DEV_LINT
    DEV_LINT --> GH

    GH --> TEST
    TEST --> BUILD
    BUILD --> SCAN

    SCAN -->|develop branch| STAGING
    SCAN -->|main branch| PROD

    STAGING --> STAGING_DB
    PROD --> PROD_DB

    style STAGING fill:#fff3e0
    style PROD fill:#c8e6c9
```

---

## 📊 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Bun | Fast JavaScript runtime |
| **Framework** | Hono.js | Lightweight web framework |
| **Language** | TypeScript | Type-safe development |
| **Database** | PostgreSQL (Supabase) | Relational database |
| **ORM** | Prisma | Type-safe database access |
| **Storage** | Supabase Storage | Image hosting |
| **Authentication** | JWT + OAuth 2.0 | Secure authentication |
| **Validation** | Zod | Schema validation |
| **Testing** | Vitest | Unit/integration testing |
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Docker Compose | Local multi-container |
| **Load Balancer** | Nginx | Traffic distribution |
| **CI/CD** | GitHub Actions | Automated deployment |
| **Hosting** | Render | Cloud platform |

---

## 🔄 Data Flow Examples

### Recipe Submission Flow
```mermaid
sequenceDiagram
    participant Chef
    participant API
    participant RecipeService
    participant ImageStorage
    participant Database

    Chef->>API: POST /recipes/upload-image
    API->>ImageStorage: Upload & Optimize
    ImageStorage-->>API: imageUrl
    API-->>Chef: imageUrl

    Chef->>API: POST /recipes (with imageUrl)
    API->>API: Validate Input (Zod)
    API->>RecipeService: submitRecipe()
    RecipeService->>Database: Create Recipe (PENDING)
    Database-->>RecipeService: Recipe Created
    RecipeService-->>API: Success
    API-->>Chef: 201 Created
```

### Rating Submission Flow
```mermaid
sequenceDiagram
    participant User
    participant API
    participant CommunityService
    participant Database

    User->>API: POST /community/recipes/:id/ratings
    API->>API: Verify Auth
    API->>CommunityService: submitRating()
    
    CommunityService->>Database: Check Existing Rating
    
    alt Rating Exists
        Database-->>CommunityService: Found
        CommunityService->>Database: Update Rating
    else No Rating
        Database-->>CommunityService: Not Found
        CommunityService->>Database: Create Rating
    end

    CommunityService->>CommunityService: Recalculate Stats
    CommunityService->>Database: Update Recipe Stats
    Database-->>CommunityService: Success
    CommunityService-->>API: Updated Rating
    API-->>User: 201 Created
```

---

## 📦 Project Structure

```
FitRecipes-Backend/
├── src/
│   ├── routes/          # API endpoint definitions
│   │   ├── auth.ts      # Authentication routes
│   │   ├── recipe.ts    # Recipe management routes
│   │   ├── admin.ts     # Admin routes
│   │   └── community.ts # Rating/Comment routes
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middlewares/     # Auth, CORS, Rate limit
│   ├── utils/          # Helpers, validation, DB
│   ├── types/          # TypeScript types
│   └── index.ts        # App entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Version-controlled migrations
├── tests/              # Unit & integration tests
├── scripts/            # Utility scripts
├── docs/               # Documentation
├── .github/workflows/  # CI/CD pipelines
└── docker-compose.yml  # Multi-container setup
```

---

## 🎯 API Endpoint Summary

| Module | Endpoints | Methods | Auth Required |
|--------|-----------|---------|---------------|
| **Authentication** | 11 | GET, POST | Varies |
| **Recipe Management** | 5 | GET, POST, PUT, DELETE | Yes (Chef/Admin) |
| **Community** | 8 | GET, POST, PUT, DELETE | Yes |
| **Browse** | 4 | GET | No |
| **Admin** | 3 | GET, PUT | Yes (Admin only) |
| **Total** | **31** | - | - |

---

## 📈 Future Enhancements

### Phase 1 (Q1 2026)
- [ ] Redis caching for trending/popular recipes
- [ ] Elasticsearch integration for advanced search
- [ ] Real-time notifications (WebSocket)
- [ ] User profile customization

### Phase 2 (Q2 2026)
- [ ] Recipe collections/playlists
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Mobile app push notifications

### Phase 3 (Q3 2026)
- [ ] AI-powered recipe recommendations
- [ ] Meal planning features
- [ ] Shopping list generation
- [ ] Nutritional analysis API

### Phase 4 (Q4 2026)
- [ ] Kubernetes migration
- [ ] Multi-region deployment
- [ ] GraphQL API layer
- [ ] Microservices architecture

---

## 📞 Support & Maintenance

**Developer**: NinePTH  
**Repository**: [FitRecipes-Backend](https://github.com/NinePTH/FitRecipes-Backend)  
**Documentation**: `/docs` directory  
**API Docs**: See individual feature guides

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 31, 2025 | Initial release with all core features |

---

**Last Updated**: October 31, 2025  
**Document Status**: ✅ Complete
