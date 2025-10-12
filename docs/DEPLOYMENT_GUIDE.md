# Complete Deployment Guide

## 📋 Deployment Overview

FitRecipes Backend is deployed on **Render** with two environments:
- **Production** (`main` branch) - https://fitrecipes-backend.onrender.com
- **Staging** (`develop` branch) - https://fitrecipes-backend-staging.onrender.com (FREE tier)

---

## 🌐 Deployment URLs

### Production Environment
- **Backend**: https://fitrecipes-backend.onrender.com
- **Frontend**: https://fitrecipes.vercel.app (planned)
- **Health Check**: https://fitrecipes-backend.onrender.com/health
- **API Base**: https://fitrecipes-backend.onrender.com/api/v1

### Staging Environment
- **Backend**: https://fitrecipes-backend-staging.onrender.com
- **Frontend**: http://localhost:5173 (development only)
- **Health Check**: https://fitrecipes-backend-staging.onrender.com/health
- **API Base**: https://fitrecipes-backend-staging.onrender.com/api/v1

### Local Development
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api/v1

---

## 🚀 Quick Deployment

### Deploy to Staging
```bash
git checkout develop
git add .
git commit -m "feat: your changes"
git push origin develop
```

### Deploy to Production
```bash
git checkout main
git merge develop
git push origin main
```

**Automatic Process**:
1. GitHub Actions runs tests & linting
2. Render detects push and starts deployment
3. Docker image built
4. Database migrations applied
5. Health check validates deployment

---

## 🔧 Environment Configuration

### Required Environment Variables

All environments need these variables configured in Render dashboard:

#### Database (Supabase)
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/dbname  # For migrations
```

#### Authentication
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://your-backend.com/api/v1/auth/google/callback
```

#### Email Service (Optional - defaults to console in dev)
```bash
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Supabase Storage
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_BUCKET_NAME=recipe-images
```

#### Application Settings
```bash
NODE_ENV=production  # or staging
PORT=3000
BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📦 Database Migrations

### CRITICAL: Migrations Must Be in Git

**⚠️ NEVER add `prisma/migrations/` to .gitignore!**

Migrations MUST be version-controlled because:
- Render deployment uses `prisma migrate deploy` (requires migration history)
- Without migrations, deployment fails with "No migration found" error
- Team members need migration history for database schema sync

### Making Schema Changes

```bash
# 1. Update prisma/schema.prisma
# Add your changes...

# 2. Create migration
bun run db:migrate -- --name descriptive_name

# 3. Review generated SQL in prisma/migrations/
# Verify the migration looks correct

# 4. Commit migration files to git
git add prisma/migrations/ prisma/schema.prisma
git commit -m "feat: add new feature with migration"
git push
```

### Migration Commands

```bash
# Development - Create and apply migration
bun run db:migrate -- --name my_migration

# Production - Apply existing migrations only
bunx prisma migrate deploy

# Check migration status
bunx prisma migrate status

# Reset database (DEV ONLY - destroys data!)
bunx prisma migrate reset
```

### Fixing Migration Issues

#### Error: "No migration found in prisma/migrations"
**Cause**: Migrations not in git  
**Solution**: Never add migrations to .gitignore, commit them

#### Error P3005: "Database schema is not empty"
**Cause**: Database has tables but no migration history  
**Solution**: Baseline existing migration

```bash
# Mark the initial migration as applied
bunx prisma migrate resolve --applied "20251002145615_initial_schema"
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t fitrecipes-backend .
```

### Run with Docker Compose
```bash
# Start with 3 replicas + Nginx load balancer
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Configuration

**Multi-stage Dockerfile**:
- Base: Bun runtime + OpenSSL (required for Prisma)
- Dependencies: Install packages
- Build: Generate Prisma client + compile TypeScript
- Production: Minimal runtime image

**Important**: OpenSSL MUST be installed for Prisma to work:
```dockerfile
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Triggers**: Push to `main` or `develop`

**Steps**:
1. ✅ Checkout code
2. ✅ Setup Bun runtime
3. ✅ Install dependencies
4. ✅ Run tests (`bun run test`)
5. ✅ Run linter (`bun run lint`)
6. ✅ Type check
7. ✅ Security scan (Trivy)
8. ✅ Build Docker image
9. ✅ Deploy to Render (automatic)

**Configuration**: `.github/workflows/ci-cd.yml`

### GitHub Secrets Required

```bash
RENDER_SERVICE_ID          # Production service ID
RENDER_STAGING_SERVICE_ID  # Staging service ID
RENDER_API_KEY            # Render API key for deployments
```

---

## ✅ Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`bun run test`)
- [ ] Linting clean (`bun run lint`)
- [ ] Environment variables configured in Render
- [ ] Database migrations committed to git
- [ ] Frontend CORS URL updated in `CORS_ORIGIN`
- [ ] Google OAuth redirect URI updated for production

### Deployment
- [ ] Merge `develop` → `main`
- [ ] Push to GitHub
- [ ] Verify GitHub Actions build passes
- [ ] Monitor Render deployment logs
- [ ] Check health endpoint: `/health`

### Post-Deployment
- [ ] Test authentication flows (register, login, OAuth)
- [ ] Verify database migrations applied
- [ ] Check API endpoints respond correctly
- [ ] Monitor error logs for issues
- [ ] Test CORS with frontend
- [ ] Verify email sending (if configured)

### Rollback Plan
```bash
# If deployment fails, revert to previous commit
git revert HEAD
git push origin main
```

---

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

**URL**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "database": "connected"
}
```

### Checking Deployment Status

```bash
# Check if service is running
curl https://fitrecipes-backend.onrender.com/health

# Check API version
curl https://fitrecipes-backend.onrender.com/api/v1/health

# Test authentication endpoint
curl -X POST https://fitrecipes-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🚨 Common Deployment Issues

### 1. Render Service Won't Start

**Symptoms**: Deployment fails, service crashes immediately

**Possible Causes**:
- Missing environment variables
- Database connection fails
- Port configuration wrong
- Prisma client not generated

**Solution**:
```bash
# Check Render logs in dashboard
# Verify all environment variables set
# Ensure DATABASE_URL and DIRECT_URL are correct
# Verify migrations are in git
```

### 2. Database Migration Fails

**Error**: "No migration found in prisma/migrations"

**Solution**: Commit migrations to git (never in .gitignore)

**Error**: P3005 "Database schema is not empty"

**Solution**: Baseline the migration
```bash
bunx prisma migrate resolve --applied "20251002145615_initial_schema"
```

### 3. CORS Errors

**Symptoms**: Frontend requests blocked by CORS

**Solution**: Update `CORS_ORIGIN` in Render environment variables
```bash
# Production
CORS_ORIGIN=https://fitrecipes.vercel.app

# Staging
CORS_ORIGIN=http://localhost:5173
```

### 4. OAuth Redirect Not Working

**Symptoms**: OAuth callback fails, redirect URL mismatch

**Solution**: Update Google OAuth redirect URI in Google Console
```
https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback
```

### 5. Free Tier Cold Starts (Staging)

**Symptoms**: First request after 15 minutes takes 30-50 seconds

**Expected Behavior**: This is normal for Render's free tier. Acceptable for staging.

**Solution**: Upgrade to paid tier for production (no cold starts)

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for staging vs production
- ✅ Rotate JWT secrets regularly
- ✅ Use strong passwords for database

### Database
- ✅ Use connection pooling (`pgbouncer=true` in DATABASE_URL)
- ✅ Separate `DATABASE_URL` and `DIRECT_URL` for migrations
- ✅ Enable SSL for database connections
- ✅ Regular backups configured in Supabase

### API Security
- ✅ Rate limiting enabled (100 req/15min)
- ✅ CORS restricted to known frontend domains
- ✅ Input validation with Zod schemas
- ✅ JWT tokens expire after 24 hours
- ✅ Password hashing with bcrypt (10 rounds)

---

## 📊 Performance Optimization

### Horizontal Scaling
```bash
# Docker Compose with 3 backend replicas
docker-compose up --scale backend=3

# Nginx load balancer distributes requests
```

### Database Optimization
- Connection pooling via Supabase pgBouncer
- Indexed fields for fast queries
- Prepared statements with Prisma

### Caching Strategy (Future)
- Redis for session storage
- CDN for static assets
- API response caching for trending recipes

---

## 📚 Deployment Documentation Files

After organization, these files remain:
- `DEPLOYMENT_GUIDE.md` - This comprehensive guide (YOU ARE HERE)
- `DEPLOYMENT_URLS.md` - Quick URL reference
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `MIGRATIONS_GUIDE.md` - Detailed Prisma migrations guide
- `FIX_STAGING_MIGRATION_BASELINE.md` - Migration troubleshooting

---

## 🎯 Quick Commands Reference

```bash
# Development
bun run dev           # Start dev server with hot reload
bun run test          # Run tests
bun run lint          # Run linter
bun run format        # Format code

# Database
bun run db:migrate    # Create and apply migration
bun run db:push       # Push schema (dev only, no migration)
bun run db:studio     # Open Prisma Studio

# Docker
docker-compose up -d  # Start services
docker-compose logs   # View logs
docker-compose down   # Stop services

# Deployment
git push origin develop  # Deploy to staging
git push origin main     # Deploy to production
```

---

**Last Updated**: January 7, 2025  
**Status**: ✅ Production Ready
