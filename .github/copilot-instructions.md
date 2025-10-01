# GitHub Copilot Repository Instructions – Backend

This repository contains the backend of the Healthy Recipes Web Application, developed using **Hono.js (TypeScript)** with **Supabase (PostgreSQL + Storage)** and **Prisma ORM**.  
Copilot should assist in building, testing, and maintaining backend features according to the SRS provided below.

## 🏗️ Project Architecture

The project follows a **modular, layered architecture**:

```
src/
├── routes/           # API endpoint definitions (auth, recipe, admin, community)
├── controllers/      # Request handlers and validation
├── services/         # Business logic layer
├── middlewares/      # Authentication, rate limiting, CORS, error handling
├── utils/           # Utilities (database, supabase, auth, validation, helpers)
├── types/           # TypeScript type definitions
└── index.ts         # Main application entry point
```

## General Instructions

### Runtime & Framework
- **Runtime**: Bun (not Node.js) for better performance
- **Framework**: Hono.js with TypeScript for REST APIs
- **Database**: PostgreSQL hosted on Supabase
- **ORM**: Prisma with comprehensive schema (User, Recipe, Comment, Rating, Session models)
- **Storage**: Supabase Storage for recipe images with utility class in `src/utils/supabase.ts`

### Code Organization
- **Modular Architecture**: Strictly separate routes, controllers, services, and utilities
- **API Versioning**: All endpoints under `/api/v1` prefix
- **Middleware Chain**: Error handling → CORS → Rate limiting → Authentication → Route handlers
- **Response Format**: Standardized using `createApiResponse()` helper from `src/utils/helpers.ts`

### Testing & Quality
- **Testing Framework**: Vitest with coverage reporting
- **Test Structure**: Unit tests in `tests/` directory, mirroring `src/` structure
- **Code Quality**: ESLint + Prettier configured with strict TypeScript rules
- **Validation**: Zod schemas in `src/utils/validation.ts` for all input validation

### Security Implementation
- **Authentication**: JWT tokens with role-based access control (USER, CHEF, ADMIN)
- **OAuth Integration**: Google OAuth 2.0 with @hono/oauth-providers
- **Password Security**: bcrypt hashing with configurable rounds
- **Password Reset**: Secure token-based reset with email delivery
- **Rate Limiting**: 100 requests per 15 minutes per IP (configurable)
- **Input Sanitization**: Zod validation + custom sanitization helpers
- **Session Management**: Database-stored sessions with expiration
- **CORS**: Configurable origins with credentials support
- **Email Security**: Domain validation and secure token generation

### Deployment & Scaling
- **Containerization**: Multi-stage Dockerfile optimized for Bun runtime
- **Horizontal Scaling**: Docker Compose with 3 replicas + Nginx load balancer
- **CI/CD**: GitHub Actions with testing, security scanning, and auto-deployment
- **Production**: Render deployment with future Kubernetes migration path
- **Monitoring**: Health check endpoint at `/health` with comprehensive status

## 🔌 API Endpoints Structure

### Authentication (`/api/v1/auth`)
**Status**: Core authentication implemented, OAuth and password reset needed
- `POST /register` - User registration with email verification ✅
- `POST /login` - User login with failed attempt tracking ✅
- `POST /logout` - Secure session termination ✅
- `POST /forgot-password` - Password reset token generation (TODO)
- `POST /reset-password` - Password reset with token validation (TODO)
- `GET /verify-email/:token` - Email verification (TODO)
- `GET /me` - Get current authenticated user profile ✅
- `GET /google` - Google OAuth initiation (TODO)
- `GET /google/callback` - Google OAuth callback handler (TODO)
- `POST /google/mobile` - Google OAuth for mobile apps (TODO)

**Implementation Notes**:
- Use `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema` from `src/utils/validation.ts`
- Implement in `src/controllers/authController.ts` and `src/services/authService.ts`
- Hash passwords using `hashPassword()` from `src/utils/auth.ts`
- Create JWT tokens using `generateToken()` utility
- Store sessions in database using Session model
- Google OAuth: Use `@hono/oauth-providers` with Google provider
- Password reset: Generate secure tokens, store in database with expiration
- Email service: Use Resend or Nodemailer for password reset emails

### Recipe Management (`/api/v1/recipes`)
**Status**: Placeholder routes created, implementation needed
- `GET /search` - Multi-ingredient search with priority matching
- `GET /` - Browse with filtering and sorting
- `GET /recommendations` - Personalized recommendations (trending, new, for-you)
- `GET /:id` - Recipe details with comments and ratings
- `POST /` - Submit recipe (Chef role + image upload to Supabase)
- `PUT /:id` - Update recipe (Chef role, ownership validation)
- `DELETE /:id` - Delete recipe (Chef role, ownership validation)

**Implementation Notes**:
- Use `recipeSchema` from `src/utils/validation.ts`
- Image uploads via `supabaseClient.uploadFile()` from `src/utils/supabase.ts`
- Apply `chefOrAdmin` middleware for submission endpoints
- Implement caching for trending/popular recipes
- Ensure search responds within 3 seconds for up to 10 ingredients

### Admin Management (`/api/v1/admin`)
**Status**: Placeholder routes created, protected with `adminOnly` middleware
- `GET /recipes/pending` - Pending recipes with pagination
- `POST /recipes/:id/approve` - Approve recipe, update status to APPROVED
- `POST /recipes/:id/reject` - Reject recipe with reason, update status to REJECTED
- `GET /users` - User management with filtering
- `PUT /users/:id/role` - Update user role (USER/CHEF/ADMIN)
- `GET /stats` - Platform statistics and analytics

### Community Features (`/api/v1/community`)
**Status**: Placeholder routes created, implementation needed
- `GET /recipes/:id/comments` - Get paginated comments
- `POST /recipes/:id/comments` - Add comment (authenticated users)
- `PUT /comments/:id` - Update comment (ownership validation)
- `DELETE /comments/:id` - Delete comment (owner or admin)
- `POST /recipes/:id/rating` - Rate recipe (1-5 stars, one per user)
- `GET /recipes/:id/rating` - Get user's rating for recipe
- `DELETE /recipes/:id/rating` - Remove user's rating
- `GET /recipes/:id/ratings` - Rating summary and distribution

**Implementation Notes**:
- Use `commentSchema` and `ratingSchema` from validation
- Auto-recalculate average rating on rating changes
- Ensure unique constraint: one rating per user per recipe
- Sanitize comment content for security

## Coding Style
- Do **NOT** use class-based patterns unless strictly required.
- Hono code should follow its idiomatic style:
  - Define routes directly with `app.get`, `app.post`, etc.
  - Group logic using functions and separate files (services, routes, utils).
  - Use simple function exports instead of classes for controllers.


## 🚀 Implementation Guidelines

### Database Schema (Prisma)
**Status**: Complete schema implemented in `prisma/schema.prisma`
- **User Model**: Includes role-based permissions, email verification, failed login tracking
- **Recipe Model**: Comprehensive fields with status management (PENDING/APPROVED/REJECTED)
- **Comment & Rating Models**: Full community engagement support
- **Session Model**: Secure session management with expiration

### Utility Functions Available
**Authentication** (`src/utils/auth.ts`):
- `hashPassword(password)` - bcrypt password hashing
- `comparePassword(password, hash)` - password verification
- `generateToken(user)` - JWT token creation
- `verifyToken(token)` - JWT token validation

**Database** (`src/utils/database.ts`):
- `prisma` - Configured Prisma client singleton

**Supabase Storage** (`src/utils/supabase.ts`):
- `supabaseClient.uploadFile(file, fileName, folder)` - File upload
- `supabaseClient.deleteFile(filePath)` - File deletion
- `supabaseClient.getPublicUrl(filePath)` - Get public URL

**Helpers** (`src/utils/helpers.ts`):
- `createApiResponse(status, data, message, errors)` - Standardized responses
- `createPaginationParams(page, limit)` - Pagination handling
- `createPaginatedResponse(data, total, pagination)` - Paginated responses

**Validation** (`src/utils/validation.ts`):
- Zod schemas for all endpoints: `registerSchema`, `loginSchema`, `recipeSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, etc.

**Email Service** (`src/utils/email.ts`):
- `sendEmail(to, subject, content)` - Email delivery via Resend/Nodemailer
- `sendPasswordResetEmail(email, token)` - Password reset email template
- `sendVerificationEmail(email, token)` - Email verification template

**OAuth Utilities** (`src/utils/oauth.ts`):
- `googleOAuth` - Google OAuth provider configuration
- `handleOAuthCallback(code, state)` - OAuth callback processing
- `createOrUpdateOAuthUser(profile)` - User creation/update from OAuth data

### Middleware Stack
**Applied in order** (`src/index.ts`):
1. `logger()` - Request logging
2. `prettyJSON()` - JSON formatting
3. `errorHandler` - Global error handling
4. `cors()` - CORS configuration
5. `rateLimitMiddleware()` - Rate limiting (100 req/15min)
6. `authMiddleware` - JWT authentication (protected routes)
7. `adminOnly` / `chefOrAdmin` - Role-based authorization

### Development Workflow
1. **Start Development**: `bun run dev` (with hot reload)
2. **Database Changes**: Update `prisma/schema.prisma` → `bun run db:push`
3. **Testing**: `bun run test` or `bun run test:coverage`
4. **Code Quality**: `bun run lint` and `bun run format`
5. **Docker Testing**: `bun run docker:build && bun run docker:run`

### Performance Requirements
- **Response Time**: All endpoints must respond within 2-5 seconds
- **Concurrency**: Support 1,000+ concurrent users (achieved via Docker replicas + Nginx)
- **Search Performance**: Recipe search with up to 10 ingredients in <3 seconds
- **Caching**: Implement caching for trending/popular recipes
- **Database Optimization**: Use Prisma's built-in query optimization and indexing

### Security Checklist
- ✅ **Input Validation**: Zod schemas for all endpoints
- ✅ **Authentication**: JWT with configurable expiration
- ✅ **Authorization**: Role-based access control (USER/CHEF/ADMIN)
- ✅ **Rate Limiting**: Configurable per-IP limits
- ✅ **Password Security**: bcrypt with configurable rounds
- ✅ **Session Management**: Database-stored sessions with expiration
- ✅ **CORS**: Configurable allowed origins
- ⚠️ **Input Sanitization**: Implement in controllers (TODO)
- ⚠️ **SQL Injection Prevention**: Use Prisma ORM (inherent protection)

### CI/CD Pipeline Status
**Configured** (`.github/workflows/ci-cd.yml`):
- ✅ **Testing**: Unit tests with coverage reporting
- ✅ **Linting**: ESLint + Prettier checks
- ✅ **Security**: Trivy vulnerability scanning
- ✅ **Build**: Docker image creation
- ✅ **Deploy**: Automatic deployment to Render on main branch
- ✅ **Notifications**: Slack integration for deployment status

### Deployment Configuration
**Current**: Render deployment ready (`render.yaml`)
**Scaling**: Docker Compose with 3 replicas + Nginx load balancer
**Future**: Kubernetes migration path documented in README.md

## 📋 Next Implementation Priorities

1. **Password Reset System** - Implement secure token-based password reset with email delivery
2. **Google OAuth Integration** - Implement OAuth 2.0 authentication flow
3. **Email Verification** - Implement email verification system
4. **Recipe Search** - High-performance multi-ingredient search
5. **File Upload Handler** - Image processing and Supabase integration
6. **Recipe Approval Workflow** - Admin management system
7. **Community Features** - Comments and ratings system
8. **Performance Optimization** - Caching and database indexing
9. **Monitoring & Logging** - Enhanced observability
