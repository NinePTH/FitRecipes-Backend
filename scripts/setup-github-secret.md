# 🔧 Setting Up GitHub Secret for Deployment Verification

## Quick Setup Guide

### 1. Get Your Render App URL
After Render deployment completes, copy your app URL from the Render dashboard.

**Format**: `https://your-app-name.onrender.com` (**no trailing slash**)

### 2. Add to GitHub Secrets

1. Go to: `https://github.com/NinePTH/FitRecipes-Backend/settings/secrets/actions`
2. Click **"New repository secret"**
3. Set:
   - **Name**: `RENDER_APP_URL`
   - **Value**: Your actual Render URL

### 3. Test the Pipeline

Once the secret is added, future pushes to `main` will:

✅ **Run all tests and checks**  
✅ **Wait for Render deployment**  
✅ **Perform automated health checks**  
✅ **Verify API endpoints**  
✅ **Provide deployment summary**

## What the Enhanced Pipeline Does

### 🔄 **Deployment Process**
```
GitHub Push → CI/CD Tests → Render Auto-Deploy → Health Verification
     ↓              ↓              ↓                    ↓
   Tests Pass → Build Success → App Deployed → ✅ Verified Working
```

### 🏥 **Health Check Process**
- Waits up to 5 minutes for service to be ready
- Tests `/health` endpoint every 10 seconds
- Verifies API accessibility
- Provides detailed deployment summary

### 📊 **Success Output Example**
```
✅ All checks passed!
🚀 Triggering deployment to Render
⏳ Waiting for Render to complete deployment...
🏥 Performing health checks...
🎯 Health check URL: https://your-app.onrender.com/health
✅ Health check passed!
🎉 Deployment verified successfully
🧪 Testing API endpoints...
✅ Health endpoint working
✅ API endpoint accessible

📋 Deployment Summary
====================
🚀 App URL: https://your-app.onrender.com
🏥 Health: https://your-app.onrender.com/health
🔗 API: https://your-app.onrender.com/api/v1
```

### 🚨 **Failure Detection**
If deployment fails, the pipeline will:
- ❌ Fail the GitHub Action
- 📧 Send failure notifications
- 🔍 Provide debugging information
- 📞 Direct you to check Render logs

## Manual Testing Commands

Once your app is deployed, you can test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# API accessibility
curl https://your-app.onrender.com/api/v1

# Test with detailed response
curl -i https://your-app.onrender.com/health
```

## Troubleshooting

### Secret Not Working?
- Ensure URL has no trailing slash
- Format: `https://app-name.onrender.com`
- Secret name must be exactly: `RENDER_APP_URL`

### Health Check Failing?
- Check Render service logs
- Verify `/health` endpoint is working
- Ensure Render deployment completed successfully

### Need to Update URL?
- Go to GitHub repository settings
- Update the `RENDER_APP_URL` secret value
- Next push will use the updated URL