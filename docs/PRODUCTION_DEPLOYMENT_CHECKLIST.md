# Production Deployment Checklist

This checklist ensures your FitRecipes backend is properly configured for production deployment.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Configuration

#### Required Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (or your preferred port)
- [ ] `DATABASE_URL` (with pgbouncer for connection pooling)
- [ ] `DIRECT_URL` (without pgbouncer, for migrations)
- [ ] `JWT_SECRET` (minimum 32 characters, randomly generated)
- [ ] `JWT_EXPIRES_IN=24h` (or your preferred duration)
- [ ] `BCRYPT_ROUNDS=12` (balance between security and performance)

#### Frontend Configuration
- [ ] `FRONTEND_URL=https://fitrecipes.vercel.app`
- [ ] `CORS_ORIGIN=https://fitrecipes.vercel.app`
  - For multiple origins: `https://fitrecipes.vercel.app,https://staging.fitrecipes.com`

#### Google OAuth
- [ ] `GOOGLE_CLIENT_ID` (from Google Cloud Console)
- [ ] `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)
- [ ] `GOOGLE_REDIRECT_URI=https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback`
- [ ] Add authorized redirect URIs in Google Cloud Console

#### Supabase Configuration
- [ ] `SUPABASE_URL` (from Supabase dashboard)
- [ ] `SUPABASE_ANON_KEY` (from Supabase dashboard)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)
- [ ] `SUPABASE_STORAGE_BUCKET=recipe-images` (production bucket)

#### Email Service (Resend)
- [ ] `RESEND_API_KEY` (get from https://resend.com/api-keys)
- [ ] `EMAIL_FROM=noreply@fitrecipes.com` (verified domain)

#### Rate Limiting
- [ ] `RATE_LIMIT_WINDOW_MS=900000` (15 minutes)
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`

### 2. Database Setup

#### Supabase Configuration
- [ ] Production database created on Supabase
- [ ] Connection pooling enabled (pgbouncer)
- [ ] Both `DATABASE_URL` and `DIRECT_URL` configured
- [ ] Database backup schedule configured

#### Migration Status
```bash
# Verify migrations are applied
bunx prisma migrate status
```
- [ ] All migrations applied successfully
- [ ] No pending migrations
- [ ] `_prisma_migrations` table exists

### 3. Storage Configuration

#### Supabase Storage Buckets
- [ ] `recipe-images` bucket created
- [ ] Public access configured for bucket
- [ ] CORS policy configured:
```json
[
  {
    "allowedOrigins": ["https://fitrecipes.vercel.app"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

### 4. Google OAuth Setup

#### Google Cloud Console Configuration
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins:
  - `https://fitrecipes.vercel.app`
  - `https://fitrecipes-backend.onrender.com`
- [ ] Authorized redirect URIs:
  - `https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback`
  - `https://fitrecipes.vercel.app/auth/callback` (if needed by frontend)
- [ ] OAuth consent screen configured
- [ ] Publishing status: In production (not testing)

### 5. Email Configuration

#### Resend Setup
- [ ] Domain verified in Resend
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] API key generated and added to environment
- [ ] Test email sent successfully

#### Email Templates
- [ ] Password reset email working
- [ ] Email verification working (when implemented)
- [ ] Email content reviewed for production readiness

### 6. Security Hardening

#### Secrets Management
- [ ] All secrets are environment-specific
- [ ] No secrets in git repository
- [ ] Different JWT secrets for each environment
- [ ] Secure password policy enforced (minimum 8 characters)

#### CORS Configuration
- [ ] Only production frontend URL allowed
- [ ] No wildcard (`*`) origins in production
- [ ] Credentials support enabled if needed

#### Rate Limiting
- [ ] Appropriate limits configured
- [ ] Redis/memory store configured for distributed rate limiting (if needed)

### 7. Deployment Platform (Render)

#### Service Configuration
- [ ] Service type: Web Service
- [ ] Build command: `bun install && bun run build`
- [ ] Start command: Uses `docker-entrypoint.sh`
- [ ] Auto-deploy enabled on main branch
- [ ] Health check endpoint: `/health`
- [ ] Instance type selected (free tier or paid)

#### Environment Variables
- [ ] All required environment variables set in Render dashboard
- [ ] Secrets properly secured
- [ ] Variables different from staging

#### Docker Configuration
- [ ] Dockerfile includes OpenSSL for Prisma
- [ ] Multi-stage build optimized
- [ ] Non-root user configured
- [ ] Health check configured

### 8. Monitoring & Logging

#### Health Checks
- [ ] `/health` endpoint returns 200 OK
- [ ] Database connectivity verified
- [ ] Response time acceptable (<2 seconds)

#### Logging
- [ ] Application logs accessible in Render
- [ ] Error logging configured
- [ ] Request logging enabled (Hono logger)

#### Monitoring (Optional but Recommended)
- [ ] Sentry or similar error tracking configured
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Performance monitoring (New Relic, DataDog)

### 9. Testing Before Go-Live

#### API Testing
- [ ] Authentication endpoints working
  - [ ] Register new user
  - [ ] Login with credentials
  - [ ] Google OAuth flow
  - [ ] Password reset flow
  - [ ] JWT token validation
- [ ] Protected endpoints return 401 without token
- [ ] Role-based access control working
- [ ] CORS properly configured (test from frontend)

#### Integration Testing
- [ ] Frontend can connect to backend
- [ ] OAuth redirects work correctly
- [ ] Image uploads work
- [ ] Database queries perform well
- [ ] Email delivery working

### 10. Post-Deployment Verification

#### Immediate Checks (Within 1 hour)
- [ ] Service is running and accessible
- [ ] Health check endpoint responds
- [ ] Frontend can communicate with backend
- [ ] OAuth flow works end-to-end
- [ ] No critical errors in logs

#### 24-Hour Checks
- [ ] No memory leaks
- [ ] Response times acceptable
- [ ] Database connections stable
- [ ] No unexpected errors
- [ ] Email delivery reliable

#### 7-Day Checks
- [ ] System stable under normal load
- [ ] Monitoring alerts configured
- [ ] Backup strategy working
- [ ] Logs manageable

## 🚀 Deployment Commands

### From GitHub (Automatic)
```bash
# Merge to main branch
git checkout main
git merge develop
git push origin main
# Render auto-deploys from main branch
```

### Manual Deployment (If Needed)
```bash
# In Render dashboard: Manual Deploy > Deploy latest commit
```

### Verify Deployment
```bash
# Check health endpoint
curl https://fitrecipes-backend.onrender.com/health

# Test authentication
curl https://fitrecipes-backend.onrender.com/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Rollback Plan

### Quick Rollback
```bash
# If deployment fails, revert in Render dashboard
# Dashboard > Deployments > [previous version] > Redeploy
```

### Git Rollback
```bash
# Revert last commit
git revert HEAD
git push origin main
# Render will auto-deploy the revert
```

## 📊 Production Environment Variables Summary

Create a `.env.production` file locally (DON'T commit) with:

```bash
NODE_ENV=production
PORT=3000

# Database (from Supabase)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=recipe-images

# JWT
JWT_SECRET=your_production_jwt_secret_min_32_chars_random
JWT_EXPIRES_IN=24h

# Email (Resend)
RESEND_API_KEY=re_your_production_api_key
EMAIL_FROM=noreply@fitrecipes.com

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback

# Application URLs
BACKEND_URL=https://fitrecipes-backend.onrender.com
FRONTEND_URL=https://fitrecipes.vercel.app
CORS_ORIGIN=https://fitrecipes.vercel.app

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Then copy these to Render's environment variables section.

## 🆘 Troubleshooting

### Issue: CORS errors from frontend
**Solution**: Ensure `CORS_ORIGIN` exactly matches frontend URL (no trailing slash)

### Issue: OAuth redirect fails
**Solution**: Check `GOOGLE_REDIRECT_URI` matches authorized URIs in Google Console

### Issue: Database migration fails
**Solution**: See `docs/FIX_STAGING_MIGRATION_BASELINE.md`

### Issue: Emails not sending
**Solution**: Verify `RESEND_API_KEY` and domain is verified in Resend dashboard

### Issue: 502 Bad Gateway
**Solution**: Check Render logs, likely startup issue with migrations or database connection

## 📚 Related Documentation

- `docs/STAGING_SETUP.md` - Staging environment setup
- `docs/MIGRATIONS_GUIDE.md` - Database migrations guide
- `docs/FIX_STAGING_MIGRATION_BASELINE.md` - Fix migration baseline issues
- `docs/oauth-implementation.md` - OAuth implementation details
- `README.md` - General project documentation
