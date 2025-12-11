# Quick Deployment Guide - Render & PostgreSQL

> **Easy, step-by-step guide** to deploy FitRecipes Backend to Render with PostgreSQL

**Last Updated**: December 11, 2025  
**Time to Deploy**: ~30 minutes

---

## 🎯 What You'll Deploy

- **Backend API**: Hono.js + Bun on Render (Docker)
- **Database**: PostgreSQL on Supabase (Free tier)
- **Two Environments**:
  - **Production** (`main` branch)
  - **Staging** (`develop` branch, FREE tier)

---

## 📋 Prerequisites

Before you start, have these ready:

- [x] GitHub account with this repo
- [x] Render account (free) - [Sign up](https://render.com)
- [x] Supabase account (free) - [Sign up](https://supabase.com)
- [x] Google OAuth credentials (optional, for social login)

---

## Part 1: Setup PostgreSQL Database (Supabase)

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `fitrecipes-production` (or `fitrecipes-staging`)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Database Connection Strings

Once project is created:

1. Go to **Project Settings** → **Database**
2. Find **Connection Pooling** section
3. Copy these two URLs:

**For Application (Pooled Connection)**:
```
Connection string: Transaction mode
postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```
☝️ This is your `DATABASE_URL` (for app runtime)

**For Migrations (Direct Connection)**:
```
Connection string: Session mode  
postgresql://postgres.xxx:[PASSWORD]@xxx.supabase.com:5432/postgres
```
☝️ This is your `DIRECT_URL` (for migrations)

**Important**: Replace `[PASSWORD]` with your actual database password!

### Step 3: Create Storage Bucket (for recipe images)

1. In Supabase Dashboard, go to **Storage**
2. Click **"New bucket"**
3. Name: `recipe-images`
4. Public bucket: ✅ **Yes** (images need to be publicly accessible)
5. Click **"Create bucket"**

### Step 4: Get Supabase API Keys

1. Go to **Project Settings** → **API**
2. Copy these:
   - **Project URL**: `https://xxx.supabase.co` → This is `SUPABASE_URL`
   - **anon public**: `eyJhbGc...` → This is `SUPABASE_ANON_KEY`

✅ **Database setup complete!** Keep these values for next step.

---

## Part 2: Deploy to Render

### Step 1: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `FitRecipes-Backend`
4. Configure service:

**Basic Settings**:
```
Name: fitrecipes-backend-production (or staging)
Region: Oregon (US West) or closest to your users
Branch: main (for production) or develop (for staging)
Root Directory: (leave empty)
Runtime: Docker
```

**Build & Deploy**:
```
Dockerfile Path: ./Dockerfile
Docker Command: (leave empty, uses ENTRYPOINT from Dockerfile)
```

**Plan**:
- **Production**: Starter ($7/month) - No cold starts
- **Staging**: Free tier - Spins down after 15 min inactivity (OK for testing)

5. Click **"Create Web Service"** (don't deploy yet!)

**Important**: After service is created:
1. Copy your **Service ID** from the URL (looks like `srv-xxxxx`)
2. Go to **Settings** → **Build & Deploy**
3. Set **Auto-Deploy**: **No** (we'll use GitHub Actions instead)

### Step 2: Configure Environment Variables

In your Render service dashboard:

1. Go to **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Add ALL of these variables:

#### Database Configuration
```bash
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@xxx.supabase.com:5432/postgres
```
☝️ Use the values from Part 1, Step 2

#### Application Settings
```bash
NODE_ENV=production
PORT=3000
BACKEND_URL=https://fitrecipes-backend-production.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```
**Note**: Update URLs with your actual Render service URL (shown after creation)

#### Authentication
```bash
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MIN_32_CHARACTERS_LONG
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```
**Generate JWT_SECRET**: Use random string generator or run:
```bash
openssl rand -base64 32
```

#### Supabase Storage
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_BUCKET_NAME=recipe-images
```
☝️ Use the values from Part 1, Step 4

#### Google OAuth (Optional - skip if not using)
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://fitrecipes-backend-production.onrender.com/api/v1/auth/google/callback
```
Get these from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

#### Firebase FCM (Optional - for push notifications)
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
```

#### Email Service (Optional - defaults to console logs)
```bash
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. Click **"Save Changes"**

### Step 3: Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Watch deployment logs (takes ~5-8 minutes):
   ```
   ✅ Building Docker image...
   ✅ Running database migrations...
   ✅ Starting application...
   ✅ Health check passed!
   ```

### Step 4: Verify Deployment

Test your API:

```bash
# Health check
curl https://fitrecipes-backend-production.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-11T...",
  "database": "connected"
}
```

✅ **If you see this, deployment successful!**

---

## Part 2.5: Setup GitHub Actions (CI/CD)

> This enables automatic deployment via GitHub Actions instead of Render's auto-deploy

### Step 1: Get Render API Key

1. Go to [Render Account Settings](https://dashboard.render.com/account/settings)
2. Scroll to **API Keys** section
3. Click **"Create API Key"**
4. Name: `GitHub Actions CI/CD`
5. Copy the API key (starts with `rnd_`)

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these **THREE** secrets:

**For Production**:
```
Name: RENDER_SERVICE_ID
Value: srv-xxxxx (from Part 2, Step 1)

Name: RENDER_API_KEY
Value: rnd_xxxxx (from above)

Name: RENDER_APP_URL
Value: https://fitrecipes-backend-production.onrender.com
```

**For Staging** (if you set up staging):
```
Name: RENDER_STAGING_SERVICE_ID
Value: srv-yyyyy (staging service ID)

(RENDER_API_KEY is shared between prod and staging)
```

### Step 3: Verify CI/CD Setup

GitHub Actions is already configured in `.github/workflows/ci-cd.yml`

**What it does**:
1. Runs tests on every push
2. Deploys to staging when you push to `develop`
3. Deploys to production when you push to `main`

**Test it**:
```bash
git checkout develop
git commit --allow-empty -m "test: trigger CI/CD"
git push origin develop
```

Then check:
- GitHub → Actions tab → See workflow running
- Render → Logs → See deployment triggered by GitHub Actions

---

## Part 3: Setup Staging Environment (Optional)

Repeat Part 2 with these changes:

1. **Supabase**: Create separate project named `fitrecipes-staging`
2. **Render Service Name**: `fitrecipes-backend-staging`
3. **Branch**: `develop` instead of `main`
4. **Plan**: Free tier (acceptable for staging)
5. **Environment Variables**: Update URLs to staging versions

**Staging Auto-Deploy**:
- Go to **Settings** → **Build & Deploy**
- Set **"Auto-Deploy"**: **No** (use GitHub Actions instead)
- Add `RENDER_STAGING_SERVICE_ID` to GitHub secrets (see Part 2.5)
- Every push to `develop` branch will trigger GitHub Actions → deploy to staging

---

## 🚀 Daily Development Workflow

### Deploy to Staging (Testing)
```bash
git checkout develop
git add .
git commit -m "feat: add new feature"
git push origin develop
```
→ Automatically deploys to staging

### Deploy to Production (Live)
```bash
git checkout main
git merge develop
git push origin main
```
→ Automatically deploys to production

---

## 🔧 Making Database Changes

### Step 1: Update Schema
Edit `prisma/schema.prisma`:
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // Add new field:
  phone String?
}
```

### Step 2: Create Migration
```bash
bun run db:migrate -- --name add_user_phone
```
This creates a migration file in `prisma/migrations/`

### Step 3: Commit Migration
```bash
git add prisma/migrations/ prisma/schema.prisma
git commit -m "feat: add user phone field"
git push origin develop
```

### Step 4: Migration Runs Automatically
Render deployment will:
1. Pull latest code
2. Run `prisma migrate deploy` automatically
3. Apply new migration to database

**Important**: ⚠️ **NEVER** add `prisma/migrations/` to `.gitignore`!

---

## 🐛 Common Issues & Solutions

### Issue 1: "Database connection failed"

**Solution**: Check your `DATABASE_URL` format:
```bash
# Correct format:
postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true

# Common mistakes:
# ❌ Missing ?pgbouncer=true
# ❌ Wrong port (should be 6543 for pooler, not 5432)
# ❌ Password not URL-encoded (special chars need encoding)
```

### Issue 2: "No migration found"

**Cause**: `prisma/migrations/` folder not in git

**Solution**:
```bash
# Verify migrations are in git
git ls-files prisma/migrations/

# If empty, migrations were ignored - remove from .gitignore
# Then commit:
git add prisma/migrations/
git commit -m "fix: add migrations to git"
git push
```

### Issue 3: "P3005: Database schema is not empty"

**Cause**: Database has tables but no migration history

**Solution**: Baseline the migration
```bash
# SSH into Render (or run locally with staging DB):
bunx prisma migrate resolve --applied "20251002145615_initial_schema"
```

### Issue 4: "CORS error from frontend"

**Solution**: Update `CORS_ORIGIN` in Render environment variables:
```bash
# Must match your frontend URL exactly
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Issue 5: "Cold start takes 30+ seconds (staging)"

**Expected**: This is normal for Render's free tier
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-50 seconds
- Acceptable for staging, use paid plan for production

---

## 📊 Monitoring Your Deployment

### Check Logs
1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Real-time logs show:
   - Deployment progress
   - Application errors
   - HTTP requests
   - Database queries

### Check Database
1. Go to Supabase Dashboard → Your Project
2. Click **"Table Editor"** - See your data
3. Click **"Database"** → **"Roles"** - Connection info
4. Click **"Storage"** - View uploaded images

### Health Monitoring
```bash
# Quick health check
curl https://your-service.onrender.com/health

# Check database connection
curl https://your-service.onrender.com/api/v1/health
```

---

## 🔒 Security Checklist

Before going live:

- [x] Different `JWT_SECRET` for production vs staging
- [x] Strong database password (16+ characters)
- [x] `NODE_ENV=production` in production
- [x] `CORS_ORIGIN` restricted to your frontend domain only
- [x] OAuth redirect URIs match deployed URLs
- [x] `.env` files NEVER committed to git
- [x] Supabase Row Level Security (RLS) enabled if needed

---

## 💰 Cost Estimate

### Free Tier (Good for staging):
- Render Web Service: **$0** (spins down after 15min)
- Supabase Database: **$0** (500MB storage, 2GB bandwidth)
- Supabase Storage: **$0** (1GB files)
- **Total: $0/month**

### Production (Recommended):
- Render Starter: **$7/month** (512MB RAM, always on)
- Supabase Free: **$0** (upgrade to Pro $25 if needed)
- **Total: $7/month** (or $32 with Supabase Pro)

---

## 📞 Need Help?

### Documentation
- **Full Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
- **Migration Guide**: `docs/MIGRATIONS_GUIDE.md`
- **System Architecture**: `docs/SYSTEM_ARCHITECTURE.md`

### Resources
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### Repository Issues
- Create issue on GitHub: [Issues](https://github.com/NinePTH/FitRecipes-Backend/issues)

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [x] Health check returns `{"status": "healthy"}`
- [x] Database connection working
- [x] Can register new user
- [x] Can login and get JWT token
- [x] Image upload works (check Supabase Storage)
- [x] CORS allows frontend requests
- [x] Email sending works (if configured)
- [x] OAuth login works (if configured)

**Congratulations! 🎉 Your backend is live!**

---

**Last Updated**: December 11, 2025  
**Maintained By**: Development Team  
**Status**: ✅ Production Ready
