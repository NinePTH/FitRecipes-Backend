# Google OAuth Frontend Integration Guide

This guide explains how to integrate Google OAuth authentication in the frontend after the backend changes.

## 🔄 OAuth Flow Overview

### Complete OAuth Flow (Backend → Frontend)

1. **User Initiates OAuth**: User clicks "Sign in with Google" on frontend
2. **Get Authorization URL**: Frontend calls `GET /api/v1/auth/google`
3. **Redirect to Google**: Frontend redirects user to the returned Google authorization URL
4. **User Authenticates**: User logs in with Google and grants permissions
5. **Google Redirects**: Google redirects back to backend callback URL with code
6. **Backend Processes**: Backend exchanges code for user info, creates/updates user
7. **Backend Redirects**: Backend redirects to **frontend callback page** with token in URL
8. **Frontend Extracts Token**: Frontend extracts token from URL parameters
9. **Store Token**: Frontend stores token in localStorage/sessionStorage
10. **User Logged In**: Redirect user to dashboard

## 🎯 Backend Behavior (Updated)

### OAuth Callback Endpoint: `GET /api/v1/auth/google/callback`

**Success Response** (HTTP 302 Redirect):
```
Location: http://localhost:5173/auth/callback?token={jwt_token}&userId={id}&email={email}&firstName={name}&lastName={name}&role={role}
```

**Error Response** (HTTP 302 Redirect):
```
Location: http://localhost:5173/auth?error={error_code}&message={error_message}
```

### Error Codes

- `missing_code` - Authorization code not provided by Google
- `oauth_failed` - General OAuth failure (token exchange or user fetch failed)
- `oauth_not_implemented` - OAuth user creation not yet implemented (shouldn't happen in production)

## 📝 Frontend Implementation Steps

### 1. Update OAuth Callback Route

Create a new route in your frontend: `/auth/callback`

```typescript
// In your router configuration
<Route path="/auth/callback" element={<OAuthCallbackPage />} />
```

### 2. Create OAuth Callback Page Component

This page extracts the token from URL and completes the login:

```typescript
// src/pages/OAuthCallbackPage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const role = searchParams.get('role');

    if (token && userId && email) {
      // Store token
      localStorage.setItem('authToken', token);
      
      // Store user info (optional)
      const user = {
        id: userId,
        email,
        firstName,
        lastName: lastName || '',
        role: role || 'USER'
      };
      localStorage.setItem('user', JSON.stringify(user));

      // Show success message
      // toast.success('Successfully logged in with Google!');

      // Redirect to dashboard/home
      navigate('/dashboard', { replace: true });
    } else {
      // Missing required parameters
      navigate('/auth?error=invalid_callback', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
```

### 3. Update Auth Page to Handle Errors

Update your login/auth page to display OAuth errors:

```typescript
// In your AuthPage component
import { useSearchParams } from 'react-router-dom';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  useEffect(() => {
    if (error) {
      let message = 'Authentication failed';
      
      switch (error) {
        case 'missing_code':
          message = 'Authorization code missing. Please try again.';
          break;
        case 'oauth_failed':
          message = errorMessage || 'Google authentication failed';
          break;
        case 'invalid_callback':
          message = 'Invalid authentication response';
          break;
      }
      
      // Show error to user (toast, alert, etc.)
      // toast.error(message);
    }
  }, [error, errorMessage]);

  // Rest of your auth page...
}
```

### 4. Update OAuth Button Click Handler

Make sure your "Sign in with Google" button initiates the OAuth flow correctly:

```typescript
async function handleGoogleSignIn() {
  try {
    setLoading(true);
    
    // Call backend to get authorization URL
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`);
    const data = await response.json();
    
    if (data.status === 'success' && data.data?.authUrl) {
      // Redirect to Google authorization page
      window.location.href = data.data.authUrl;
    } else {
      throw new Error('Failed to get authorization URL');
    }
  } catch (error) {
    console.error('OAuth initiation failed:', error);
    // Show error to user
  } finally {
    setLoading(false);
  }
}
```

## 🔒 Security Considerations

### Token Storage

**Options**:
1. **localStorage** - Persists across sessions, vulnerable to XSS
2. **sessionStorage** - Cleared when tab closes, more secure
3. **Memory only** - Most secure, but lost on refresh

**Recommendation**: Use `localStorage` for better UX, but ensure your app is protected against XSS attacks.

### HTTPS in Production

**Critical**: Always use HTTPS in production to prevent token interception.

### Token Validation

After extracting the token from URL:
1. Verify it's a valid JWT format
2. Optionally verify the token with the backend
3. Set expiration handling (backend tokens expire after 24h)

## 🧪 Testing the Flow

### Local Testing

1. Start backend: `bun run dev` (http://localhost:3000)
2. Start frontend: `npm run dev` (http://localhost:5173)
3. Click "Sign in with Google"
4. You should be redirected through:
   - Google login page
   - Backend callback
   - **Frontend callback page** (`/auth/callback`)
   - Dashboard/home page

### Check URL Parameters

When you land on `/auth/callback`, the URL should look like:
```
http://localhost:5173/auth/callback?token=eyJhbGc...&userId=123&email=user@example.com&firstName=John&lastName=Doe&role=USER
```

### Debugging

If stuck on backend URL:
1. Check `FRONTEND_URL` in backend `.env`
2. Verify it matches your frontend URL exactly
3. Restart backend after changing environment variables

## 📋 Complete Example Flow

### 1. User Clicks OAuth Button
```typescript
// Frontend initiates OAuth
window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?...';
```

### 2. Google Redirects to Backend
```
http://localhost:3000/api/v1/auth/google/callback?code=4/0AVGz...&state=ptggh24icc
```

### 3. Backend Processes and Redirects to Frontend
```
HTTP/1.1 302 Found
Location: http://localhost:5173/auth/callback?token=eyJhbGc...&userId=123&email=user@example.com...
```

### 4. Frontend Extracts Token
```typescript
const token = searchParams.get('token');
localStorage.setItem('authToken', token);
navigate('/dashboard');
```

## 🚀 Environment Configuration

### Backend `.env`
```bash
FRONTEND_URL=http://localhost:5173  # Development
# FRONTEND_URL=https://fitrecipes.vercel.app  # Production
# FRONTEND_URL=https://fitrecipes-staging.vercel.app  # Staging
```

### Frontend `.env`
```bash
VITE_API_BASE_URL=http://localhost:3000  # Development
# VITE_API_BASE_URL=https://fitrecipes-backend.onrender.com  # Production
# VITE_API_BASE_URL=https://fitrecipes-backend-staging.onrender.com  # Staging
```

### Google Cloud Console

**Authorized redirect URIs must include**:
- `http://localhost:3000/api/v1/auth/google/callback` (Development)
- `https://fitrecipes-backend.onrender.com/api/v1/auth/google/callback` (Production)
- `https://fitrecipes-backend-staging.onrender.com/api/v1/auth/google/callback` (Staging)

**Authorized JavaScript origins**:
- `http://localhost:5173` (Development)
- `https://fitrecipes.vercel.app` (Production)
- `https://fitrecipes-staging.vercel.app` (Staging)

## ⚠️ Common Issues

### Issue: Stuck on Backend URL
**Cause**: Backend not redirecting to frontend
**Solution**: Backend now redirects automatically (fixed in latest version)

### Issue: Token Not Found in URL
**Cause**: OAuth flow failed before redirect
**Solution**: Check backend logs for errors, verify Google OAuth credentials

### Issue: CORS Error
**Cause**: Frontend URL not in backend CORS_ORIGIN
**Solution**: Update `CORS_ORIGIN` in backend `.env` to include your frontend URL

### Issue: Invalid Redirect URI
**Cause**: Google OAuth redirect URI not configured
**Solution**: Add backend callback URL to Google Cloud Console

## 📚 Related Documentation

- `docs/oauth-implementation.md` - Complete OAuth implementation details
- `docs/DEPLOYMENT_URLS.md` - Environment URLs and configuration
- `.github/copilot-instructions.md` - Project overview and architecture

## 🎯 Success Criteria

- ✅ User clicks "Sign in with Google" → Redirected to Google
- ✅ User logs in with Google → Redirected back to **frontend** (not backend)
- ✅ Token extracted from URL and stored
- ✅ User automatically logged in and redirected to dashboard
- ✅ Error messages displayed clearly if OAuth fails
- ✅ Works in development, staging, and production environments
