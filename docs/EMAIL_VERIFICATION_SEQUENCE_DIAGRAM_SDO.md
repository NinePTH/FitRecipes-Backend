# Email Verification 2FA - Sequence Diagrams for sequencediagram.org

This document contains sequence diagrams in the format for https://sequencediagram.org

Copy each diagram code block and paste it into https://sequencediagram.org to render.

---

## 1. Registration with Email Verification

Copy the code below and paste into https://sequencediagram.org:

```
title Registration with Email Verification

participant User
participant Frontend
participant API Gateway
participant AuthController
participant AuthService
participant Database
participant EmailService

User->Frontend: Fill registration form
User->Frontend: Submit registration
Frontend->API Gateway: POST /api/v1/auth/register\n{firstName, lastName, email,\npassword, agreeToTerms: true}

API Gateway->AuthController: register(context)
AuthController->AuthController: Validate with Zod schema

alt Validation fails
    AuthController-->Frontend: 400 Bad Request\n{status: "error",\nmessage: "Validation error"}
    Frontend-->User: Show validation errors
else Validation succeeds
    AuthController->AuthService: register(data)
    
    AuthService->Database: findUnique(email)
    Database-->AuthService: Check if exists
    
    alt User already exists
        AuthService-->AuthController: throw Error("Account already exists")
        AuthController-->Frontend: 400 Bad Request
        Frontend-->User: Show "Account already exists"
    else User doesn't exist
        AuthService->AuthService: hashPassword(password)
        AuthService->AuthService: generateVerificationToken()
        note over AuthService: Token: 32-char random string\nExpiry: 24 hours
        
        AuthService->Database: user.create()
        note over Database: Store user with:\n- isEmailVerified: false\n- emailVerificationToken\n- tokenExpiresAt
        Database-->AuthService: User created
        
        AuthService->AuthService: generateToken(user)
        note over AuthService: JWT token (24h expiry)
        
        AuthService->Database: session.create()
        note over Database: Store session with:\n- userId\n- token\n- expiresAt (24h)
        Database-->AuthService: Session created
        
        parallel
            AuthService->EmailService: sendVerificationEmail(email, token)
            note over EmailService: Async operation - don't wait
            
            alt Email service available (Resend API key set)
                EmailService->EmailService: Send via Resend API
                EmailService->User: Email with verification link\nLink: /verify-email?token=xxx
            else Development mode (no API key)
                EmailService->EmailService: Log email to console
                note over EmailService: Email logged for testing
            end
        and
            AuthService-->AuthController: Return user + token
            AuthController-->Frontend: 201 Created\n{status: "success",\ndata: {user, token}}
            
            Frontend->Frontend: Store JWT token
            Frontend->Frontend: Redirect to dashboard
            Frontend-->User: Show success + "Check email"
        end
    end
end
```

---

## 2. Email Verification Process

Copy the code below and paste into https://sequencediagram.org:

```
title Email Verification Process

participant User
participant Email Client
participant Frontend
participant API Gateway
participant AuthController
participant AuthService
participant Database

note over User,Email Client: User receives verification email
User->Email Client: Open verification email
Email Client->User: Display email with link
note over Email Client: Link: https://app.com/verify-email?token=xxx

User->Email Client: Click verification link
Email Client->Frontend: GET /verify-email?token=xxx

Frontend->Frontend: Extract token from URL
Frontend->API Gateway: GET /api/v1/auth/verify-email/:token
note over Frontend,API Gateway: Or: GET /verify-email?token=xxx

API Gateway->AuthController: verifyEmail(context)
AuthController->AuthController: Extract token (path or query param)

alt Token missing
    AuthController-->Frontend: 400 Bad Request
    note over AuthController,Frontend: {status: "error",\nmessage: "Token required"}
    Frontend-->User: Show "Invalid link"
else Token provided
    AuthController->AuthService: verifyEmail(token)
    
    AuthService->Database: findFirst(token, expiry >= now)
    Database-->AuthService: User with matching token
    
    alt Token invalid or expired
        AuthService-->AuthController: throw Error("Invalid or expired")
        AuthController-->Frontend: 400 Bad Request
        Frontend->Frontend: Show resend option
        Frontend-->User: "Token expired. Resend?"
    else Token valid
        AuthService->Database: user.update()
        note over Database: Set:\n- isEmailVerified: true\n- emailVerificationToken: null\n- tokenExpiresAt: null
        Database-->AuthService: User updated
        
        AuthService-->AuthController: {message: "Email verified"}
        AuthController-->Frontend: 200 OK
        note over Frontend: {status: "success",\nmessage: "Email verified"}
        
        Frontend->Frontend: Show success message
        Frontend->Frontend: Redirect to dashboard
        Frontend-->User: "Email verified! ✅"
    end
end
```

---

## 3. Resend Verification Email

Copy the code below and paste into https://sequencediagram.org:

```
title Resend Verification Email

participant User
participant Frontend
participant API Gateway
participant AuthController
participant AuthService
participant Database
participant EmailService

note over User,Frontend: User didn't receive email\nor token expired

User->Frontend: Click "Resend verification email"
Frontend->Frontend: Get user's email
Frontend->API Gateway: POST /api/v1/auth/resend-verification
note over Frontend,API Gateway: {email: "user@example.com"}

API Gateway->AuthController: resendVerificationEmail(context)
AuthController->AuthController: Extract email from body

alt Email missing
    AuthController-->Frontend: 400 Bad Request
    Frontend-->User: "Email is required"
else Email provided
    AuthController->AuthService: resendVerificationEmail(email)
    
    AuthService->Database: findUnique(email)
    Database-->AuthService: User data
    
    alt User not found
        AuthService-->AuthController: throw Error("User not found")
        AuthController-->Frontend: 400 Bad Request
        Frontend-->User: "User not found"
    else User found
        alt Email already verified
            AuthService-->AuthController: throw Error("Already verified")
            AuthController-->Frontend: 400 Bad Request
            Frontend-->User: "Email already verified"
        else Email not verified
            AuthService->AuthService: generateVerificationToken()
            note over AuthService: New token: 32-char random\nNew expiry: 24 hours
            
            AuthService->Database: user.update()
            note over Database: Update:\n- emailVerificationToken\n- tokenExpiresAt
            Database-->AuthService: Token updated
            
            AuthService->EmailService: sendVerificationEmail(email, token)
            
            alt Email service available
                EmailService->User: Send verification email
                note over User: New verification link
            else Development mode
                EmailService->EmailService: Log to console
            end
            
            EmailService-->AuthService: Email sent
            
            AuthService-->AuthController: {message: "Email sent"}
            AuthController-->Frontend: 200 OK
            note over Frontend: {status: "success",\nmessage: "Verification email sent"}
            
            Frontend-->User: "Check your email! 📧"
        end
    end
end
```

---

## How to Use

1. Go to https://sequencediagram.org
2. Copy one of the code blocks above
3. Paste it into the text editor on the left side
4. The diagram will automatically render on the right side
5. You can export as PNG, SVG, or PDF using the buttons at the top

## Key Differences from Mermaid

- Uses `participant` instead of `participant` (same)
- Uses `->` for synchronous calls (solid line)
- Uses `-->` for return/responses (dashed line)
- Uses `alt`/`else`/`end` for conditionals
- Uses `parallel`/`and`/`end` for concurrent operations
- Uses `note over` for notes
- Uses `\n` for multi-line text in messages

## Tips

- **Zoom**: Use the zoom controls in the top-right corner
- **Export**: Click "Export" to download as image
- **Share**: Click "Share" to get a shareable link
- **Edit**: All diagrams are editable - you can modify the text to customize

---

**Created**: October 28, 2025  
**Format**: sequencediagram.org syntax  
**Related**: See EMAIL_VERIFICATION_SEQUENCE_DIAGRAM.md for Mermaid versions
