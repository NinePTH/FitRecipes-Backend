# Email Verification - Frontend Integration Guide

## 📧 Overview

Complete guide for implementing email verification in your frontend application. This feature sends a verification email after user registration and validates the token when users click the verification link.

---

## 🎯 User Flow

```
1. User registers → Backend sends verification email
2. User checks email → Clicks verification link
3. Frontend captures token → Calls backend verification endpoint
4. Backend validates → Marks email as verified
5. Frontend shows success → Redirects to login/dashboard
```

---

## 🚀 Backend API Endpoints

### 1. Registration (Already Integrated)

**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "USER"
}
```

**Response** (Success - 201):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm3x7y8z9",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "emailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Registration successful! Please check your email to verify your account."
  },
  "message": "Registration successful"
}
```

**Key Changes**:
- ✅ Automatically sends verification email after registration
- ✅ Returns `emailVerified: false` in user object
- ✅ Includes message prompting user to check email
- ✅ User can still login but may have restricted access (optional enforcement)

---

### 2. Verify Email Token

**Endpoint**: `GET /api/v1/auth/verify-email/:token`

**URL**: `https://fitrecipes-backend.onrender.com/api/v1/auth/verify-email/abc123def456...`

**Response** (Success - 200):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm3x7y8z9",
      "email": "john@example.com",
      "emailVerified": true
    }
  },
  "message": "Email verified successfully! You can now login."
}
```

**Response** (Invalid/Expired Token - 400):
```json
{
  "status": "error",
  "message": "Invalid or expired verification token",
  "errors": null
}
```

**Response** (Already Verified - 400):
```json
{
  "status": "error",
  "message": "Email already verified",
  "errors": null
}
```

---

### 3. Resend Verification Email

**Endpoint**: `POST /api/v1/auth/resend-verification`

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response** (Success - 200):
```json
{
  "status": "success",
  "data": null,
  "message": "Verification email sent! Please check your inbox."
}
```

**Response** (Already Verified - 400):
```json
{
  "status": "error",
  "message": "Email already verified",
  "errors": null
}
```

**Response** (User Not Found - 404):
```json
{
  "status": "error",
  "message": "User not found",
  "errors": null
}
```

**Rate Limiting**: Maximum 100 requests per 15 minutes per IP

---

## 💻 Frontend Implementation

### React Example (TypeScript)

#### 1. Registration Component (Updated)

```tsx
// components/auth/RegisterForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegisterResponse {
  status: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
    };
    token: string;
    message?: string;
  };
  message: string;
}

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://fitrecipes-backend.onrender.com/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: RegisterResponse = await response.json();

      if (response.ok) {
        // Show verification message
        setShowVerificationMessage(true);
        
        // Optional: Store token but show verification reminder
        localStorage.setItem('authToken', data.data.token);
        
        // Redirect to verification reminder page after 3 seconds
        setTimeout(() => {
          navigate('/verify-email-sent', { state: { email: formData.email } });
        }, 3000);
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="verification-message">
        <h2>✅ Registration Successful!</h2>
        <p>Please check your email <strong>{formData.email}</strong></p>
        <p>We've sent you a verification link. Click it to verify your account.</p>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        minLength={8}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

---

#### 2. Email Verification Page

```tsx
// pages/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(
          `https://fitrecipes-backend.onrender.com/api/v1/auth/verify-email/${token}`,
          { method: 'GET' }
        );

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { state: { emailVerified: true } });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verify-email-container">
      {status === 'loading' && (
        <div>
          <div className="spinner"></div>
          <h2>Verifying your email...</h2>
          <p>Please wait while we verify your email address.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Email Verified!</h2>
          <p>{message}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error-message">
          <div className="error-icon">❌</div>
          <h2>Verification Failed</h2>
          <p>{message}</p>
          <button onClick={() => navigate('/resend-verification')}>
            Resend Verification Email
          </button>
        </div>
      )}
    </div>
  );
}
```

---

#### 3. Resend Verification Email Page

```tsx
// pages/ResendVerification.tsx
import { useState } from 'react';

export function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        'https://fitrecipes-backend.onrender.com/api/v1/auth/resend-verification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setEmail(''); // Clear form
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resend-verification-container">
      <h2>Resend Verification Email</h2>
      <p>Enter your email address and we'll send you a new verification link.</p>

      <form onSubmit={handleResend}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
```

---

#### 4. Router Configuration

```tsx
// App.tsx or Router.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RegisterForm } from './components/auth/RegisterForm';
import { VerifyEmailPage } from './pages/VerifyEmail';
import { ResendVerificationPage } from './pages/ResendVerification';
import { LoginPage } from './pages/Login';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📧 Email Template Example

Your users will receive an email like this:

```
From: FitRecipes <onboarding@resend.dev>
Subject: Verify Your Email Address

Hi [User Name],

Thank you for registering with FitRecipes!

Please click the button below to verify your email address:

[Verify Email] (Button linking to verification URL)

Or copy and paste this link:
https://fitrecipes.vercel.app/verify-email/abc123def456...

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
FitRecipes Team
```

**Email Backend Implementation** (`src/utils/email.ts`):
```typescript
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${config.FRONTEND_URL}/verify-email/${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with FitRecipes!</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Best regards,<br>FitRecipes Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(email, 'Verify Your Email Address', htmlContent);
}
```

---

## 🔐 Security Considerations

### Token Generation
- ✅ Tokens are 32-character random strings (cryptographically secure)
- ✅ Tokens expire after 24 hours
- ✅ Tokens are single-use (deleted after verification)
- ✅ No email enumeration (consistent responses)

### Frontend Best Practices
1. **Always use HTTPS** for verification endpoints
2. **Never cache verification tokens** in localStorage
3. **Show clear error messages** for expired tokens
4. **Implement resend functionality** for user convenience
5. **Track verification status** in user profile/dashboard

---

## 🎨 UI/UX Recommendations

### Registration Success Page
```
✅ Registration Successful!

Check your email
We've sent a verification link to john@example.com

[Didn't receive the email? Resend]
```

### Verification Success
```
✅ Email Verified!

Your email has been verified successfully.
You can now login to your account.

[Go to Login]
```

### Verification Error
```
❌ Verification Failed

This verification link is invalid or has expired.

[Resend Verification Email]
```

---

## 🧪 Testing Checklist

### Registration Flow
- [ ] Register new user → Receive verification email
- [ ] Check email → Click verification link
- [ ] Verify success message shows
- [ ] User can login after verification
- [ ] `emailVerified` field is `true` in database

### Error Handling
- [ ] Expired token shows error message
- [ ] Invalid token shows error message
- [ ] Already verified user gets appropriate message
- [ ] Resend works for unverified users
- [ ] Resend fails gracefully for verified users

### Edge Cases
- [ ] Multiple verification emails sent (last one wins)
- [ ] User tries to verify while already logged in
- [ ] User tries to resend for non-existent email (no enumeration)
- [ ] Rate limiting kicks in after 100 requests

---

## 🌐 Environment Configuration

### Development (Localhost)
```typescript
const API_BASE_URL = 'http://localhost:3000/api/v1';
const FRONTEND_URL = 'http://localhost:5173';
```

### Staging
```typescript
const API_BASE_URL = 'https://fitrecipes-backend-staging.onrender.com/api/v1';
const FRONTEND_URL = 'https://fitrecipes-staging.vercel.app';
```

### Production
```typescript
const API_BASE_URL = 'https://fitrecipes-backend.onrender.com/api/v1';
const FRONTEND_URL = 'https://fitrecipes.vercel.app';
```

**Important**: Update `FRONTEND_URL` in backend `.env` to match your frontend domain!

---

## 🐛 Troubleshooting

### Email Not Received
1. **Check spam folder** - Verification emails may land in spam
2. **Verify Resend API key** - Backend logs "Email sent successfully" if configured
3. **Development mode** - Emails log to console (check backend logs)
4. **Use resend functionality** - Users can request a new email

### Verification Link Not Working
1. **Check token expiration** - Tokens valid for 24 hours only
2. **Check URL format** - Should be `/verify-email/:token` (not `/verify-email?token=`)
3. **Check backend URL** - Ensure frontend calls correct backend endpoint
4. **Check CORS** - Verify backend allows frontend origin

### Frontend Integration Issues
```typescript
// ❌ Wrong - Token in query params
const url = `/verify-email?token=${token}`;

// ✅ Correct - Token in URL path
const url = `/verify-email/${token}`;
```

---

## 📊 Database Schema Reference

```prisma
model User {
  id                               String    @id @default(cuid())
  email                           String    @unique
  emailVerified                   Boolean   @default(false)
  emailVerificationToken          String?   @unique
  emailVerificationTokenExpiresAt DateTime?
  // ... other fields
}
```

### Migration Applied
```sql
-- Migration: 20251006130848_add_email_verification
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
```

---

## 📝 API Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/auth/register` | POST | Register + Send verification email | ❌ No |
| `/auth/verify-email/:token` | GET | Verify email with token | ❌ No |
| `/auth/resend-verification` | POST | Resend verification email | ❌ No |
| `/auth/login` | POST | Login (works with unverified emails) | ❌ No |
| `/auth/me` | GET | Get user profile (check `emailVerified`) | ✅ Yes |

---

## ✅ Implementation Status

### Backend (COMPLETE ✅)
- ✅ Database schema with verification fields
- ✅ Token generation and storage
- ✅ Email service integration (Resend)
- ✅ Verification endpoint (`GET /verify-email/:token`)
- ✅ Resend endpoint (`POST /resend-verification`)
- ✅ Registration updated to send verification email
- ✅ Migration applied to database

### Frontend (TODO - Use this guide)
- ⚠️ Update registration flow to show verification message
- ⚠️ Create verification page (`/verify-email/:token`)
- ⚠️ Create resend verification page
- ⚠️ Add router configuration
- ⚠️ Test complete flow end-to-end

---

## 🚀 Quick Start for Frontend Developers

1. **Copy the React components** from this guide
2. **Update API URLs** to match your environment (development/staging/production)
3. **Add routes** to your React Router configuration:
   - `/register` - Registration form
   - `/verify-email/:token` - Email verification page
   - `/resend-verification` - Resend verification email
4. **Test the flow**:
   - Register → Check email (or backend console logs)
   - Click link → See verification success
   - Try login → Should work
5. **Handle edge cases**:
   - Expired tokens → Show resend button
   - Already verified → Show appropriate message
   - Network errors → Show retry option

---

## 📞 Support

If you encounter issues:
1. Check backend logs for email sending status
2. Verify environment variables are correct
3. Test with a real email address (not a temporary one)
4. Check Resend dashboard for delivery status (if using production Resend API key)

---

**Last Updated**: January 6, 2025  
**Backend Version**: v1.0.0  
**Migration**: `20251006130848_add_email_verification`
