# Authentication System - Technical Documentation

**Feature**: User Authentication & Authorization  
**Version**: 1.0  
**Status**: ✅ Complete  
**Last Updated**: October 31, 2025

---

## 📋 Overview

The authentication system provides secure user registration, login, email verification, password reset, Google OAuth integration, and role-based access control (RBAC).

---

## 🎯 Features

- ✅ Email/Password Authentication
- ✅ Google OAuth 2.0 Integration
- ✅ Email Verification (optional)
- ✅ Password Reset Flow
- ✅ Session Management (JWT + Database)
- ✅ Role-Based Access Control (USER, CHEF, ADMIN)
- ✅ Account Security (rate limiting, failed login tracking)
- ✅ Terms of Service Acceptance (OAuth users)

---

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph "Client Applications"
        WEB[Web Browser]
        MOBILE[Mobile App]
    end

    subgraph "Authentication Endpoints"
        REG[POST /auth/register]
        LOGIN[POST /auth/login]
        LOGOUT[POST /auth/logout]
        GOOGLE[GET /auth/google]
        CALLBACK[GET /auth/google/callback]
        VERIFY[GET /auth/verify-email/:token]
        FORGOT[POST /auth/forgot-password]
        RESET[POST /auth/reset-password]
        RESEND[POST /auth/resend-verification]
        ME[GET /auth/me]
        ACCEPT[POST /auth/terms/accept]
    end

    subgraph "Middleware Layer"
        AUTH_MW[authMiddleware<br/>JWT Verification]
        RATE_MW[rateLimitMiddleware<br/>100 req/15min]
    end

    subgraph "Auth Service"
        REG_SVC[registerUser]
        LOGIN_SVC[loginUser]
        OAUTH_SVC[handleGoogleOAuth]
        VERIFY_SVC[verifyEmail]
        RESET_SVC[resetPassword]
        TOKEN_SVC[generateToken]
    end

    subgraph "Data Layer"
        USER_TBL[(User Table)]
        SESSION_TBL[(Session Table)]
    end

    subgraph "External Services"
        GOOGLE_API[Google OAuth API]
        EMAIL_SVC[Resend Email Service]
    end

    WEB --> REG
    WEB --> LOGIN
    WEB --> GOOGLE
    MOBILE --> LOGIN
    MOBILE --> GOOGLE

    REG --> RATE_MW
    LOGIN --> RATE_MW
    LOGOUT --> AUTH_MW
    ME --> AUTH_MW
    ACCEPT --> AUTH_MW

    RATE_MW --> REG_SVC
    RATE_MW --> LOGIN_SVC
    AUTH_MW --> LOGOUT

    GOOGLE --> GOOGLE_API
    CALLBACK --> OAUTH_SVC
    VERIFY --> VERIFY_SVC
    RESET --> RESET_SVC

    REG_SVC --> USER_TBL
    REG_SVC --> EMAIL_SVC
    LOGIN_SVC --> USER_TBL
    LOGIN_SVC --> SESSION_TBL
    LOGIN_SVC --> TOKEN_SVC
    OAUTH_SVC --> USER_TBL
    OAUTH_SVC --> SESSION_TBL
    VERIFY_SVC --> USER_TBL
    RESET_SVC --> USER_TBL

    style WEB fill:#e3f2fd
    style MOBILE fill:#e3f2fd
    style USER_TBL fill:#c8e6c9
    style SESSION_TBL fill:#c8e6c9
    style GOOGLE_API fill:#fff3e0
    style EMAIL_SVC fill:#fff3e0
```

---

## 🔐 Authentication Flows

### 1. Email/Password Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant AuthService
    participant Database
    participant Email

    User->>API: POST /auth/register<br/>{email, password, firstName, lastName}
    API->>API: Validate Input (Zod)
    
    alt Invalid Input
        API-->>User: 400 Bad Request
    end

    API->>AuthService: registerUser()
    AuthService->>Database: Check Email Exists
    
    alt Email Already Exists
        Database-->>AuthService: Found
        AuthService-->>API: Error
        API-->>User: 409 Conflict
    end

    AuthService->>AuthService: Hash Password (bcrypt)
    AuthService->>Database: Create User<br/>(emailVerified: false)
    Database-->>AuthService: User Created

    AuthService->>AuthService: Generate Verification Token
    AuthService->>Database: Save Token to User
    AuthService->>Email: Send Verification Email (async)
    
    AuthService->>AuthService: Generate JWT Token
    AuthService->>Database: Create Session
    
    AuthService-->>API: {user, token}
    API-->>User: 201 Created<br/>{user, token}
    
    Note over Email,User: Email sent asynchronously
    Email-->>User: Verification Email with Link
```

### 2. Email/Password Login Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant AuthService
    participant Database

    User->>API: POST /auth/login<br/>{email, password}
    API->>API: Validate Input (Zod)
    API->>AuthService: loginUser()
    
    AuthService->>Database: Find User by Email
    
    alt User Not Found
        Database-->>AuthService: Not Found
        AuthService-->>API: Error
        API-->>User: 401 Invalid Credentials
    end

    AuthService->>AuthService: Check Account Locked
    
    alt Account Locked
        AuthService-->>API: Account Locked
        API-->>User: 403 Account Locked (15 min)
    end

    AuthService->>AuthService: Compare Password (bcrypt)
    
    alt Wrong Password
        AuthService->>Database: Increment failedLoginAttempts
        
        alt failedLoginAttempts >= 5
            AuthService->>Database: Set lastFailedLoginAt
            AuthService-->>API: Account Locked
            API-->>User: 403 Account Locked
        else
            AuthService-->>API: Invalid Password
            API-->>User: 401 Invalid Credentials
        end
    end

    AuthService->>Database: Reset failedLoginAttempts to 0
    AuthService->>AuthService: Generate JWT Token
    AuthService->>Database: Create Session
    Database-->>AuthService: Session Created
    
    AuthService-->>API: {user, token}
    API-->>User: 200 OK<br/>{user, token}
```

### 3. Google OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Google
    participant Database

    User->>Frontend: Click "Sign in with Google"
    Frontend->>API: GET /auth/google
    API->>API: Generate State Token (CSRF)
    API-->>Frontend: Redirect to Google
    
    Frontend->>Google: Authorization Request<br/>+ state parameter
    Google->>User: Google Login Page
    User->>Google: Enter Credentials & Consent
    Google-->>Frontend: Redirect with code & state
    
    Frontend->>API: GET /auth/google/callback<br/>?code=xxx&state=xxx
    API->>API: Verify State Token
    
    alt Invalid State
        API-->>Frontend: 400 Invalid State
    end

    API->>Google: Exchange Code for Token
    Google-->>API: Access Token + Profile
    
    API->>Database: Find User by Email
    
    alt User Exists (Email/Password)
        Database-->>API: User Found
        API->>Database: Update googleId<br/>Link OAuth Account
    else User Exists (OAuth)
        Database-->>API: OAuth User Found
        API->>API: Use Existing User
    else New User
        API->>Database: Create User<br/>emailVerified: true<br/>termsAccepted: false
    end

    API->>API: Generate JWT Token
    API->>Database: Create Session
    
    alt New OAuth User
        API-->>Frontend: Redirect to /terms<br/>+ token
    else Existing User
        API-->>Frontend: Redirect to /dashboard<br/>+ token
    end
```

### 4. Email Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant Email
    participant Browser
    participant API
    participant Database

    Note over User,Email: After Registration
    Email->>User: Verification Email
    User->>Email: Click Verification Link
    Email->>Browser: Open Link
    Browser->>API: GET /auth/verify-email/:token
    
    API->>Database: Find User by Token
    
    alt Token Not Found
        Database-->>API: Not Found
        API-->>Browser: 400 Invalid Token
    end

    API->>API: Check Token Expiration (24h)
    
    alt Token Expired
        API-->>Browser: 400 Token Expired
    end

    API->>Database: Update emailVerified: true<br/>Clear verificationToken
    Database-->>API: Success
    
    API-->>Browser: 200 OK<br/>Email Verified Message
    Browser-->>User: Success Page
```

### 5. Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Database
    participant Email

    User->>API: POST /auth/forgot-password<br/>{email}
    API->>Database: Find User by Email
    
    alt User Not Found
        Note over API: Silent Success (Security)
        API-->>User: 200 OK (Email Sent)
    end

    API->>API: Generate Reset Token (32 chars)
    API->>Database: Save Token + Expiration (1h)
    API->>Email: Send Reset Email
    API-->>User: 200 OK (Email Sent)

    Email-->>User: Reset Email with Link
    User->>Email: Click Reset Link
    Email->>User: Open Reset Form

    User->>API: POST /auth/reset-password<br/>{token, newPassword}
    API->>Database: Find User by Token
    
    alt Invalid Token
        Database-->>API: Not Found
        API-->>User: 400 Invalid Token
    end

    API->>API: Check Token Expiration (1h)
    
    alt Expired
        API-->>User: 400 Token Expired
    end

    API->>API: Hash New Password (bcrypt)
    API->>Database: Update Password<br/>Reset failedLoginAttempts<br/>Clear resetToken
    Database-->>API: Success
    
    API-->>User: 200 OK (Password Reset)
```

---

## 🗄️ Database Schema

### User Model

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String?   // Nullable for OAuth users
  firstName             String
  lastName              String
  role                  UserRole  @default(USER)
  googleId              String?   @unique
  oauthProvider         String?
  emailVerified         Boolean   @default(false)
  verificationToken     String?   @unique
  verificationExpires   DateTime?
  resetPasswordToken    String?   @unique
  resetPasswordExpires  DateTime?
  failedLoginAttempts   Int       @default(0)
  lastFailedLoginAt     DateTime?
  termsAccepted         Boolean   @default(true)
  termsAcceptedAt       DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  sessions              Session[]
  recipes               Recipe[]
  ratings               Rating[]
  comments              Comment[]

  @@map("users")
}

enum UserRole {
  USER
  CHEF
  ADMIN
}
```

### Session Model

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

---

## 🔒 Security Features

### 1. Password Security
- **Hashing Algorithm**: bcrypt with configurable rounds (default: 10)
- **Password Requirements**: 
  - Minimum 6 characters
  - Validated via Zod schema
  - Never stored in plain text

### 2. JWT Token Security
- **Algorithm**: HS256
- **Expiration**: 24 hours (configurable)
- **Secret**: Minimum 32 characters
- **Payload**: `{userId, email, role}`
- **Storage**: Database sessions table

### 3. Account Protection
- **Failed Login Limit**: 5 attempts
- **Lockout Duration**: 15 minutes
- **Auto-Reset**: On successful login or password reset
- **Rate Limiting**: 100 requests per 15 minutes per IP

### 4. Token Security
- **Verification Token**: 32 random characters, 24h expiration
- **Reset Token**: 32 random characters, 1h expiration
- **OAuth State Token**: CSRF protection

### 5. Email Security
- **Domain Validation**: Email format validation
- **Unique Constraint**: Database-level unique email
- **Case Insensitivity**: Lowercase conversion

---

## 🎯 Role-Based Access Control (RBAC)

```mermaid
graph LR
    subgraph "Roles"
        USER[USER<br/>Default Role]
        CHEF[CHEF<br/>Recipe Creator]
        ADMIN[ADMIN<br/>Full Access]
    end

    subgraph "Permissions"
        VIEW[View Approved Recipes]
        RATE[Rate & Comment]
        CREATE[Create Recipes]
        UPDATE[Update Own Recipes]
        DELETE_OWN[Delete Own Recipes]
        APPROVE[Approve/Reject Recipes]
        DELETE_ANY[Delete Any Recipe/Comment]
        MANAGE[Manage Users]
    end

    USER --> VIEW
    USER --> RATE

    CHEF --> VIEW
    CHEF --> RATE
    CHEF --> CREATE
    CHEF --> UPDATE
    CHEF --> DELETE_OWN

    ADMIN --> VIEW
    ADMIN --> RATE
    ADMIN --> CREATE
    ADMIN --> UPDATE
    ADMIN --> DELETE_OWN
    ADMIN --> APPROVE
    ADMIN --> DELETE_ANY
    ADMIN --> MANAGE

    style USER fill:#e3f2fd
    style CHEF fill:#fff3e0
    style ADMIN fill:#ffcdd2
```

---

## 📡 API Endpoints

### Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response 201:
{
  "status": "success",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "emailVerified": false,
      "isOAuthUser": false,
      "termsAccepted": true
    },
    "token": "eyJhbGc..."
  }
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "status": "success",
  "data": {
    "user": {...},
    "token": "eyJhbGc..."
  }
}
```

### Google OAuth
```http
GET /api/v1/auth/google
→ Redirects to Google OAuth consent page

GET /api/v1/auth/google/callback?code=xxx&state=xxx
→ Redirects to frontend with token
```

### Email Verification
```http
GET /api/v1/auth/verify-email/:token

Response 200:
{
  "status": "success",
  "message": "Email verified successfully"
}
```

### Password Reset Request
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "status": "success",
  "message": "Password reset email sent"
}
```

### Password Reset Confirm
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}

Response 200:
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRES_IN=24h

# Password Hashing
BCRYPT_ROUNDS=10

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://your-app.com/api/v1/auth/google/callback

# Email Service (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com

# Application URLs
FRONTEND_URL=https://your-frontend.com
BACKEND_URL=https://your-backend.com
```

---

## 🧪 Testing Examples

### cURL Commands

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get Current User
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Email Registration | ✅ Complete | With email verification |
| Email Login | ✅ Complete | With account locking |
| Google OAuth | ✅ Complete | Account linking supported |
| Email Verification | ✅ Complete | 24h token expiration |
| Password Reset | ✅ Complete | 1h token expiration |
| Session Management | ✅ Complete | JWT + Database |
| RBAC | ✅ Complete | 3 roles implemented |
| Account Security | ✅ Complete | Rate limit + failed attempts |
| Terms of Service | ✅ Complete | OAuth users only |

---

**Last Updated**: October 31, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
