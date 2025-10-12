# Email Verification Guide

## Overview
FitRecipes implements email verification for all registered users (email/password registration). OAuth users are automatically verified by Google.

---

## 🔄 How It Works

### Registration Flow
1. User registers with email/password
2. Backend generates verification token (32-character random string, 24-hour expiration)
3. Verification email sent automatically (async, doesn't block registration)
4. User can login immediately (verification not required to access app)
5. User clicks verification link in email
6. Backend verifies token and marks email as verified

---

## 📧 Email Template

**From**: `noreply@yourdomain.com` (or console in development)  
**Subject**: FitRecipes - Email Verification  
**Format**: HTML with styled button

**Email Content**:
```html
<h2>Welcome to FitRecipes!</h2>
<p>Hello,</p>
<p>Thank you for joining FitRecipes. Please verify your email address to complete your registration.</p>
<p>Click the link below to verify your email:</p>
<a href="http://localhost:5173/verify-email/TOKEN_HERE" 
   style="background-color: #4CAF50; color: white; padding: 14px 20px; 
          text-decoration: none; display: inline-block; border-radius: 4px;">
  Verify Email
</a>
<p>This link will expire in 24 hours.</p>
<p>Best regards,<br>FitRecipes Team</p>
```

---

## 🔌 API Endpoints

### 1. Verify Email
**Endpoint**: `GET /api/v1/auth/verify-email/:token`

**Example**: `GET /api/v1/auth/verify-email/abc123def456xyz789...`

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**Error Responses**:
- `400`: Invalid or expired verification token
- `500`: Internal server error

### 2. Resend Verification Email
**Endpoint**: `POST /api/v1/auth/resend-verification`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Verification email sent"
}
```

**Error Responses**:
- `404`: User not found
- `400`: Email already verified
- `500`: Internal server error

---

## 🎨 Frontend Integration

### React Example - Email Verification Page

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verifyEmail() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/verify-email/${token}`
        );
        const data = await response.json();

        if (data.status === 'success') {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      }
    }

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="verify-email-page">
      {status === 'verifying' && (
        <div>
          <h2>Verifying your email...</h2>
          <p>Please wait while we verify your email address.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="success">
          <h2>✅ Email Verified!</h2>
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error">
          <h2>❌ Verification Failed</h2>
          <p>{message}</p>
          <button onClick={() => navigate('/resend-verification')}>
            Resend Verification Email
          </button>
        </div>
      )}
    </div>
  );
}

export default VerifyEmailPage;
```

### React Example - Resend Verification

```jsx
import { useState } from 'react';

function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  async function handleResend(e) {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );
      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  }

  return (
    <div className="resend-verification-page">
      <h2>Resend Verification Email</h2>
      
      <form onSubmit={handleResend}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Resend Email'}
        </button>
      </form>

      {status === 'success' && (
        <p className="success">{message}</p>
      )}

      {status === 'error' && (
        <p className="error">{message}</p>
      )}
    </div>
  );
}

export default ResendVerificationPage;
```

### React Router Setup

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Email Service (Resend)
RESEND_API_KEY=re_your_api_key  # Leave empty for console logging in dev
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173  # Dev
FRONTEND_URL=https://fitrecipes.vercel.app  # Production
```

### Development Mode
When `RESEND_API_KEY` is not set, emails are logged to console instead of sent:

```
📧 Email Service (Development Mode - No API Key)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: user@example.com
Subject: FitRecipes - Email Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<h2>Welcome to FitRecipes!</h2>
...
```

---

## 🔒 Security Features

### Token Security
- **Length**: 32 characters (high entropy)
- **Expiration**: 24 hours from creation
- **Single Use**: Token cleared after successful verification
- **Database Storage**: Stored securely in `User` model

### URL Format
**Backend Endpoint**: `GET /api/v1/auth/verify-email/:token` (path parameter)  
**Email Link**: `http://localhost:5173/verify-email/TOKEN` (frontend route)

The frontend receives the token, then makes API call to backend.

---

## 🐛 Troubleshooting

### Issue: Verification Email Not Received

**Possible Causes**:
1. Email in spam/junk folder
2. Invalid `EMAIL_FROM` address
3. Resend API key invalid/missing
4. Email service down

**Solutions**:
- Check spam folder
- Verify `RESEND_API_KEY` is set correctly
- Check console logs in development mode
- Use resend verification endpoint

### Issue: "Invalid or expired token"

**Possible Causes**:
1. Token expired (24 hours passed)
2. Token already used
3. Token malformed (URL encoding issue)

**Solutions**:
- Request new verification email
- Check token in URL is complete (no truncation)
- Verify token format in database

### Issue: Frontend 404 on Verification Link

**Possible Causes**:
1. Frontend route not configured
2. Token parameter not captured correctly

**Solutions**:
```jsx
// Ensure route is defined in React Router
<Route path="/verify-email/:token" element={<VerifyEmailPage />} />

// Capture token in component
const { token } = useParams();
```

---

## 📊 Database Schema

### User Model Fields
```prisma
model User {
  id                              String    @id @default(cuid())
  email                           String    @unique
  isEmailVerified                 Boolean   @default(false)
  emailVerificationToken          String?   @unique
  emailVerificationTokenExpiresAt DateTime?
  // ... other fields
}
```

### Verification Status Check
```typescript
// Check if user's email is verified
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  select: { isEmailVerified: true }
});

if (user?.isEmailVerified) {
  // Email is verified
}
```

---

## ✅ Testing

### Manual Testing

1. **Register a new user**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Test@1234",
    "agreeToTerms": true
  }'
```

2. **Check console for email** (development mode)

3. **Copy verification token from console output**

4. **Verify email**:
```bash
curl http://localhost:3000/api/v1/auth/verify-email/YOUR_TOKEN_HERE
```

5. **Resend verification** (if needed):
```bash
curl -X POST http://localhost:3000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🎯 Best Practices

1. **Don't Block Registration**: Send verification email async, don't wait for delivery
2. **Allow Login Without Verification**: Users can access app, but show reminder banner
3. **Clear Error Messages**: Tell users if token is expired vs invalid
4. **Resend Option**: Always provide way to resend verification email
5. **Email Styling**: Use inline CSS for email compatibility across clients
6. **Token Expiration**: 24 hours is good balance (not too short, not too long)

---

## 📚 Related Documentation

- `AUTHENTICATION_GUIDE.md` - Complete authentication documentation
- `EMAIL_SETUP_GUIDE.md` - Email service configuration
- Backend email utilities: `src/utils/email.ts`
- Email service: Configured with Resend

---

**Last Updated**: January 7, 2025  
**Status**: ✅ Implemented and Tested
