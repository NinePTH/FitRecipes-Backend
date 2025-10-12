# Complete Authentication Guide

## Overview
FitRecipes Backend uses JWT-based authentication with support for:
- Email/Password registration and login
- Google OAuth 2.0
- Email verification
- Password reset flow
- Terms of Service acceptance (for OAuth users)

All authentication endpoints return a **consistent user object format** with `termsAccepted` and `isOAuthUser` fields.

---

## 🔐 Authentication Endpoints

### Base URL: `/api/v1/auth`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/register` | POST | Register new user | No |
| `/login` | POST | Login with email/password | No |
| `/logout` | POST | Logout and invalidate session | Yes |
| `/me` | GET | Get current user profile | Yes |
| `/forgot-password` | POST | Request password reset | No |
| `/reset-password` | POST | Reset password with token | No |
| `/verify-email/:token` | GET | Verify email address | No |
| `/resend-verification` | POST | Resend verification email | No |
| `/google` | GET | Initiate Google OAuth | No |
| `/google/callback` | GET | Google OAuth callback | No |
| `/google/mobile` | POST | Google OAuth for mobile | No |
| `/terms/accept` | POST | Accept Terms of Service | Yes |
| `/terms/decline` | POST | Decline ToS (logout) | Yes |

---

## 📝 Standard Response Format

All authentication responses return consistent user objects:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "user|chef|admin",
      "termsAccepted": boolean,
      "isOAuthUser": boolean
    },
    "token": "jwt-token-string"
  },
  "message": "Success message"
}
```

### Field Descriptions:
- **`termsAccepted`**: Whether user has accepted Terms of Service (OAuth users must accept after first login)
- **`isOAuthUser`**: Whether user signed up via OAuth (Google) or email/password

---

## 🚀 Email/Password Authentication

### 1. Registration

**Endpoint**: `POST /api/v1/auth/register`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "agreeToTerms": true
}
```

**Response** (201):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "john@example.com",
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

**Notes**:
- Verification email sent automatically (async)
- Users can login before verifying email
- `termsAccepted` is always `true` (accepted during registration)
- `isOAuthUser` is always `false` for email/password registration

### 2. Login

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "john@example.com",
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

**Error Responses**:
- `401`: Invalid email or password
- `401`: Account is blocked (too many failed attempts)
- `400`: OAuth user trying password login

---

## 🔑 Google OAuth Authentication

### Flow Overview:
1. Frontend redirects to `/api/v1/auth/google`
2. User authenticates with Google
3. Google redirects to `/api/v1/auth/google/callback`
4. Backend creates/updates user and redirects to frontend with URL parameters

### 1. Initiate OAuth

**Endpoint**: `GET /api/v1/auth/google`

Redirects user to Google OAuth consent screen.

### 2. OAuth Callback

**Endpoint**: `GET /api/v1/auth/google/callback`

**Redirect URL Format**:
```
http://localhost:5173/auth/callback?token=xxx&userId=xxx&email=xxx&firstName=xxx&lastName=xxx&role=user&termsAccepted=false&isOAuthUser=true
```

**URL Parameters**:
- `token`: JWT authentication token
- `userId`: User ID
- `email`: User email
- `firstName`: User first name
- `lastName`: User last name
- `role`: User role
- **`termsAccepted`**: `false` for first-time OAuth users, `true` if previously accepted
- **`isOAuthUser`**: Always `true` for OAuth users

**Frontend Implementation**:
```javascript
// Parse URL parameters
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

// Store authentication
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));

// Check if user needs to accept Terms of Service
if (user.isOAuthUser && !user.termsAccepted) {
  window.location.href = '/accept-terms';
} else {
  window.location.href = '/dashboard';
}
```

### OAuth User Behavior:
- **First Login**: User created with `termsAccepted: false`, must accept ToS
- **Account Linking**: If email exists, links OAuth to existing account
- **Email Verified**: OAuth users are automatically email-verified
- **Password Login**: OAuth users cannot login with password (error message guides them to OAuth)

---

## ✉️ Email Verification

### 1. Verify Email

**Endpoint**: `GET /api/v1/auth/verify-email/:token`

**Example**: `GET /api/v1/auth/verify-email/abc123def456`

**Response** (200):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**Frontend Integration**:
```javascript
// Email template includes link like:
// http://localhost:5173/verify-email/abc123def456

// Frontend route handler:
useEffect(() => {
  const { token } = useParams();
  
  fetch(`/api/v1/auth/verify-email/${token}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        // Show success message
        // Redirect to login or dashboard
      }
    });
}, []);
```

### 2. Resend Verification Email

**Endpoint**: `POST /api/v1/auth/resend-verification`

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

---

## 🔄 Password Reset

### 1. Request Password Reset

**Endpoint**: `POST /api/v1/auth/forgot-password`

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Password reset email sent"
}
```

**Notes**:
- Always returns success (security: don't reveal if email exists)
- Reset token valid for 1 hour
- Email contains link: `http://localhost:5173/reset-password?token=xxx`

### 2. Reset Password

**Endpoint**: `POST /api/v1/auth/reset-password`

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

## ✅ Terms of Service Acceptance (OAuth Users)

### 1. Accept Terms

**Endpoint**: `POST /api/v1/auth/terms/accept`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": "success",
  "message": "Terms accepted successfully",
  "data": {
    "termsAccepted": true,
    "termsAcceptedAt": "2025-10-07T12:00:00Z"
  }
}
```

### 2. Decline Terms (Logout)

**Endpoint**: `POST /api/v1/auth/terms/decline`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": "success",
  "message": "Terms declined. You have been logged out."
}
```

**Notes**:
- Declining ToS logs the user out (deletes all sessions)
- User can login again later and accept ToS

---

## 👤 Get Current User

**Endpoint**: `GET /api/v1/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "john@example.com",
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

---

## 🔒 Security Features

### Password Requirements:
- Minimum 6 characters
- Must contain at least one number
- Must contain at least one uppercase letter
- Must contain at least one special character

### Rate Limiting:
- 100 requests per 15 minutes per IP
- Configurable in `.env`: `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`

### Failed Login Protection:
- Maximum 5 failed attempts
- Account blocked for 15 minutes after 5 failures
- Counter resets on successful login or password reset

### Session Management:
- JWT tokens expire after 24 hours
- Sessions stored in database with expiration
- Logout invalidates session immediately

### OAuth Security:
- CSRF protection via state parameter
- Authorization code flow (not implicit)
- Secure token exchange with Google API

---

## 🎨 Frontend Integration Examples

### Complete Authentication Flow

```javascript
// 1. Registration
async function register(userData) {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  
  if (data.status === 'success') {
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data.user;
  }
}

// 2. Login
async function login(email, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  if (data.status === 'success') {
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data.user;
  }
}

// 3. Check Authentication on App Load
useEffect(() => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (token && user) {
    // Verify token is still valid
    fetch('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        setUser(data.data.user);
        
        // Check if OAuth user needs to accept ToS
        if (data.data.user.isOAuthUser && !data.data.user.termsAccepted) {
          navigate('/accept-terms');
        }
      } else {
        // Token invalid, logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    });
  }
}, []);

// 4. Protected API Calls
async function makeAuthenticatedRequest(url) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
}

// 5. Logout
async function logout() {
  const token = localStorage.getItem('authToken');
  
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  navigate('/login');
}
```

---

## 🧪 Testing

All authentication endpoints have comprehensive test coverage in:
- `tests/services/authService.test.ts` - Service layer tests
- `tests/controllers/authController.test.ts` - Controller tests

**Run tests**:
```bash
bun run test
bun run test:coverage
```

**Test coverage**: 35+ tests covering all auth flows

---

## 📚 Related Documentation

- `AUTH_ENDPOINTS_CONSISTENCY.md` - Technical implementation details
- `AUTH_RESPONSE_FORMAT.md` - Frontend response format guide
- `TERMS_OF_SERVICE_OAUTH_FLOW.md` - Detailed ToS flow documentation
- `EMAIL_VERIFICATION_FRONTEND_INTEGRATION.md` - Email verification setup
- `OAUTH_FRONTEND_INTEGRATION.md` - OAuth implementation guide

---

**Last Updated**: January 7, 2025  
**Status**: ✅ Production Ready
