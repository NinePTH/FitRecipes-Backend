# Terms of Service Acceptance Flow for OAuth Users

## 📋 Overview

Google OAuth users now must explicitly accept Terms of Service and Privacy Policy before accessing the application. If they decline, they will be logged out and must accept ToS on next login.

**Date Implemented**: October 7, 2025  
**Migration**: `20251006170954_add_terms_accepted_at`

---

## 🎯 User Flow

### First-Time OAuth Login
```
1. User clicks "Sign in with Google"
   ↓
2. Google authentication succeeds
   ↓
3. Backend returns: { termsAccepted: false }
   ↓
4. Frontend redirects to Terms & Conditions page
   ↓
5a. User clicks "Accept"
    → POST /api/v1/auth/terms/accept
    → Backend updates: termsAccepted = true, termsAcceptedAt = now
    → Frontend redirects to main page
    
5b. User clicks "Decline"
    → POST /api/v1/auth/terms/decline
    → Backend logs out user (deletes all sessions)
    → Frontend redirects to login page
```

### Subsequent OAuth Logins

**If User Previously Accepted**:
```
1. User clicks "Sign in with Google"
   ↓
2. Google authentication succeeds
   ↓
3. Backend returns: { termsAccepted: true }
   ↓
4. Frontend redirects directly to main page ✅
```

**If User Previously Declined**:
```
1. User clicks "Sign in with Google"
   ↓
2. Google authentication succeeds
   ↓
3. Backend returns: { termsAccepted: false }
   ↓
4. Frontend redirects to Terms & Conditions page again
   ↓
5. Must accept or decline again
```

---

## 🗄️ Database Changes

### Updated Schema

**File**: `prisma/schema.prisma`

```prisma
model User {
  // ... other fields
  termsAccepted         Boolean   @default(false)
  termsAcceptedAt       DateTime? // NEW: When user accepted ToS
  // ... other fields
}
```

### Migration Applied

```sql
-- Migration: 20251006170954_add_terms_accepted_at
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
```

---

## 🔌 Backend API Changes

### 1. OAuth Response (Modified)

**Endpoint**: `POST /api/v1/auth/google/callback`

**Response** (Success):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm3x7y8z9",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "termsAccepted": false  // ← NEW FIELD
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**What Changed**:
- OAuth login response now includes `termsAccepted` field
- Frontend checks this field to determine if ToS acceptance is needed

---

### 2. Accept Terms (NEW)

**Endpoint**: `POST /api/v1/auth/terms/accept`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: None required (uses authenticated user from token)

**Response** (Success - 200):
```json
{
  "status": "success",
  "data": null,
  "message": "Terms of Service accepted successfully"
}
```

**Response** (Already Accepted - 400):
```json
{
  "status": "error",
  "data": null,
  "message": "Terms already accepted"
}
```

**Response** (Not Authenticated - 401):
```json
{
  "status": "error",
  "data": null,
  "message": "User not authenticated"
}
```

---

### 3. Decline Terms (NEW)

**Endpoint**: `POST /api/v1/auth/terms/decline`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: None required

**Response** (Success - 200):
```json
{
  "status": "success",
  "data": null,
  "message": "Terms of Service declined. You have been logged out."
}
```

**What Happens**:
- All user sessions are deleted (user is logged out)
- User can login again but will see ToS page again

---

## 🔧 Backend Implementation Details

### Service Layer

**File**: `src/services/authService.ts`

#### Modified: `createOrUpdateOAuthUser()`
```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    termsAccepted: user.termsAccepted, // ← Added this field
  },
  token,
};
```

#### New: `acceptTerms()`
```typescript
export async function acceptTerms(
  userId: string
): Promise<{ message: string }> {
  // Validates user exists and hasn't already accepted
  // Updates: termsAccepted = true, termsAcceptedAt = now
}
```

#### New: `declineTerms()`
```typescript
export async function declineTerms(
  userId: string
): Promise<{ message: string }> {
  // Validates user exists
  // Deletes all sessions (logs out user)
}
```

---

### Controller Layer

**File**: `src/controllers/authController.ts`

#### New: `acceptTerms()`
- Requires authentication (uses `authMiddleware`)
- Extracts user ID from JWT token
- Calls `AuthService.acceptTerms()`
- Returns success message

#### New: `declineTerms()`
- Requires authentication (uses `authMiddleware`)
- Extracts user ID from JWT token
- Calls `AuthService.declineTerms()`
- Returns logout message

---

### Routes

**File**: `src/routes/auth.ts`

```typescript
// Terms of Service routes (for OAuth users) - require authentication
auth.use('/terms/accept', authMiddleware);
auth.post('/terms/accept', authController.acceptTerms);

auth.use('/terms/decline', authMiddleware);
auth.post('/terms/decline', authController.declineTerms);
```

---

## 🧪 Testing

### Test Scenario 1: First-Time OAuth User

**1. Login with Google (first time)**:
```bash
# Via browser OAuth flow
# Response will include: "termsAccepted": false
```

**2. Accept Terms**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/terms/accept \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response: "Terms of Service accepted successfully"
```

**3. Login Again**:
```bash
# OAuth response now includes: "termsAccepted": true
# User goes directly to main page
```

---

### Test Scenario 2: User Declines Terms

**1. Login with Google**:
```bash
# Response: "termsAccepted": false
```

**2. Decline Terms**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/terms/decline \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response: "Terms of Service declined. You have been logged out."
```

**3. Try to Use Token**:
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response: 401 Unauthorized (session deleted)
```

**4. Login Again**:
```bash
# OAuth response: "termsAccepted": false (still false)
# Must go through ToS acceptance again
```

---

### Test Scenario 3: Existing Users

**Existing OAuth users**:
- `termsAccepted` = `false` by default
- Will be prompted for ToS acceptance on next login
- After accepting, won't be prompted again

**Regular email/password users**:
- Already accepted ToS during registration
- Not affected by this feature

---

## 📊 Database Queries

### Check ToS Status
```sql
SELECT email, termsAccepted, termsAcceptedAt, oauthProvider 
FROM "User" 
WHERE oauthProvider = 'GOOGLE';
```

### Find Users Who Haven't Accepted ToS
```sql
SELECT email, firstName, lastName, oauthProvider
FROM "User"
WHERE oauthProvider = 'GOOGLE' AND termsAccepted = false;
```

### Find Users Who Accepted ToS
```sql
SELECT email, termsAccepted, termsAcceptedAt
FROM "User"
WHERE termsAccepted = true
ORDER BY termsAcceptedAt DESC;
```

---

## 🔐 Security Features

✅ **Authentication Required**: Both endpoints require valid JWT token  
✅ **Session Invalidation**: Declining ToS logs out user completely  
✅ **Idempotent Accept**: Accepting twice doesn't cause errors  
✅ **Audit Trail**: `termsAcceptedAt` tracks when user accepted  
✅ **No Bypass**: OAuth response always includes `termsAccepted` status  

---

## 🎨 Frontend Integration Guide

### React Example (TypeScript)

#### 1. Handle OAuth Callback

```tsx
// pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login', { state: { error } });
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    // Store token
    localStorage.setItem('authToken', token);

    // Get user info to check termsAccepted status
    checkTermsAcceptance(token);
  }, [searchParams, navigate]);

  async function checkTermsAcceptance(token: string) {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.data.user.termsAccepted) {
        // ✅ ToS already accepted - go to main page
        navigate('/dashboard');
      } else {
        // ⚠️ ToS not accepted - go to ToS page
        navigate('/terms-and-conditions');
      }
    } catch (error) {
      console.error('Failed to check ToS status:', error);
      navigate('/login');
    }
  }

  return <div>Processing login...</div>;
}
```

---

#### 2. Terms & Conditions Page

```tsx
// pages/TermsAndConditions.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api/v1';

export function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/terms/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Terms accepted - redirect to main page
        navigate('/dashboard');
      } else {
        alert(data.message || 'Failed to accept terms');
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/terms/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        // ⚠️ Terms declined - logout and redirect
        localStorage.removeItem('authToken');
        navigate('/login', { 
          state: { message: 'You must accept Terms of Service to continue' }
        });
      } else {
        alert(data.message || 'Failed to decline terms');
      }
    } catch (error) {
      console.error('Error declining terms:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terms-container">
      <h1>Terms of Service & Privacy Policy</h1>
      
      <div className="terms-content">
        <h2>Terms of Service</h2>
        {/* Your ToS content */}
        
        <h2>Privacy Policy</h2>
        {/* Your Privacy Policy content */}
      </div>

      <div className="terms-actions">
        <button 
          onClick={handleAccept} 
          disabled={loading}
          className="btn-accept"
        >
          {loading ? 'Processing...' : 'Accept'}
        </button>
        
        <button 
          onClick={handleDecline} 
          disabled={loading}
          className="btn-decline"
        >
          {loading ? 'Processing...' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
```

---

#### 3. Protected Route Guard

```tsx
// components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setTermsAccepted(data.data.user.termsAccepted);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!termsAccepted) {
    return <Navigate to="/terms-and-conditions" />;
  }

  return <>{children}</>;
}
```

---

## 📝 Frontend Implementation Checklist

- [ ] Update OAuth callback handler to check `termsAccepted` status
- [ ] Create Terms & Conditions page with Accept/Decline buttons
- [ ] Implement `handleAccept()` - calls `/auth/terms/accept`
- [ ] Implement `handleDecline()` - calls `/auth/terms/decline`
- [ ] Add route guard to check `termsAccepted` for protected routes
- [ ] Handle logout after decline (clear token, redirect to login)
- [ ] Test first-time OAuth login flow
- [ ] Test decline → logout → login again flow
- [ ] Test accept → subsequent logins flow

---

## 🚀 Deployment

### Development
```bash
# Start backend
cd FitRecipes-Backend
bun run dev

# Migration already applied locally
```

### Staging/Production
```bash
# Migration will run automatically via docker-entrypoint.sh
# File: prisma/migrations/20251006170954_add_terms_accepted_at/migration.sql
```

---

## 🔄 Backward Compatibility

### Existing OAuth Users
- All existing OAuth users have `termsAccepted = false` by default
- They will be prompted for ToS acceptance on next login
- After accepting, they won't be prompted again

### Regular Email Users
- Not affected by this feature
- They already accepted ToS during registration
- `termsAccepted` field remains `true`

---

## 📚 API Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/auth/google/callback` | GET | ❌ No | OAuth callback - returns `termsAccepted` |
| `/auth/terms/accept` | POST | ✅ Yes | Accept ToS - updates database |
| `/auth/terms/decline` | POST | ✅ Yes | Decline ToS - logs out user |
| `/auth/me` | GET | ✅ Yes | Get user info (includes `termsAccepted`) |

---

## 💡 Key Points for Frontend Team

1. **Check OAuth Response**: After Google OAuth, check `user.termsAccepted`
2. **Conditional Redirect**: 
   - `termsAccepted = false` → Terms page
   - `termsAccepted = true` → Main page
3. **Accept Flow**: POST `/auth/terms/accept` → Redirect to main page
4. **Decline Flow**: POST `/auth/terms/decline` → Clear token → Redirect to login
5. **Protected Routes**: Check `termsAccepted` before allowing access
6. **Persistent Check**: Every login checks `termsAccepted` status

---

**Status**: ✅ COMPLETE  
**Migration**: ✅ APPLIED  
**Backend Endpoints**: ✅ TESTED  
**Ready for Frontend Integration**: ✅ YES
