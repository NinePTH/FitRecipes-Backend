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
**Status**: ✅ COMPLETE - All authentication features fully implemented and tested
- `POST /register` - User registration with email verification ✅
- `POST /login` - User login with failed attempt tracking ✅
- `POST /logout` - Secure session termination ✅
- `POST /forgot-password` - Password reset token generation ✅
- `POST /reset-password` - Password reset with token validation ✅
- `GET /verify-email/:token` - Email verification endpoint ✅
- `POST /resend-verification` - Resend verification email ✅
- `GET /me` - Get current authenticated user profile ✅
- `GET /google` - Google OAuth initiation ✅
- `GET /google/callback` - Google OAuth callback handler ✅
- `POST /google/mobile` - Google OAuth for mobile apps ✅
- `POST /terms/accept` - Accept Terms of Service (OAuth users) ✅
- `POST /terms/decline` - Decline Terms of Service and logout (OAuth users) ✅

**Implementation Details**:
- Uses `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema` from `src/utils/validation.ts`
- Implemented in `src/controllers/authController.ts` and `src/services/authService.ts`
- Passwords hashed using `hashPassword()` from `src/utils/auth.ts` with configurable bcrypt rounds
- JWT tokens created using `generateToken()` utility with 24-hour expiration
- Sessions stored in database with automatic expiration handling
- **Google OAuth**: Implemented with `@hono/oauth-providers` using authorization code flow
  - Supports account linking for existing email users
  - Creates OAuth users with `emailVerified: true` automatically
  - Stores `googleId` and `oauthProvider` in User model
  - CSRF protection via state parameter validation
  - OAuth users can optionally set password later for dual authentication
- **Password Reset**: Secure 32-character random tokens with 1-hour expiration
- **Email Verification**: Secure 32-character random tokens with 24-hour expiration
  - Sent automatically after registration
  - Resend functionality available
  - Token-based verification via GET endpoint
  - Frontend integration guide: `docs/EMAIL_VERIFICATION_GUIDE.md`
- **Terms of Service**: OAuth users must accept ToS after first login
  - OAuth users created with `termsAccepted: false`
  - POST `/terms/accept` - Marks user as accepted
  - POST `/terms/decline` - Logs user out immediately
  - Frontend should check `isOAuthUser && !termsAccepted` and redirect to ToS page
- **Email Service**: Configured with Resend (development mode logs to console)

### Recipe Management (`/api/v1/recipes`)
**Status**: ✅ PARTIAL - Submission and approval implemented
- `POST /` - Submit recipe (Chef role) ✅ COMPLETE
- `GET /:id` - Recipe details with ratings and authorization checks ✅ COMPLETE
- ⏳ `GET /search` - Multi-ingredient search with priority matching (TODO)
- ⏳ `GET /` - Browse with filtering and sorting (TODO)
- ⏳ `GET /recommendations` - Personalized recommendations (TODO)
- ⏳ `PUT /:id` - Update recipe (Chef role, ownership validation) (TODO)
- ⏳ `DELETE /:id` - Delete recipe (Chef role, ownership validation) (TODO)

**Implementation Details**:
- **Recipe Submission** (`POST /`):
  - Uses comprehensive `recipeSchema` from `src/utils/validation.ts` with nested validation
  - Ingredients stored as Json array: `[{name, amount, unit}]`
  - Optional `dietaryInfo` (isVegetarian, isVegan, isGlutenFree, isDairyFree) as Json
  - Optional `nutritionInfo` (calories, protein, carbs, fat, fiber) as Json
  - Requires `chefOrAdmin` middleware - only CHEF and ADMIN roles can submit
  - Creates recipe with `PENDING` status for admin review
  - Returns 201 with full recipe including author information
  
- **Recipe Detail View** (`GET /:id`):
  - Authorization-based visibility:
    * `PENDING` recipes: Only author and admins can view
    * `REJECTED` recipes: Only author can view (with rejection reason)
    * `APPROVED` recipes: All authenticated users can view
  - Includes author information and ratings with reviewer names
  - Returns 403 if user lacks permission, 404 if not found
  
- **Implemented in**:
  - Service: `src/services/recipeService.ts` (submitRecipe, getRecipeById)
  - Controller: `src/controllers/recipeController.ts` (submitRecipe, getRecipeById)
  - Routes: `src/routes/recipe.ts` (POST /, GET /:id)
  - Tests: `tests/services/recipeService.test.ts` (9 tests covering authorization logic)

**Future Implementation Notes**:
- Image uploads via `supabaseClient.uploadFile()` from `src/utils/supabase.ts`
- Implement caching for trending/popular recipes
- Ensure search responds within 3 seconds for up to 10 ingredients

### Admin Management (`/api/v1/admin`)
**Status**: ✅ PARTIAL - Recipe approval system implemented
- `GET /recipes/pending` - Pending recipes with pagination ✅ COMPLETE
- `PUT /recipes/:id/approve` - Approve recipe, update status to APPROVED ✅ COMPLETE
- `PUT /recipes/:id/reject` - Reject recipe with reason, update status to REJECTED ✅ COMPLETE
- ⏳ `GET /users` - User management with filtering (TODO)
- ⏳ `PUT /users/:id/role` - Update user role (USER/CHEF/ADMIN) (TODO)
- ⏳ `GET /stats` - Platform statistics and analytics (TODO)

**Implementation Details**:
- **Recipe Approval Workflow**:
  - Service: `src/services/recipeService.ts` (getPendingRecipes, approveRecipe, rejectRecipe)
  - Controller: `src/controllers/recipeController.ts` (getPendingRecipes, approveRecipe, rejectRecipe)
  - Routes: `src/routes/admin.ts` (GET /recipes/pending, PUT /recipes/:id/approve, PUT /recipes/:id/reject)
  - All routes protected with `authMiddleware` + `adminOnly` middleware
  - Pending recipes returned with pagination (page, limit, sortBy, sortOrder)
  - Approval stores adminId, timestamp, and optional adminNote
  - Rejection stores adminId, timestamp, and required rejectionReason (10-500 chars)
  - Tests: `tests/services/recipeService.test.ts` (covering approval/rejection logic)

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
- ✅ **SQL Injection Prevention**: Prisma ORM (inherent protection)
- ⚠️ **Input Sanitization**: Additional sanitization in controllers (TODO)

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

1. ~~**Password Reset System**~~ ✅ COMPLETE
2. ~~**Google OAuth Integration**~~ ✅ COMPLETE  
3. ~~**Email Verification System**~~ ✅ COMPLETE
4. ~~**Recipe Submission & Detail View**~~ ✅ COMPLETE
5. ~~**Recipe Approval Workflow**~~ ✅ COMPLETE
6. **Recipe Search** - High-performance multi-ingredient search
7. **Recipe Browse** - Filtering, sorting, and pagination
8. **File Upload Handler** - Image processing and Supabase integration
9. **Community Features** - Comments and ratings system
10. **Performance Optimization** - Caching and database indexing
11. **Monitoring & Logging** - Enhanced observability

## 🔐 Security Features Implemented

### Password Reset Flow
- Secure 32-character random token generation
- 1-hour token expiration
- Automatic account unblocking on password reset
- Failed login attempt counter reset
- Email delivery via Resend (development mode logs to console)

### OAuth Security
- CSRF protection via state parameter validation
- Authorization code flow (not implicit)
- Secure token exchange with Google API
- Account linking prevents duplicate users
- OAuth users bypass email verification (trusted by Google)

### Session Management
- Database-stored sessions with 24-hour expiration
- Automatic cleanup of expired sessions
- Token invalidation on logout
- Session validation on protected routes

### Account Protection
- Maximum 5 failed login attempts
- 15-minute account lockout after 5 failures
- Automatic attempt counter reset on successful login
- Automatic unblocking on password reset

## 📧 Email Service Configuration

**Current Setup**: Development mode (console logging)  
**Production Ready**: Resend integration configured

**Email Templates Available**:
- Password reset email with secure token link ✅
- Email verification email with secure token link ✅
- Welcome email (optional, TODO)

**Configuration**:
```bash
# Development (current)
RESEND_API_KEY=  # Empty = logs to console

# Production
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

**Email Utility** (`src/utils/email.ts`):
- `sendEmail(to, subject, htmlContent)` - Base email sender
- `sendPasswordResetEmail(email, resetToken)` - Password reset template
- Automatic fallback to console logging in development
- Beautiful HTML email templates with styling

## 🧪 Testing Coverage

**Current Status**: 59 tests passing with comprehensive coverage

**Test Structure**:
```
tests/
├── services/
│   ├── authService.test.ts      ✅ 10 tests (registration, login, OAuth, password reset)
│   └── recipeService.test.ts    ✅ 9 tests (submit, getById, approve, reject, pagination)
├── controllers/
│   └── authController.test.ts   ✅ 14 tests (all endpoints, error handling)
├── utils/
│   └── helpers.test.ts          ✅ 7 tests (API response formatting, pagination)
└── integration/
    └── auth.integration.test.ts ✅ 19 tests (complete auth integration flows)
```

**Integration Test Coverage** (auth.integration.test.ts):
- **Complete Registration Flow** (5 tests): Success case, duplicate email, terms validation, email validation, password length
- **Complete Login Flow** (5 tests): Success case, wrong password, non-existent user, account locking, locked account rejection
- **Logout Flow** (1 test): Session deletion
- **Password Reset Flow** (5 tests): Token generation, silent non-existent email, valid reset, expired token, invalid token
- **Security Features** (3 tests): Password hashing, session expiration, failed attempt reset

**Testing Stack**:
- Framework: Vitest with coverage reporting
- Mocking: `vi.mock()` for Prisma and external services
- Integration: Tests verify controller → service → database layer interactions
- Coverage: High coverage on auth and recipe features
- CI/CD: Tests run automatically on all PRs

**Run Tests**:
```bash
bun run test              # Run all tests
bun run test:coverage     # With coverage report
bun run test:watch        # Watch mode for development
```

## 🐳 Docker & Deployment Configuration

### Multi-Stage Dockerfile
- **Base stage**: Bun runtime with OpenSSL for Prisma
- **Dependencies stage**: Frozen lockfile installation
- **Build stage**: Prisma generation + TypeScript compilation
- **Production stage**: Minimal runtime image with non-root user

**CRITICAL**: OpenSSL must be installed in Docker image for Prisma to work:
```dockerfile
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*
```

### Database Migrations
- **CRITICAL**: Use `prisma migrate deploy` NOT `prisma db push` in production
- **Migrations MUST be committed to git** (never add to .gitignore)
- Docker entrypoint (`docker-entrypoint.sh`) runs migrations automatically before app start
- Deployment fails safely if migrations have errors
- Migration files are version-controlled SQL in `prisma/migrations/`

**When Schema Changes**:
```bash
# 1. Update prisma/schema.prisma
# 2. Create migration
bun run db:migrate -- --name descriptive_name
# 3. Review generated SQL
# 4. Commit migration files to git
git add prisma/migrations/ prisma/schema.prisma
git commit -m "feat: add new feature with migration"
git push
```

### Staging Environment
- Separate `develop` branch deploys to staging (FREE tier on Render)
- Backend URL: `https://fitrecipes-backend-staging.onrender.com`
- Frontend: No staging frontend yet (uses localhost for development)
- Uses same Docker configuration as production
- Automatic deployment via GitHub Actions
- Spins down after 15 minutes of inactivity (acceptable for staging)
- Separate `RENDER_STAGING_SERVICE_ID` secret in GitHub

## 📦 Required Environment Variables

### Database
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/dbname  # For migrations
```

### Authentication
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

### Google OAuth
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://your-app.com/api/v1/auth/google/callback
```

### Email Service (Optional - defaults to console)
```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

### Supabase Storage
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_BUCKET_NAME=recipe-images
```

### Application
```bash
NODE_ENV=development  # development | staging | production
PORT=3000

# Development
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Staging (on Render FREE tier)
# BACKEND_URL=https://fitrecipes-backend-staging.onrender.com
# FRONTEND_URL=http://localhost:5173  # No staging frontend yet
# CORS_ORIGIN=http://localhost:5173

# Production
# BACKEND_URL=https://fitrecipes-backend.onrender.com
# FRONTEND_URL=https://fitrecipes.vercel.app
# CORS_ORIGIN=https://fitrecipes.vercel.app
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Deployment Workflow

### Branch Strategy
- `main` → Production deployment (Render)
- `develop` → Staging deployment (Render FREE tier)
- Feature branches → Local development only

### Automatic Deployment Process
1. Push to `develop` or `main`
2. GitHub Actions triggers:
   - Run tests (must pass)
   - Run linting (must pass)
   - Type checking
   - Security scan with Trivy
   - Build Docker image
3. Render automatically deploys:
   - Pulls latest code from GitHub
   - Builds Docker image
   - Runs `docker-entrypoint.sh`:
     - Executes `prisma migrate deploy`
     - Syncs database schema with migrations
   - Starts application
4. Health check validates deployment at `/health`

### Manual Deployment (if needed)
```bash
# Production
git push origin main

# Staging
git push origin develop
```

### Rollback (if deployment fails)
```bash
# Revert to previous commit
git revert HEAD
git push origin main  # or develop
```

## 🚨 Known Issues & Troubleshooting

### Prisma OpenSSL Warning
```
prisma:warn Prisma failed to detect the libssl/openssl version
```
**Solution**: Install OpenSSL in Dockerfile (already implemented in base and production stages)

### "No migration found" Error
**Cause**: Migrations folder not in git (wrong .gitignore config)  
**Solution**: Never add `prisma/migrations/` to .gitignore - migrations MUST be version controlled  
**Details**: See `docs/MIGRATIONS_MUST_BE_IN_GIT.md`

### OAuth User Login with Password
**Behavior**: OAuth users trying traditional login get clear error message  
**Error**: "This account is linked to Google. Please use 'Sign in with Google' instead."  
**Expected**: This is intentional UX to guide users to correct login method

### Free Tier Cold Starts (Staging)
**Behavior**: First request after 15 minutes takes 30-50 seconds  
**Expected**: This is normal for Render's free tier - acceptable for staging environment

### CORS Issues
**Solution**: Ensure `CORS_ORIGIN` in .env matches your frontend URL exactly  
**Check**: Verify the CORS middleware configuration in `src/index.ts`

### Database Migration Fails

**Error P3005**: "The database schema is not empty"  
**Cause**: Database has tables from `prisma db push`, but no migration history  
**Solution**: Baseline the existing migration to mark it as applied  
**Command**: `bunx prisma migrate resolve --applied "20251002145615_initial_schema"`  
**Details**: See `docs/FIX_STAGING_MIGRATION_BASELINE.md` for step-by-step guide

**Error**: "No migration found in prisma/migrations"  
**Cause**: Migrations folder not in git (wrong .gitignore config)  
**Solution**: Never add `prisma/migrations/` to .gitignore - migrations MUST be version controlled  
**Details**: See `docs/MIGRATIONS_MUST_BE_IN_GIT.md`

## 📚 Documentation Structure

### Essential Guides (in `docs/`):
- **`AUTHENTICATION_GUIDE.md`** - Complete auth implementation (email/password, OAuth, email verification, ToS)
- **`DEPLOYMENT_GUIDE.md`** - Full deployment guide (Render, Docker, CI/CD, migrations)
- **`EMAIL_VERIFICATION_GUIDE.md`** - Email verification setup and frontend integration
- **`MIGRATIONS_GUIDE.md`** - Prisma migrations workflow and troubleshooting

### Quick References:
- **`DEPLOYMENT_URLS.md`** - Quick deployment URLs reference

### Troubleshooting:
- **`FIX_STAGING_MIGRATION_BASELINE.md`** - Fix P3005 database migration error
- **`MIGRATIONS_MUST_BE_IN_GIT.md`** - Why migrations must be version controlled

## 🔑 Key Implementation Notes

### Authentication Response Format (ALL endpoints)
All auth endpoints (`/register`, `/login`, `/me`, `/google/callback`) return consistent format:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "user|chef|admin",
      "termsAccepted": boolean,  // ToS acceptance status
      "isOAuthUser": boolean      // OAuth vs email/password user
    },
    "token": "jwt-token"
  }
}
```

### Terms of Service Flow (OAuth Users)
- OAuth users created with `termsAccepted: false`
- Must accept ToS via `/auth/terms/accept` after first login
- Frontend should check `isOAuthUser && !termsAccepted` and redirect to ToS page
- Declining ToS logs user out immediately

### Email Verification
- Verification email sent automatically after registration (async)
- Users can login before verifying (verification not required)
- Token expires after 24 hours
- Resend endpoint available: `/auth/resend-verification`

### Database Migrations - CRITICAL
- **NEVER add `prisma/migrations/` to .gitignore** - migrations MUST be in git
- Use `prisma migrate deploy` in production (not `prisma db push`)
- Docker entrypoint runs migrations automatically before app starts
- Schema changes: `bun run db:migrate -- --name description` then commit migration files
