# Staging Environment Setup (FREE)

This guide will help you set up a **completely FREE** staging environment on Render for the `develop` branch.

## Overview

- **Production**: `main` branch → Production Render service
- **Staging**: `develop` branch → Staging Render service (FREE)
- **Cost**: $0 - Both services can be on free tier

## Step 1: Create Staging Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `fitrecipes-backend-staging` (or your preferred name)
   - **Branch**: `develop`
   - **Runtime**: `Docker`
   - **Instance Type**: **Free** (Important!)
   - **Auto-Deploy**: Enable (recommended)

## Step 2: Configure Environment Variables

Add these environment variables in Render's staging service settings:

```
DATABASE_URL=<your-postgres-connection-string>
JWT_SECRET=<generate-a-secure-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
PORT=3000
NODE_ENV=staging
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
GOOGLE_REDIRECT_URI=<your-staging-app-url>/api/v1/auth/google/callback
```

> **Note**: You can use the same Google OAuth credentials for both staging and production, just make sure to add both redirect URIs in your Google Cloud Console.

## Step 3: Get Service ID

1. In your Render staging service dashboard
2. Look at the URL: `https://dashboard.render.com/web/srv-xxxxxxxxxxxxx`
3. Copy the service ID part: `srv-xxxxxxxxxxxxx`

## Step 4: Add GitHub Secrets

Add this secret to your GitHub repository:

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - **Name**: `RENDER_STAGING_SERVICE_ID`
   - **Value**: `srv-xxxxxxxxxxxxx` (from Step 3)

> **Note**: The `RENDER_API_KEY` secret should already exist from your production setup. The same API key can be used for both services.

## Step 5: Test the Setup

1. Create the `develop` branch if it doesn't exist:
   ```bash
   git checkout -b develop
   git push origin develop
   ```

2. Make a commit to the `develop` branch:
   ```bash
   git commit --allow-empty -m "test: staging deployment"
   git push origin develop
   ```

3. Check GitHub Actions:
   - Go to Actions tab in your repository
   - Watch the "CI/CD Pipeline" workflow
   - The `deploy-staging` job should run for `develop` branch

4. Verify deployment:
   - Check your Render staging service dashboard
   - Wait for the deployment to complete (may take a few minutes on free tier)
   - Visit: `https://your-staging-app.onrender.com/health`

## Workflow Behavior

### Main Branch (Production)
```
Push to main → Test → Build → Security → Deploy to Production
```

### Develop Branch (Staging)
```
Push to develop → Test → Build → Security → Deploy to Staging
```

## Free Tier Limitations

Render's free tier has these limitations:
- **Spins down after 15 minutes of inactivity** (first request may take 30-50 seconds)
- 750 hours/month of runtime
- Slower builds compared to paid tiers
- No custom domains (uses `.onrender.com`)

**These limitations are perfect for a staging environment!**

## Cost Breakdown

| Service | Branch | Tier | Cost |
|---------|--------|------|------|
| Production | main | Free or Paid | Your choice |
| Staging | develop | Free | **$0** |

**Total additional cost for staging: $0** ✅

## Troubleshooting

### Staging deployment not triggering

1. Check that `RENDER_STAGING_SERVICE_ID` secret is set correctly
2. Verify you're pushing to `develop` branch
3. Check GitHub Actions logs for errors

### Deployment fails

1. Check Render service logs in dashboard
2. Verify all environment variables are set
3. Make sure Docker build succeeds locally: `docker build -t test .`

### Service spins down too quickly

This is expected on free tier. Options:
1. Accept the cold start delay (recommended for staging)
2. Upgrade to paid tier ($7/month) for always-on service
3. Use a keep-alive service (but this uses up your free hours)

## Advanced: Testing Pull Requests

To test PRs before merging to `develop`:

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Push changes: `git push origin feature/new-feature`
3. CI tests will run automatically (but won't deploy)
4. Merge to `develop` when ready → Auto-deploys to staging
5. Test on staging
6. Merge `develop` to `main` → Auto-deploys to production

## Summary

✅ **Free staging environment on Render**  
✅ **Automatic deployments from develop branch**  
✅ **Same CI/CD pipeline as production**  
✅ **Zero additional cost**  
✅ **Easy rollback (just redeploy previous commit)**  

Need help? Check:
- [Render Documentation](https://render.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
