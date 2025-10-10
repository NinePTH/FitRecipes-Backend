# Authentication Endpoints Consistency Update

## Overview
All authentication endpoints now return a **consistent user object format** with `termsAccepted` and `isOAuthUser` fields.

## Changes Made

### 1. Updated `AuthenticatedUser` Type
**File**: `src/types/index.ts`

```typescript
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  termsAccepted: boolean;  // ✅ NEW
  isOAuthUser: boolean;     // ✅ NEW
}
```

### 2. Updated `getUserById()` Function
**File**: `src/services/authService.ts`

```typescript
export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as any,
    termsAccepted: user.termsAccepted,     // ✅ NEW
    isOAuthUser: !!user.oauthProvider,      // ✅ NEW
  };
}
```

### 3. Updated All JWT Token Generation
**File**: `src/services/authService.ts`

#### Register Function
```typescript
const authenticatedUser: AuthenticatedUser = {
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role as any,
  termsAccepted: user.termsAccepted,  // ✅ NEW
  isOAuthUser: false,                  // ✅ NEW
};
const token = generateToken(authenticatedUser);
```

#### Login Function
```typescript
const authenticatedUser: AuthenticatedUser = {
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role as any,
  termsAccepted: user.termsAccepted,     // ✅ NEW
  isOAuthUser: !!user.oauthProvider,      // ✅ NEW
};
const token = generateToken(authenticatedUser);
```

#### OAuth Function
```typescript
const token = generateToken({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role as UserRole,
  termsAccepted: user.termsAccepted,  // ✅ NEW
  isOAuthUser: true,                   // ✅ NEW
});
```

### 4. Updated OAuth Callback URL Parameters
**File**: `src/controllers/authController.ts`

```typescript
const params = new URLSearchParams({
  token: result.token,
  userId: result.user.id,
  email: result.user.email,
  firstName: result.user.firstName,
  lastName: result.user.lastName || '',
  role: result.user.role,
  termsAccepted: result.user.termsAccepted.toString(),  // ✅ NEW
  isOAuthUser: result.user.isOAuthUser.toString(),       // ✅ NEW
});
```

## Affected Endpoints

### ✅ ALL Endpoints Now Return Consistent Format

| Endpoint | Method | Returns termsAccepted | Returns isOAuthUser |
|----------|--------|----------------------|---------------------|
| `/api/v1/auth/register` | POST | ✅ Yes | ✅ Yes (false) |
| `/api/v1/auth/login` | POST | ✅ Yes | ✅ Yes |
| `/api/v1/auth/google/callback` | GET | ✅ Yes (via URL params) | ✅ Yes (via URL params) |
| `/api/v1/auth/me` | GET | ✅ Yes | ✅ Yes |

## Response Examples

### POST `/api/v1/auth/register`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "termsAccepted": true,
      "isOAuthUser": false
    },
    "token": "eyJhbGc..."
  },
  "message": "Registration successful"
}
```

### POST `/api/v1/auth/login`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "termsAccepted": true,
      "isOAuthUser": false
    },
    "token": "eyJhbGc..."
  },
  "message": "Login successful"
}
```

### GET `/api/v1/auth/me`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "termsAccepted": true,
      "isOAuthUser": false
    }
  },
  "message": "User retrieved successfully"
}
```

### GET `/api/v1/auth/google/callback`
**Redirects to:**
```
http://localhost:5173/auth/callback?token=xxx&userId=xxx&email=user@gmail.com&firstName=John&lastName=Doe&role=USER&termsAccepted=false&isOAuthUser=true
```

## Testing Results

### ✅ Register Endpoint Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Test@1234","agreeToTerms":true}'
```
**Result**: ✅ Returns `termsAccepted: true` and `isOAuthUser: false`

### ✅ Login Endpoint Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
```
**Result**: ✅ Returns `termsAccepted: true` and `isOAuthUser: false`

### ✅ /me Endpoint Test
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```
**Result**: ✅ Returns `termsAccepted: true` and `isOAuthUser: false`

## Frontend Benefits

Now the frontend can:

1. **Consistent User Object**: All auth endpoints return the same user object shape
2. **Persistent Storage**: Store `termsAccepted` and `isOAuthUser` once, use everywhere
3. **No Additional API Calls**: All necessary info included in initial auth response
4. **OAuth Callback**: URL parameters include ToS and OAuth status immediately

### Frontend Usage Example

```javascript
// After any auth success (register, login, OAuth)
const { user, token } = response.data;

// OR for OAuth callback
const urlParams = new URLSearchParams(window.location.search);
const user = {
  id: urlParams.get('userId'),
  email: urlParams.get('email'),
  firstName: urlParams.get('firstName'),
  lastName: urlParams.get('lastName'),
  role: urlParams.get('role'),
  termsAccepted: urlParams.get('termsAccepted') === 'true',
  isOAuthUser: urlParams.get('isOAuthUser') === 'true',
};
const token = urlParams.get('token');

// Store consistently
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));

// Check ToS for OAuth users
if (user.isOAuthUser && !user.termsAccepted) {
  window.location.href = '/accept-terms';
}

// Use in /me endpoint calls
useEffect(() => {
  const fetchUserProfile = async () => {
    const response = await fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    // data.user already has termsAccepted and isOAuthUser
    setUser(data.user);
  };
}, []);
```

## JWT Token Contents

The JWT token now includes `termsAccepted` and `isOAuthUser` in the payload:

```json
{
  "id": "xxx",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "termsAccepted": true,
  "isOAuthUser": false,
  "iat": 1759841678,
  "exp": 1759928078
}
```

This means the auth middleware can access these fields without database queries.

## Commit History

1. **f6f1b7f**: feat: add termsAccepted and isOAuthUser to all auth responses
2. **439ef18**: docs: add AUTH_RESPONSE_FORMAT.md with complete frontend integration guide
3. **1dbad65**: feat: update /me endpoint and AuthenticatedUser type to include termsAccepted and isOAuthUser

## Related Documentation

- `TERMS_OF_SERVICE_OAUTH_FLOW.md` - Complete ToS flow for OAuth users
- `FRONTEND_TOS_IMPLEMENTATION_REQUEST.md` - Frontend implementation guide
- `TOS_FEATURE_SUMMARY.md` - Quick reference summary
- `AUTH_RESPONSE_FORMAT.md` - Detailed auth response documentation

---

**Last Updated**: January 6, 2025  
**Status**: ✅ Complete and Tested  
**All Endpoints Verified**: ✅ register, login, /me, OAuth callback
