# Authentication Response Format

## Overview
All authentication endpoints (register, login, OAuth) now return a consistent response format that includes:
- `termsAccepted`: Boolean indicating if the user has accepted Terms of Service
- `isOAuthUser`: Boolean indicating if the user signed up via OAuth (Google)

## Response Structure

```typescript
interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    termsAccepted: boolean;  // ✅ NEW: ToS acceptance status
    isOAuthUser: boolean;     // ✅ NEW: OAuth user indicator
  };
  token: string;
}
```

## Endpoint Behaviors

### 1. POST `/api/v1/auth/register`
**Regular email/password registration**

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
      "termsAccepted": true,    // Always true (required during registration)
      "isOAuthUser": false       // Always false (email/password registration)
    },
    "token": "eyJhbGc..."
  }
}
```

**Frontend Usage:**
```javascript
// After successful registration
const { user, token } = response.data;
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));

// Check if user needs to accept ToS (already done during registration)
if (!user.termsAccepted) {
  // Redirect to ToS acceptance page (won't happen for regular registration)
}
```

---

### 2. POST `/api/v1/auth/login`
**Email/password login**

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
      "termsAccepted": true,     // Depends on user's current status
      "isOAuthUser": false        // false if registered via email/password
    },
    "token": "eyJhbGc..."
  }
}
```

**OR (if user linked Google OAuth later):**

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
      "isOAuthUser": true         // true if user has linked Google OAuth
    },
    "token": "eyJhbGc..."
  }
}
```

**Frontend Usage:**
```javascript
// After successful login
const { user, token } = response.data;
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));

// Check OAuth status
if (user.isOAuthUser) {
  // Display OAuth badge in profile
  showOAuthBadge();
}

// Check ToS status (shouldn't be false for regular users)
if (!user.termsAccepted) {
  // Redirect to ToS acceptance page (edge case)
  redirectToToSPage();
}
```

---

### 3. GET `/api/v1/auth/google/callback`
**Google OAuth login/registration**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "termsAccepted": false,    // ⚠️ IMPORTANT: false for first-time OAuth users
      "isOAuthUser": true         // Always true for OAuth users
    },
    "token": "eyJhbGc..."
  }
}
```

**Frontend Usage:**
```javascript
// After OAuth callback redirect
const urlParams = new URLSearchParams(window.location.search);
const authData = JSON.parse(urlParams.get('user'));
const token = urlParams.get('token');

localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(authData.user));

// ⚠️ CRITICAL: Check ToS acceptance for OAuth users
if (authData.user.isOAuthUser && !authData.user.termsAccepted) {
  // Redirect to ToS acceptance page
  window.location.href = '/accept-terms';
} else {
  // Proceed to dashboard
  window.location.href = '/dashboard';
}
```

---

## Frontend Storage Strategy

### Store in localStorage/sessionStorage:
```javascript
// After any authentication success
const authData = {
  token: response.data.token,
  user: {
    id: response.data.user.id,
    email: response.data.user.email,
    firstName: response.data.user.firstName,
    lastName: response.data.user.lastName,
    role: response.data.user.role,
    termsAccepted: response.data.user.termsAccepted,  // ✅ Store for ToS checks
    isOAuthUser: response.data.user.isOAuthUser        // ✅ Store for UI conditionals
  }
};

localStorage.setItem('authToken', authData.token);
localStorage.setItem('user', JSON.stringify(authData.user));
```

### Check on App Load:
```javascript
// In App.jsx or root component
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('authToken');
  
  if (user && token) {
    // User is logged in
    
    // Check if OAuth user needs to accept ToS
    if (user.isOAuthUser && !user.termsAccepted) {
      // Force redirect to ToS page
      if (window.location.pathname !== '/accept-terms') {
        window.location.href = '/accept-terms';
      }
    }
  }
}, []);
```

---

## Conditional UI Rendering

### Example React Component:
```jsx
function UserProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  return (
    <div className="user-profile">
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.email}</p>
      
      {/* Show OAuth badge for OAuth users */}
      {user.isOAuthUser && (
        <div className="oauth-badge">
          <GoogleIcon />
          <span>Signed in with Google</span>
        </div>
      )}
      
      {/* Show ToS acceptance status */}
      {user.termsAccepted ? (
        <div className="tos-accepted">
          <CheckIcon />
          <span>Terms Accepted</span>
        </div>
      ) : (
        <div className="tos-pending">
          <WarningIcon />
          <span>Please accept Terms of Service</span>
          <button onClick={() => navigate('/accept-terms')}>
            Accept Now
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Testing

### Test Cases:
1. ✅ **Regular Registration**: `termsAccepted=true`, `isOAuthUser=false`
2. ✅ **Regular Login**: `termsAccepted=true`, `isOAuthUser=false`
3. ⚠️ **OAuth First Login**: `termsAccepted=false`, `isOAuthUser=true` (test pending)
4. ⚠️ **OAuth After ToS**: `termsAccepted=true`, `isOAuthUser=true` (test pending)

### Test Commands:
```bash
# Test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Test@1234","agreeToTerms":true}'

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'

# Test OAuth callback (requires Google OAuth setup)
# Visit: http://localhost:3000/api/v1/auth/google
```

---

## Related Documentation
- `TERMS_OF_SERVICE_OAUTH_FLOW.md` - Complete ToS flow for OAuth users
- `FRONTEND_TOS_IMPLEMENTATION_REQUEST.md` - Frontend implementation guide
- `TOS_FEATURE_SUMMARY.md` - Quick reference summary

---

## Commit History
- **f6f1b7f**: feat: add termsAccepted and isOAuthUser to all auth responses
- **3efd499**: feat: add ToS acceptance flow for OAuth users
- **Previous**: Email verification system implementation

---

## Next Steps for Frontend
1. Update login/register pages to store `termsAccepted` and `isOAuthUser`
2. Create ToS acceptance page component
3. Add OAuth badge to user profile
4. Implement ToS check on app load for OAuth users
5. Add conditional UI based on `isOAuthUser` status

---

**Last Updated**: January 6, 2025  
**Status**: ✅ Complete and Tested
