# Email Verification Troubleshooting Guide

## ✅ Backend Status: WORKING!

**Test Result**:
```bash
$ bun run test-verify-endpoint.ts
Status: 200
Response: {
  "status": "success",
  "message": "Email verified successfully"
}
```

The backend endpoint `/api/v1/auth/verify-email/:token` is working perfectly!

---

## 🔍 The Problem

If you're getting **"Endpoint not found"** when clicking the email link, the issue is on the **frontend side**, not the backend.

### Common Issues

#### 1. **Frontend Not Calling Backend API**
Your frontend might be trying to handle the route locally instead of calling the backend.

**Check your frontend route**:
```tsx
// ❌ Wrong - Frontend handles it locally
<Route path="/verify-email/:token" element={<VerifyEmailPage />} />

// Without calling the backend API inside the component
```

**Should be**:
```tsx
// ✅ Correct - Frontend calls backend API
<Route path="/verify-email/:token" element={<VerifyEmailPage />} />

// Inside VerifyEmailPage component:
const { token } = useParams();
const response = await fetch(`http://localhost:3000/api/v1/auth/verify-email/${token}`);
```

---

#### 2. **Wrong API Base URL**
Your frontend might be calling the wrong URL.

**Check your frontend code**:
```tsx
// ❌ Wrong
const API_URL = 'http://localhost:5173/api/v1';  // Frontend port!

// ✅ Correct
const API_URL = 'http://localhost:3000/api/v1';  // Backend port!
```

---

#### 3. **CORS Issues**
The browser might be blocking the request due to CORS.

**Check browser console** (F12) for errors like:
```
Access to fetch at 'http://localhost:3000/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution**: Already configured in backend, but double-check:
```bash
# In .env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

#### 4. **Frontend Not Calling the API**
Your `VerifyEmailPage` component might not be calling the backend at all.

**Check if you have this in your component**:
```tsx
useEffect(() => {
  const verifyEmail = async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/auth/verify-email/${token}`
    );
    // ... handle response
  };
  verifyEmail();
}, [token]);
```

---

## 🧪 How to Debug

### Step 1: Check Frontend Network Tab
1. Open your app in Chrome/Firefox
2. Press F12 to open DevTools
3. Go to "Network" tab
4. Click the verification link in email
5. Look for the API request

**What to check**:
- ✅ Is there a request to `http://localhost:3000/api/v1/auth/verify-email/...`?
- ✅ What's the status code? (Should be 200)
- ✅ What's the response body?

### Step 2: Test Backend Directly
```bash
# Copy your token from the email
curl http://localhost:3000/api/v1/auth/verify-email/YOUR_TOKEN_HERE

# Example:
curl http://localhost:3000/api/v1/auth/verify-email/3gma5PWVw908ZjLQurpFIsyb0jdNiuCf
```

**Expected Result**:
```json
{
  "status": "success",
  "data": { "message": "Email verified successfully" },
  "message": "Email verified successfully"
}
```

### Step 3: Check Frontend Console
Press F12 in your browser and check the Console tab for errors.

Common errors:
- `fetch is not defined` → Using old browser
- `Network request failed` → Backend not running
- `CORS error` → Backend CORS not configured
- `404 Not Found` → Wrong URL in frontend code

---

## 🔧 Frontend Implementation Checklist

### ✅ Your Frontend Should Have:

**1. Route Configuration**:
```tsx
<Route path="/verify-email/:token" element={<VerifyEmailPage />} />
```

**2. Component with API Call**:
```tsx
// VerifyEmailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // 🔥 THIS IS THE IMPORTANT PART
        const response = await fetch(
          `http://localhost:3000/api/v1/auth/verify-email/${token}`,
          { method: 'GET' }
        );
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div>
      {status === 'loading' && <p>Verifying...</p>}
      {status === 'success' && <p>✅ {message}</p>}
      {status === 'error' && <p>❌ {message}</p>}
    </div>
  );
}
```

**3. Correct API Base URL**:
```tsx
// config.ts or constants.ts
export const API_BASE_URL = 'http://localhost:3000/api/v1';

// Then in your component:
fetch(`${API_BASE_URL}/auth/verify-email/${token}`)
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Frontend Handles Route But Doesn't Call Backend
```tsx
// This only displays a page, doesn't verify anything!
function VerifyEmailPage() {
  return <div>Email verified!</div>;  // ← No API call!
}
```

### ❌ Mistake 2: Wrong Port
```tsx
// Using frontend port (5173) instead of backend port (3000)
fetch('http://localhost:5173/api/v1/auth/verify-email/...')
```

### ❌ Mistake 3: No Error Handling
```tsx
// If backend is down, this just hangs forever
const response = await fetch(...);  // No try/catch!
```

---

## ✅ Working Example (Copy This!)

```tsx
// pages/VerifyEmailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api/v1';

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        console.log('Calling backend:', `${API_URL}/auth/verify-email/${token}`);
        
        const response = await fetch(
          `${API_URL}/auth/verify-email/${token}`,
          { method: 'GET' }
        );

        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

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
        setMessage('Network error. Please check if backend is running.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {status === 'loading' && (
        <div>
          <h2>Verifying your email...</h2>
          <p>Please wait...</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <h2>✅ Email Verified!</h2>
          <p>{message}</p>
          <p>Redirecting to login...</p>
        </div>
      )}

      {status === 'error' && (
        <div>
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
```

---

## 🧪 Quick Test

**1. Start Backend**:
```bash
cd d:\FitRecipes-Backend
bun run dev
# Should see: Started development server: http://localhost:3000
```

**2. Test Backend Directly**:
```bash
curl http://localhost:3000/api/v1/auth/verify-email/3gma5PWVw908ZjLQurpFIsyb0jdNiuCf
# Should return: {"status":"success",...}
```

**3. Start Frontend**:
```bash
cd your-frontend-folder
npm run dev  # or yarn dev
# Should see: http://localhost:5173
```

**4. Open Browser DevTools** (F12) before clicking email link

**5. Click Email Link** and watch:
- Network tab: Should see request to `localhost:3000`
- Console tab: Should see "Calling backend" logs

---

## 📞 Still Not Working?

### Share these details:
1. **Browser Network tab screenshot** (F12 → Network)
2. **Browser Console tab output** (F12 → Console)
3. **Your frontend component code** (the VerifyEmailPage)
4. **Your API base URL configuration**

The backend is proven working. The issue is 100% in how the frontend is calling it!

---

**Backend Status**: ✅ WORKING (Tested and confirmed)  
**Frontend Status**: ⚠️ NEEDS CONFIGURATION  
**Next Step**: Check your frontend code using the checklist above
