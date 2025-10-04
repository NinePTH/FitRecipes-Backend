# FitRecipes Deployment URLs & Configuration

Quick reference for all deployment environments and their configurations.

## 🌐 Deployment Environments

### Development (Local)
- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`
- **Database**: Local PostgreSQL or Supabase development database
- **Branch**: Any feature branch
- **Purpose**: Local development and testing

### Staging
- **Backend**: `https://fitrecipes-backend-staging.onrender.com`
- **Frontend**: `http://localhost:5173` (no staging frontend yet)
- **Database**: Supabase staging database
- **Branch**: `develop`
- **Deployment**: Auto-deploy via GitHub Actions
- **Tier**: Render FREE tier (spins down after 15 min inactivity)
- **Purpose**: Integration testing and QA

### Production
- **Backend**: `https://fitrecipes-backend.onrender.com`
- **Frontend**: `https://fitrecipes.vercel.app`
- **Database**: Supabase production database
- **Branch**: `main`
- **Deployment**: Auto-deploy via GitHub Actions
- **Tier**: Render paid tier (always on)
- **Purpose**: Live production environment

## 🔑 Environment Variables by Environment

### Development (.env.local)
```bash
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://localhost:5432/fitrecipes"
# Or use Supabase development database

BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=your_dev_jwt_secret
BCRYPT_ROUNDS=10  # Lower for faster dev testing

RESEND_API_KEY=  # Empty = logs to console
EMAIL_FROM=noreply@fitrecipes.com

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

### Staging (Render Environment Variables)
```bash
NODE_ENV=staging
PORT=3000

DATABASE_URL="postgresql://postgres.xxx:pwd@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:pwd@db.xxx.supabase.co:5432/postgres"

BACKEND_URL=https://fitrecipes-backend-staging.onrender.com
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=your_staging_jwt_secret_different_from_prod
BCRYPT_ROUNDS=12

RESEND_API_KEY=re_staging_api_key  # Optional: use dev mode
EMAIL_FROM=noreply@fitrecipes.com

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://fitrecipes-backend-staging.onrender.com/api/v1/auth/google/callback

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=recipe-images-staging
```

### Production (Render Environment Variables)
```bash
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://postgres.xxx:pwd@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:pwd@db.xxx.supabase.co:5432/postgres"

BACKEND_URL=https://fitrecipes-backend.onrender.com
FRONTEND_URL=https://fitrecipes.vercel.app
CORS_ORIGIN=https://fitrecipes.vercel.app

JWT_SECRET=your_production_jwt_secret_very_secure_min_32_chars
BCRYPT_ROUNDS=12

RESEND_API_KEY=re_production_api_key
EMAIL_FROM=noreply@fitrecipes.com

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=recipe-images
```

## 🔐 Google OAuth Configuration

You'll need separate OAuth credentials for each environment or configure one with multiple redirect URIs.

### Development
- **Authorized JavaScript origins**:
  - `http://localhost:3000`
  - `http://localhost:5173`
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/v1/auth/google/callback`

### Staging
- **Authorized JavaScript origins**:
  - `https://fitrecipes-backend-staging.onrender.com`
  - `http://localhost:5173`
- **Authorized redirect URIs**:
  - `https://fitrecipes-backend-staging.onrender.com/api/v1/auth/google/callback`

### Production
- **Authorized JavaScript origins**:
  - `https://fitrecipes-backend.onrender.com`
  - `https://fitrecipes.vercel.app`
- **Authorized redirect URIs**:
  - `https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback`
  - `https://fitrecipes.vercel.app/auth/callback` (if needed)

## 🗄️ Database Configuration

### Development
- **Option 1**: Local PostgreSQL
  - `DATABASE_URL=postgresql://postgres:password@localhost:5432/fitrecipes`
- **Option 2**: Supabase development database
  - Separate project for development
  - Allows testing migrations without affecting staging/production

### Staging
- **Supabase Project**: Separate staging project (recommended) or staging schema
- **Connection Pooling**: Enabled via pgbouncer (port 6543)
- **Direct Connection**: For migrations (port 5432)
- **Storage Bucket**: `recipe-images-staging`

### Production
- **Supabase Project**: Production project with backups enabled
- **Connection Pooling**: Enabled via pgbouncer (port 6543)
- **Direct Connection**: For migrations (port 5432)
- **Storage Bucket**: `recipe-images`
- **Backups**: Automated daily backups

## 📦 Storage Buckets

### Development
- Bucket: `recipe-images-dev` (optional, or use staging)
- Public access: Enabled
- CORS: Allow all origins for development

### Staging
- Bucket: `recipe-images-staging`
- Public access: Enabled
- CORS: `http://localhost:5173`

### Production
- Bucket: `recipe-images`
- Public access: Enabled
- CORS: `https://fitrecipes.vercel.app`

## 🚀 Deployment Commands

### Deploy to Staging
```bash
git checkout develop
git add .
git commit -m "feat: your changes"
git push origin develop
# Auto-deploys to https://fitrecipes-backend-staging.onrender.com
```

### Deploy to Production
```bash
# Option 1: Direct push to main
git checkout main
git merge develop
git push origin main
# Auto-deploys to https://fitrecipes-backend.onrender.com

# Option 2: Via Pull Request (recommended)
# 1. Create PR from develop to main
# 2. Review and approve
# 3. Merge PR
# 4. Auto-deploys to production
```

### Manual Deploy (Emergency)
```bash
# In Render Dashboard
# Navigate to service > Manual Deploy > Deploy latest commit
```

## 🔍 Health Check Endpoints

### Development
```bash
curl http://localhost:3000/health
```

### Staging
```bash
curl https://fitrecipes-backend-staging.onrender.com/health
```

### Production
```bash
curl https://fitrecipes-backend.onrender.com/health
```

**Expected Response**:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2025-10-03T00:00:00.000Z"
}
```

## 📊 Monitoring & Logs

### Render Dashboard
- **Staging**: https://dashboard.render.com → fitrecipes-backend-staging
- **Production**: https://dashboard.render.com → fitrecipes-backend

### View Logs
```bash
# In Render Dashboard:
# Service > Logs tab > Real-time logs

# Or use Render CLI:
render logs -s fitrecipes-backend          # Production
render logs -s fitrecipes-backend-staging  # Staging
```

### GitHub Actions
- **CI/CD Status**: https://github.com/NinePTH/FitRecipes-Backend/actions
- **View deployment logs**: Click on specific workflow run

## 🔄 Rollback Procedures

### Staging Rollback
```bash
# Option 1: Revert commit
git checkout develop
git revert HEAD
git push origin develop

# Option 2: Redeploy previous version (Render Dashboard)
# Service > Deployments > Select previous deployment > Redeploy
```

### Production Rollback
```bash
# CRITICAL: Test in staging first!

# Option 1: Revert commit
git checkout main
git revert HEAD
git push origin main

# Option 2: Redeploy previous version (Render Dashboard)
# RECOMMENDED: Use dashboard for quick rollback
```

## 🐛 Troubleshooting URLs

### Common Issues

#### CORS Error
- **Check**: `CORS_ORIGIN` exactly matches frontend URL (no trailing slash)
- **Staging**: Should be `http://localhost:5173`
- **Production**: Should be `https://fitrecipes.vercel.app`

#### OAuth Redirect Fails
- **Check**: `GOOGLE_REDIRECT_URI` matches Google Console configuration
- **Staging**: `https://fitrecipes-backend-staging.onrender.com/api/v1/auth/google/callback`
- **Production**: `https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback`

#### 502 Bad Gateway (Staging)
- **Cause**: Free tier spun down (15 min inactivity)
- **Solution**: Wait 30-50 seconds for cold start
- **Expected**: First request after sleep takes longer

## 📚 Related Documentation

- `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `docs/STAGING_SETUP.md` - Staging environment setup
- `docs/STAGING_QUICKSTART.md` - Quick staging reference
- `docs/MIGRATIONS_GUIDE.md` - Database migrations
- `.github/copilot-instructions.md` - Complete project documentation
