# FitRecipes Backend

A modern, scalable backend API for the FitRecipes healthy recipes web application, built with **Hono.js**, **TypeScript**, **Bun runtime**, **Prisma ORM**, and **Supabase**.

## 🚀 Tech Stack

- **Runtime**: Bun
- **Framework**: Hono.js with TypeScript
- **Database**: PostgreSQL (Supabase hosted)
- **ORM**: Prisma
- **Storage**: Supabase Storage
- **Authentication**: JWT
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose
- **Deployment**: Render (with Kubernetes migration path)
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
src/
├── routes/           # API route definitions
│   ├── auth.ts      # Authentication endpoints
│   ├── recipe.ts    # Recipe CRUD operations
│   ├── admin.ts     # Admin management endpoints
│   └── community.ts # Comments and ratings
├── controllers/      # Request handlers
├── services/        # Business logic layer
├── middlewares/     # Custom middleware
│   ├── auth.ts      # Authentication & authorization
│   ├── rateLimit.ts # Rate limiting
│   └── common.ts    # CORS, error handling
├── models/          # Prisma schema
├── utils/           # Utility functions
│   ├── database.ts  # Prisma client
│   ├── supabase.ts  # Storage operations
│   ├── auth.ts      # JWT & password utilities
│   └── helpers.ts   # Common helpers
├── types/           # TypeScript definitions
└── index.ts         # Application entry point

tests/               # Test files
├── utils/          # Unit tests for utilities
└── setup.ts        # Test configuration

prisma/
└── schema.prisma   # Database schema

.github/
└── workflows/      # CI/CD pipelines
```

## 🚦 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Docker](https://www.docker.com/) (optional, for containerization)
- [Supabase](https://supabase.com/) account

### 1. Clone and Install

```bash
git clone https://github.com/NinePTH/FitRecipes-Backend.git
cd FitRecipes-Backend
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Configure your `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=recipe-images

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3001
```

### 3. Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# (Optional) Open Prisma Studio
bun run db:studio
```

### 4. Development Server

```bash
# Start development server with hot reload
bun run dev

# The API will be available at:
# Health check: http://localhost:3000/health
# API base: http://localhost:3000/api/v1
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests with UI
bun run test:ui

# Run specific test file
bun test tests/utils/helpers.test.ts
```

## 🎯 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation
- `GET /verify-email/:token` - Email verification
- `GET /me` - Get current user profile

### Recipes (`/api/v1/recipes`)
- `GET /search` - Search recipes by ingredients
- `GET /` - Browse and filter recipes
- `GET /recommendations` - Get personalized recommendations
- `GET /:id` - Get recipe details
- `POST /` - Submit new recipe (Chef only)
- `PUT /:id` - Update recipe (Chef only, own recipes)
- `DELETE /:id` - Delete recipe (Chef only, own recipes)

### Community (`/api/v1/community`)
- `GET /recipes/:id/comments` - Get recipe comments
- `POST /recipes/:id/comments` - Add comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment
- `POST /recipes/:id/rating` - Rate recipe
- `GET /recipes/:id/rating` - Get user's rating
- `DELETE /recipes/:id/rating` - Remove rating
- `GET /recipes/:id/ratings` - Get ratings summary

### Admin (`/api/v1/admin`)
- `GET /recipes/pending` - Get pending recipes
- `POST /recipes/:id/approve` - Approve recipe
- `POST /recipes/:id/reject` - Reject recipe
- `GET /users` - Get users list
- `PUT /users/:id/role` - Update user role
- `GET /stats` - Get platform statistics

## 🔒 Authentication & Authorization

- **JWT-based authentication** with configurable expiration
- **Role-based access control** (USER, CHEF, ADMIN)
- **Rate limiting** to prevent abuse
- **Password hashing** with bcrypt
- **Session management** with token validation

## 📊 Performance Features

- **Rate limiting**: 100 requests per 15 minutes per IP
- **Response caching** for popular/trending recipes
- **Database indexing** for optimized queries
- **Scaling ready** architecture with Docker Compose for future migration
- **Health check endpoints** for monitoring

## 🔧 Code Quality

```bash
# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:check
```

## 🐳 Docker Deployment

### Local Development

```bash
# Build and run with Docker Compose
bun run docker:build
bun run docker:run

# Stop services
bun run docker:down
```

### Production Build

```bash
# Build production image
docker build -t fitrecipes-backend .

# Run production container
docker run -p 3000:3000 --env-file .env fitrecipes-backend
```

## 🚀 Deployment

### Render Deployment

1. **Connect Repository**: Link your GitHub repository to Render
2. **Environment Variables**: Configure environment variables in Render dashboard
3. **Database**: Use Supabase PostgreSQL (recommended) or Render PostgreSQL
4. **Storage**: Configure Supabase Storage bucket
5. **Deploy**: Controlled deployment via GitHub Actions CI/CD pipeline

### Future Kubernetes Migration

The application is designed for easy migration to Kubernetes:

```yaml
# Example Kubernetes deployment (k8s/deployment.yaml)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fitrecipes-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fitrecipes-backend
  template:
    metadata:
      labels:
        app: fitrecipes-backend
    spec:
      containers:
      - name: backend
        image: fitrecipes-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 🔄 CI/CD Pipeline

Our GitHub Actions workflow provides a **robust, fail-safe deployment process** that ensures only high-quality code reaches production.

### 📋 Pipeline Overview

The CI/CD pipeline runs on **every push** and **pull request** to `main` and `develop` branches. It consists of 4 sequential jobs that must ALL pass before deployment:

```
Code Push → [Test] → [Build] → [Security] → [Deploy] → Production ✅
     ↓        ❌       ❌        ❌         ❌
   Failed? → STOP → No Deployment → Production Safe 🛡️
```

### 🔍 Detailed Process Steps

#### 1. **Test & Quality Checks** (`test` job)
**What happens:**
- Sets up Ubuntu environment with PostgreSQL test database
- Installs Bun runtime and project dependencies
- Runs comprehensive quality checks:
  - **Linting** (`bun run lint`) - Code style and potential errors
  - **TypeScript Check** (`bun run type-check`) - Type safety validation
  - **Format Check** (`bun run format:check`) - Code formatting consistency
  - **Unit Tests** (`bun run test`) - Functionality and logic verification

**If this fails:**
- ❌ **No deployment happens** - production is protected
- ⚠️ **What to check:**
  - Run `bun run lint` locally to see linting errors
  - Run `bun run type-check` to find TypeScript issues
  - Run `bun run test` to identify failing tests
  - Check the GitHub Actions logs for specific error details

#### 2. **Build & Compilation** (`build` job)
**What happens:**
- Generates Prisma client from schema
- Compiles TypeScript to JavaScript (`bun run build`)
- Creates Docker image for containerization
- Validates the application can be built successfully

**If this fails:**
- ❌ **No deployment happens** - production is protected
- ⚠️ **What to check:**
  - Run `bun run build` locally to see build errors
  - Check for missing dependencies in `package.json`
  - Verify Prisma schema is valid (`bun run db:generate`)
  - Ensure Docker builds locally (`docker build -t test .`)

#### 3. **Security Scanning** (`security` job)
**What happens:**
- Runs Trivy vulnerability scanner on the codebase
- Scans for known security vulnerabilities in dependencies
- Checks for sensitive data exposure
- Validates security best practices

**If this fails:**
- ❌ **No deployment happens** - production is protected
- ⚠️ **What to check:**
  - Review security scan results in GitHub Actions logs
  - Update vulnerable dependencies: `bun update`
  - Remove any accidentally committed secrets
  - Check `.gitignore` includes sensitive files

#### 4. **Safe Deployment** (`deploy` job) - **Main Branch Only**
**What happens:**
- **Only triggers** on successful push to `main` branch
- Requires ALL previous jobs to pass first
- Uses controlled Render API deployment (not auto-deploy)
- Performs health checks and endpoint verification
- Provides detailed deployment feedback

**Deployment Process:**
1. **Pre-deployment validation** - Confirms all checks passed
2. **Controlled API deployment** - Triggers Render deployment via API
3. **Health monitoring** - Waits 90 seconds for service restart
4. **Health checks** - Verifies `/health` endpoint responds
5. **API verification** - Tests core API endpoints
6. **Success confirmation** - Provides live app URLs

**If deployment fails:**
- ❌ **Previous version remains live** - no broken deployments
- ⚠️ **What to check:**
  - Verify GitHub secrets are set correctly:
    - `RENDER_SERVICE_ID` (srv-xxxxx...)
    - `RENDER_API_KEY` (rnd_xxxxx...)
    - `RENDER_APP_URL` (https://your-app.onrender.com)
  - Check Render service logs in dashboard
  - Verify environment variables in Render
  - Test health endpoint manually

### 🚨 Troubleshooting Guide

#### **"Tests are failing"**
```bash
# Run tests locally to see failures
bun run test

# Check test coverage
bun run test:coverage

# Fix failing tests and commit
git add .
git commit -m "fix: resolve failing tests"
git push
```

#### **"Linting errors"**
```bash
# See linting issues
bun run lint

# Auto-fix most issues
bun run lint:fix

# Check formatting
bun run format:check

# Auto-format code
bun run format

# Commit fixes
git add .
git commit -m "fix: resolve linting issues"
git push
```

#### **"TypeScript errors"**
```bash
# Check type errors
bun run type-check

# Fix type issues in your IDE
# Common fixes:
# - Add proper type annotations
# - Fix import statements
# - Update interface definitions

# Commit fixes
git add .
git commit -m "fix: resolve TypeScript errors"
git push
```

#### **"Build is failing"**
```bash
# Test build locally
bun run build

# Common issues:
# - Missing dependencies: bun install
# - Prisma client: bun run db:generate
# - Environment variables: check .env

# Test Docker build
docker build -t test-build .

# Commit fixes
git add .
git commit -m "fix: resolve build issues"
git push
```

#### **"Deployment failed"**
1. **Check GitHub Secrets** (Settings → Secrets → Actions):
   - `RENDER_SERVICE_ID`: Find in Render URL (srv-xxxxx...)
   - `RENDER_API_KEY`: Create in Render Account Settings
   - `RENDER_APP_URL`: Your app's public URL

2. **Check Render Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Check service logs for errors
   - Verify environment variables are set
   - Ensure service is running

3. **Manual Health Check**:
   ```bash
   # Test your deployed app
   curl https://your-app.onrender.com/health
   ```

### 🛡️ Safety Features

#### **Fail-Safe Design**
- **No broken deployments**: If ANY step fails, deployment stops
- **Production protection**: Only `main` branch can deploy
- **Controlled deployment**: Uses API, not auto-deploy
- **Health verification**: Confirms app is working before marking success

#### **Quality Gates**
- **Code Quality**: Linting and formatting enforcement
- **Type Safety**: TypeScript strict mode validation
- **Test Coverage**: Unit test requirements
- **Security**: Vulnerability scanning
- **Build Validation**: Compilation and Docker build verification

#### **Monitoring & Feedback**
- **Detailed logs**: Every step provides clear output
- **Failure isolation**: Know exactly which step failed
- **Success confirmation**: Clear deployment success indicators
- **Health monitoring**: Automated endpoint verification

### 🔧 Quick Fixes for Common Issues

**Pipeline is red? Here's your checklist:**

1. **Check the failed job** in GitHub Actions
2. **Run the same command locally**:
   - Test: `bun run test`
   - Lint: `bun run lint`
   - Type: `bun run type-check`
   - Build: `bun run build`
3. **Fix the issue** in your code
4. **Commit and push** the fix
5. **Watch the pipeline turn green** ✅

**Need help?** Check the detailed logs in GitHub Actions - they show exactly what failed and why!

## 📈 Monitoring & Scaling

### Health Checks

- `GET /health` - Application health status
- Database connectivity check
- Supabase service availability

### Scaling Configuration

**Current Deployment (Render):**
- **Single Instance** - Render Starter Plan runs one instance
- **Vertical Scaling** - Upgrade plan for more CPU/RAM (Standard, Pro, Pro Plus)
- **Horizontal Scaling** - Available on Pro+ plans (multiple instances + load balancer)
- **Auto-scaling** - Render can auto-scale based on CPU/memory usage (Pro+ plans)

```yaml
# render.yaml - Current production setup
services:
  - type: web
    plan: starter          # Single instance
    # plan: standard       # For vertical scaling
    # plan: pro           # For horizontal scaling (2+ instances)
```

**Docker Compose** (Local Development Only):
```yaml
# docker-compose.yml - For local testing of load balancing
deploy:
  replicas: 3              # 3 app instances
  update_config:
    parallelism: 1         # Rolling updates
    delay: 10s
```
⚠️ **Note**: Docker Compose scaling is **NOT used in production**. It's only for local development and testing load balancing scenarios.

**Future Kubernetes Migration:**
```yaml
# For when migrating from Render to Kubernetes
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
```

### Production Scaling Options

**Current (Render):**
1. **Starter Plan** - 1 instance, 0.5 CPU, 512MB RAM
2. **Standard Plan** - 1 instance, 1 CPU, 2GB RAM  
3. **Pro Plan** - Multiple instances, auto-scaling, load balancer
4. **Pro Plus Plan** - Higher performance + advanced scaling

**To Scale on Render:**
1. **Vertical Scaling**: Upgrade plan in Render Dashboard
2. **Horizontal Scaling**: Enable on Pro+ plans (automatic)
3. **Database Scaling**: Supabase handles this automatically

**Load Testing Locally:**
```bash
# Test with Docker Compose (3 replicas + Nginx)
bun run docker:build
bun run docker:run

# Access via load balancer
curl http://localhost:8080/health
```

## 🚀 Scaling Strategy & Migration Path

### Decision Matrix

| Metric | Render | VPS + Docker Compose | Kubernetes |
|--------|--------|---------------------|------------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐⭐ Complex |
| **Monthly Cost** | $7-100 | $20-200 | $200-2000+ |
| **DevOps Time** | 0 hours | 5-10 hours/week | 20+ hours/week |
| **Concurrent Users** | 0-5K | 5K-50K | 50K+ |
| **Scaling Speed** | Manual plan upgrade | Manual server resize | Automatic |
| **Downtime Risk** | Low | Medium | Very Low |

### When to Scale Up

| Stage | Users | Monthly Cost | Platform | Primary Benefits |
|-------|-------|-------------|----------|-----------------|
| **Current** | 0-5K | $7-100 | **Render** | ✅ Zero DevOps overhead, focus on features |
| **Growth** | 5K-50K | $20-200 | **VPS + Docker** | 💰 Cost optimization, custom configurations |
| **Enterprise** | 50K+ | $200-2000+ | **Kubernetes** | 🌐 Multi-region, auto-scaling, 99.9% uptime |

### Migration Triggers

**Stay on Render when:**
- Revenue < $10K/month
- Team size < 3 developers  
- Want zero DevOps overhead

**Move to Docker Compose when:**
- Render costs > $150/month consistently
- Need custom caching/monitoring
- Require specialized configurations

**Move to Kubernetes when:**
- Multiple backend services (microservices)
- Global user base requiring multi-region
- Enterprise SLA requirements (99.9% uptime)
- Dedicated DevOps team available

### Quick Migration Guide

**To VPS + Docker Compose:**
```bash
# 1. Get VPS (DigitalOcean $20/month droplet)
# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Deploy your existing config
git clone https://github.com/NinePTH/FitRecipes-Backend
cd FitRecipes-Backend
docker-compose up -d  # Uses your existing 3-replica setup
```

**Architecture is ready** - Docker Compose configuration already includes load balancing and scaling for when we need it! 🎯

## 🛡️ Security Features

- **Input sanitization** for all user inputs
- **SQL injection prevention** via Prisma ORM
- **XSS protection** with proper content sanitization
- **Rate limiting** to prevent DoS attacks
- **JWT token validation** with expiration
- **Password strength requirements**
- **Failed login attempt tracking**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write unit tests for new features
- Use conventional commit messages
- Update documentation for API changes
- Ensure all CI checks pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [FitRecipes Frontend](https://github.com/NinePTH/FitRecipes-Frontend) - React.js frontend application
- [FitRecipes Mobile](https://github.com/NinePTH/FitRecipes-Mobile) - React Native mobile app

## 📞 Support

For support and questions:

- Create an [Issue](https://github.com/YourUsername/FitRecipes-Backend/issues)
- Join our [Discord](https://discord.gg/fitrecipes)
- Email: support@fitrecipes.com

---

**Made with ❤️ by the FitRecipes Team**