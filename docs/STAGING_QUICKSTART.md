# Staging Deployment Setup - Summary

## ✅ What's Been Set Up

### 1. CI/CD Pipeline Updated
- **File**: `.github/workflows/ci-cd.yml`
- **Changes**:
  - Split `deploy` job into two separate jobs:
    - `deploy-production`: Runs on `main` branch
    - `deploy-staging`: Runs on `develop` branch
  - Both use the same CI/CD quality gates (tests, build, security)
  - Staging deployment is completely independent from production

### 2. Configuration
- **Production Service**: Uses `RENDER_SERVICE_ID` secret
- **Staging Service**: Uses `RENDER_STAGING_SERVICE_ID` secret
- **API Key**: Both share the same `RENDER_API_KEY` secret

### 3. Documentation
- **File**: `docs/STAGING_SETUP.md`
- Complete step-by-step guide for setting up free staging environment
- Includes troubleshooting and best practices

## 🎯 Next Steps (To Make It Work)

Follow these steps in order:

### Step 1: Create Staging Service on Render (5 minutes)
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Select your repository
4. Configure:
   - **Name**: `fitrecipes-backend-staging`
   - **Branch**: `develop` ⚠️ IMPORTANT
   - **Runtime**: Docker
   - **Instance Type**: **Free** ⚠️ IMPORTANT (this is free!)
   - **Auto-Deploy**: Yes (recommended)

### Step 2: Add Environment Variables (3 minutes)
In your new staging service settings, add all the same environment variables as production:
- `DATABASE_URL` (can use same DB or separate test DB)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BCRYPT_ROUNDS`
- `PORT=3000`
- `NODE_ENV=staging`
- `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID` (same as production is fine)
- `GOOGLE_CLIENT_SECRET` (same as production is fine)
- `GOOGLE_REDIRECT_URI` (update with staging URL)

### Step 3: Get Service ID (1 minute)
1. Look at the URL of your staging service
2. Copy the service ID: `srv-xxxxxxxxxxxxx`

### Step 4: Add GitHub Secret (2 minutes)
1. Go to your repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `RENDER_STAGING_SERVICE_ID`
4. Value: The service ID from Step 3
5. Click "Add secret"

### Step 5: Test It! (1 minute)
```bash
# Make sure you're on develop branch
git checkout develop

# Make a test commit
git commit --allow-empty -m "test: staging deployment"

# Push to trigger deployment
git push origin develop
```

Then watch:
1. GitHub Actions tab - see the workflow run
2. Render dashboard - see the deployment
3. Visit: `https://your-staging-app.onrender.com/health`

## 💰 Cost Breakdown

| What | Cost |
|------|------|
| Staging service (Free tier) | **$0/month** |
| GitHub Actions (public repo) | **$0/month** |
| **Total** | **$0/month** |

✅ **Completely free!**

## 🚀 Workflow After Setup

### Developing New Features
```bash
# 1. Create feature branch from develop
git checkout develop
git pull
git checkout -b feature/new-feature

# 2. Make changes, commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature

# 4. Create PR to develop branch
# 5. After merge, auto-deploys to staging!
```

### Deploying to Production
```bash
# After testing on staging
git checkout main
git merge develop
git push origin main
# Auto-deploys to production!
```

## ⚠️ Important Notes

1. **Free tier limitations**:
   - Spins down after 15 minutes of inactivity
   - First request after spin-down takes 30-50 seconds
   - **This is perfect for staging!** No cost, just a bit slower.

2. **Same API key**: Both services use the same `RENDER_API_KEY`. You only need to create one API key in your Render account.

3. **Google OAuth**: You can use the same Google OAuth credentials. Just add your staging redirect URI to the Google Cloud Console:
   - Production: `https://your-production-app.onrender.com/api/v1/auth/google/callback`
   - Staging: `https://your-staging-app.onrender.com/api/v1/auth/google/callback`

4. **Database**: You can either:
   - Use the same database (easier, but staging changes affect production data)
   - Use a separate test database (recommended, more isolation)

## 📚 Documentation

Full detailed guide: `docs/STAGING_SETUP.md`

## ✅ Status

- [x] CI/CD pipeline configured
- [x] Documentation created
- [x] Changes committed to `develop` branch
- [ ] Staging service created on Render (you need to do this)
- [ ] GitHub secret added (you need to do this)
- [ ] First deployment tested (you need to do this)

## 🎉 Benefits

✅ Test changes before production  
✅ Catch bugs early  
✅ Safe experimentation  
✅ Same deployment process as production  
✅ **Costs nothing!**  
