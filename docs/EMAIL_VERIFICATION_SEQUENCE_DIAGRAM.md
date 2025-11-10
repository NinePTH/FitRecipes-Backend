# Email Verification 2FA - Sequence Diagram

This document contains Mermaid sequence diagrams for the Email Verification flow in the FitRecipes Backend API.

---

## 1. Registration with Email Verification

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API as API Gateway
    participant AuthController
    participant AuthService
    participant Database
    participant EmailService
    
    User->>Frontend: Fill registration form
    User->>Frontend: Submit registration
    Frontend->>API: POST /api/v1/auth/register
    Note over Frontend,API: {firstName, lastName, email,<br/>password, agreeToTerms: true}
    
    API->>AuthController: register(context)
    AuthController->>AuthController: Validate with Zod schema
    
    alt Validation fails
        AuthController-->>Frontend: 400 Bad Request
        Note over AuthController,Frontend: {status: "error",<br/>message: "Validation error"}
        Frontend-->>User: Show validation errors
    else Validation succeeds
        AuthController->>AuthService: register(data)
        
        AuthService->>Database: findUnique(email)
        Database-->>AuthService: Check if exists
        
        alt User already exists
            AuthService-->>AuthController: throw Error("Account already exists")
            AuthController-->>Frontend: 400 Bad Request
            Frontend-->>User: Show "Account already exists"
        else User doesn't exist
            AuthService->>AuthService: hashPassword(password)
            AuthService->>AuthService: generateVerificationToken()
            Note over AuthService: Token: 32-char random string<br/>Expiry: 24 hours
            
            AuthService->>Database: user.create()
            Note over Database: Store user with:<br/>- isEmailVerified: false<br/>- emailVerificationToken<br/>- tokenExpiresAt
            Database-->>AuthService: User created
            
            AuthService->>AuthService: generateToken(user)
            Note over AuthService: JWT token (24h expiry)
            
            AuthService->>Database: session.create()
            Note over Database: Store session with:<br/>- userId<br/>- token<br/>- expiresAt (24h)
            Database-->>AuthService: Session created
            
            par Send verification email (async, non-blocking)
                AuthService->>EmailService: sendVerificationEmail(email, token)
                Note over EmailService: Async operation - don't wait
                
                alt Email service available (Resend API key set)
                    EmailService->>EmailService: Send via Resend API
                    EmailService->>User: Email with verification link
                    Note over User: Link: /verify-email?token=xxx
                else Development mode (no API key)
                    EmailService->>EmailService: Log email to console
                    Note over EmailService: Email logged for testing
                end
            end
            
            AuthService-->>AuthController: Return user + token
            AuthController-->>Frontend: 201 Created
            Note over Frontend: {status: "success",<br/>data: {user, token}}
            
            Frontend->>Frontend: Store JWT token
            Frontend->>Frontend: Redirect to dashboard
            Frontend-->>User: Show success + "Check email"
        end
    end
```

---

## 2. Email Verification Process

```mermaid
sequenceDiagram
    actor User
    participant Email as Email Client
    participant Frontend
    participant API as API Gateway
    participant AuthController
    participant AuthService
    participant Database
    
    Note over User,Email: User receives verification email
    User->>Email: Open verification email
    Email->>User: Display email with link
    Note over Email: Link: https://app.com/verify-email?token=xxx
    
    User->>Email: Click verification link
    Email->>Frontend: GET /verify-email?token=xxx
    
    Frontend->>Frontend: Extract token from URL
    Frontend->>API: GET /api/v1/auth/verify-email/:token
    Note over Frontend,API: Or: GET /verify-email?token=xxx
    
    API->>AuthController: verifyEmail(context)
    AuthController->>AuthController: Extract token (path or query param)
    
    alt Token missing
        AuthController-->>Frontend: 400 Bad Request
        Note over AuthController,Frontend: {status: "error",<br/>message: "Token required"}
        Frontend-->>User: Show "Invalid link"
    else Token provided
        AuthController->>AuthService: verifyEmail(token)
        
        AuthService->>Database: findFirst(token, expiry >= now)
        Database-->>AuthService: User with matching token
        
        alt Token invalid or expired
            AuthService-->>AuthController: throw Error("Invalid or expired")
            AuthController-->>Frontend: 400 Bad Request
            Frontend->>Frontend: Show resend option
            Frontend-->>User: "Token expired. Resend?"
        else Token valid
            AuthService->>Database: user.update()
            Note over Database: Set:<br/>- isEmailVerified: true<br/>- emailVerificationToken: null<br/>- tokenExpiresAt: null
            Database-->>AuthService: User updated
            
            AuthService-->>AuthController: {message: "Email verified"}
            AuthController-->>Frontend: 200 OK
            Note over Frontend: {status: "success",<br/>message: "Email verified"}
            
            Frontend->>Frontend: Show success message
            Frontend->>Frontend: Redirect to dashboard
            Frontend-->>User: "Email verified! ✅"
        end
    end
```

---

## 3. Resend Verification Email

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API as API Gateway
    participant AuthController
    participant AuthService
    participant Database
    participant EmailService
    
    Note over User,Frontend: User didn't receive email<br/>or token expired
    
    User->>Frontend: Click "Resend verification email"
    Frontend->>Frontend: Get user's email
    Frontend->>API: POST /api/v1/auth/resend-verification
    Note over Frontend,API: {email: "user@example.com"}
    
    API->>AuthController: resendVerificationEmail(context)
    AuthController->>AuthController: Extract email from body
    
    alt Email missing
        AuthController-->>Frontend: 400 Bad Request
        Frontend-->>User: "Email is required"
    else Email provided
        AuthController->>AuthService: resendVerificationEmail(email)
        
        AuthService->>Database: findUnique(email)
        Database-->>AuthService: User data
        
        alt User not found
            AuthService-->>AuthController: throw Error("User not found")
            AuthController-->>Frontend: 400 Bad Request
            Frontend-->>User: "User not found"
        else User found
            alt Email already verified
                AuthService-->>AuthController: throw Error("Already verified")
                AuthController-->>Frontend: 400 Bad Request
                Frontend-->>User: "Email already verified"
            else Email not verified
                AuthService->>AuthService: generateVerificationToken()
                Note over AuthService: New token: 32-char random<br/>New expiry: 24 hours
                
                AuthService->>Database: user.update()
                Note over Database: Update:<br/>- emailVerificationToken<br/>- tokenExpiresAt
                Database-->>AuthService: Token updated
                
                AuthService->>EmailService: sendVerificationEmail(email, token)
                
                alt Email service available
                    EmailService->>User: Send verification email
                    Note over User: New verification link
                else Development mode
                    EmailService->>EmailService: Log to console
                end
                
                EmailService-->>AuthService: Email sent
                
                AuthService-->>AuthController: {message: "Email sent"}
                AuthController-->>Frontend: 200 OK
                Note over Frontend: {status: "success",<br/>message: "Verification email sent"}
                
                Frontend-->>User: "Check your email! 📧"
            end
        end
    end
```

---

## 4. Complete User Journey (Happy Path)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    participant Email as Email Service
    
    rect rgb(200, 220, 240)
        Note over User,Email: STEP 1: REGISTRATION
        User->>Frontend: Register account
        Frontend->>Backend: POST /auth/register
        Backend->>Database: Create user (isEmailVerified: false)
        Database-->>Backend: User created
        Backend->>Email: Send verification email (async)
        Backend-->>Frontend: 201 Created + JWT token
        Frontend-->>User: "Success! Check your email"
        Email-->>User: Verification email received
    end
    
    rect rgb(220, 240, 200)
        Note over User,Email: STEP 2: EMAIL VERIFICATION
        User->>User: Open email & click link
        User->>Frontend: Click verification link
        Frontend->>Backend: GET /auth/verify-email/:token
        Backend->>Database: Verify token & update user
        Note over Database: isEmailVerified = true
        Database-->>Backend: User verified
        Backend-->>Frontend: 200 OK "Email verified"
        Frontend-->>User: "Email verified! ✅"
    end
    
    rect rgb(240, 220, 200)
        Note over User,Email: STEP 3: FULL ACCESS
        User->>Frontend: Use application
        Note over Frontend,Database: User has full access<br/>No restrictions
    end
```

---

## 5. Error Flow - Token Expired

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    participant Email as Email Service
    
    rect rgb(255, 230, 230)
        Note over User,Email: SCENARIO: Token expired after 24 hours
        User->>Frontend: Click verification link (expired)
        Frontend->>Backend: GET /auth/verify-email/:token
        Backend->>Database: findFirst(token, expiry >= now)
        Database-->>Backend: No user found (expired)
        Backend-->>Frontend: 400 Bad Request
        Note over Backend,Frontend: "Invalid or expired token"
        Frontend-->>User: Show error + resend button
    end
    
    rect rgb(230, 255, 230)
        Note over User,Email: USER ACTION: Request new verification email
        User->>Frontend: Click "Resend verification"
        Frontend->>Backend: POST /auth/resend-verification
        Backend->>Database: Generate new token
        Database-->>Backend: Token updated
        Backend->>Email: Send new verification email
        Email-->>User: New verification email
        Backend-->>Frontend: 200 OK "Email sent"
        Frontend-->>User: "Check your email! 📧"
    end
    
    rect rgb(220, 240, 200)
        Note over User,Email: RESOLUTION: Verify with new token
        User->>Frontend: Click new verification link
        Frontend->>Backend: GET /auth/verify-email/:token
        Backend->>Database: Verify new token (valid)
        Database-->>Backend: User verified ✅
        Backend-->>Frontend: 200 OK
        Frontend-->>User: "Email verified! ✅"
    end
```

---

## Key Points

### Token Details
- **Token Generation**: 32-character random string (cryptographically secure)
- **Token Storage**: Stored in database `emailVerificationToken` field
- **Token Expiry**: 24 hours from generation
- **Token Type**: Single-use (cleared after successful verification)

### Security Features
1. **Token Expiry**: Tokens expire after 24 hours
2. **Single Use**: Tokens are cleared after verification
3. **Secure Generation**: Crypto-random token generation
4. **Database Validation**: Token must match stored value and not be expired
5. **No Personal Info in Token**: Token is random, not email-based

### User Experience
- **No Login Required**: Verification link works directly (token contains all info)
- **Multiple Attempts**: Users can resend verification email multiple times
- **Flexible Link Format**: Supports both `/verify-email/:token` and `/verify-email?token=xxx`
- **Clear Error Messages**: Specific errors for expired vs invalid tokens
- **Async Email Sending**: Registration doesn't wait for email to be sent

### Email Service
- **Development Mode**: Logs emails to console (no API key required)
- **Production Mode**: Uses Resend API when `RESEND_API_KEY` is set
- **Non-Blocking**: Email sending is async (doesn't block registration)
- **Error Handling**: Email failures logged but don't fail registration

### Database Schema
```typescript
User {
  isEmailVerified: boolean           // Verification status
  emailVerificationToken: string?    // Current token (null after verified)
  emailVerificationTokenExpiresAt: DateTime?  // Expiry timestamp
}
```

### API Endpoints
- `POST /api/v1/auth/register` - Register + auto-send verification email
- `GET /api/v1/auth/verify-email/:token` - Verify email with token
- `POST /api/v1/auth/resend-verification` - Resend verification email

---

## Testing Scenarios

### ✅ Happy Path
1. User registers → Email sent → User clicks link → Email verified

### ❌ Error Scenarios
1. **Expired Token**: User waits >24h → Token expired → Must resend
2. **Invalid Token**: User modifies link → Invalid token → Show error
3. **Already Verified**: User clicks link twice → Already verified → Show message
4. **User Not Found**: Non-existent email → User not found → Show error

### 🔄 Edge Cases
1. **Multiple Resends**: User clicks resend multiple times → Only latest token valid
2. **Concurrent Verification**: User has multiple tabs → First one succeeds, others fail gracefully
3. **Email Service Down**: Registration succeeds even if email fails to send

---

**Last Updated**: October 28, 2025  
**Status**: ✅ Fully Implemented  
**Test Coverage**: 19 integration tests for auth flow
