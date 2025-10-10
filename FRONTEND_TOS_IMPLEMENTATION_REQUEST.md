# Frontend Implementation Request: Terms of Service for OAuth Users

## 🎯 What We Need

Implement Terms of Service acceptance flow for Google OAuth users. After OAuth login, check if user has accepted ToS. If not, show Terms & Conditions page with Accept/Decline buttons.

---

## 📋 Requirements

### User Flow

**First-Time OAuth User**:
1. User clicks "Sign in with Google"
2. After OAuth success, check `user.termsAccepted` from backend response
3. If `termsAccepted = false`, redirect to `/terms-and-conditions` page
4. User must click **Accept** or **Decline**:
   - **Accept** → Call backend API → Redirect to dashboard
   - **Decline** → Call backend API → Logout → Redirect to login

**Returning User Who Accepted ToS**:
1. User clicks "Sign in with Google"
2. Backend returns `termsAccepted = true`
3. Redirect directly to dashboard ✅

**User Who Declined Previously**:
1. User clicks "Sign in with Google" again
2. Backend returns `termsAccepted = false`
3. Show ToS page again (must accept to continue)

---

## 🔌 Backend API Ready

### 1. OAuth Login Response (Updated)

**Endpoint**: After OAuth callback redirect

**Response**:
```json
{
  "user": {
    "id": "cm3x7y8z9",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "termsAccepted": false  // ← Check this field!
  },
  "token": "eyJhbGc..."
}
```

---

### 2. Accept Terms

**Endpoint**: `POST /api/v1/auth/terms/accept`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (Success):
```json
{
  "status": "success",
  "message": "Terms of Service accepted successfully"
}
```

---

### 3. Decline Terms

**Endpoint**: `POST /api/v1/auth/terms/decline`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (Success):
```json
{
  "status": "success",
  "message": "Terms of Service declined. You have been logged out."
}
```

**What happens**: Backend deletes all user sessions (user is logged out).

---

## 💻 What You Need to Build

### 1. Update OAuth Callback Handler

After OAuth redirect, check `termsAccepted` status:

```tsx
// In your OAuth callback page/component
const handleOAuthCallback = async (token: string) => {
  localStorage.setItem('authToken', token);
  
  // Get user info
  const response = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const { data } = await response.json();
  
  if (data.user.termsAccepted) {
    // ✅ Already accepted - go to main page
    navigate('/dashboard');
  } else {
    // ⚠️ Not accepted - go to ToS page
    navigate('/terms-and-conditions');
  }
};
```

---

### 2. Terms & Conditions Page

You mentioned you already have this page with 2 buttons. Update it to call the backend APIs:

```tsx
// pages/TermsAndConditions.tsx (or similar)
const API_URL = 'http://localhost:3000/api/v1';

const handleAccept = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_URL}/auth/terms/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.ok) {
    // ✅ Terms accepted - go to main page
    navigate('/dashboard');
  } else {
    const data = await response.json();
    alert(data.message);
  }
};

const handleDecline = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_URL}/auth/terms/decline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.ok) {
    // ⚠️ Terms declined - logout
    localStorage.removeItem('authToken');
    navigate('/login', { 
      state: { message: 'You must accept Terms of Service to continue' }
    });
  }
};
```

---

### 3. Protected Route Guard (Optional but Recommended)

Add a check in your protected routes to ensure ToS is accepted:

```tsx
// components/ProtectedRoute.tsx
const [termsAccepted, setTermsAccepted] = useState(false);

useEffect(() => {
  checkAuth();
}, []);

async function checkAuth() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const { data } = await response.json();
  setTermsAccepted(data.user.termsAccepted);
}

if (!termsAccepted) {
  return <Navigate to="/terms-and-conditions" />;
}
```

---

## 🧪 Testing Checklist

### Test Case 1: First-Time OAuth User
- [ ] Login with Google (new account)
- [ ] After redirect, should see Terms & Conditions page
- [ ] Click **Accept**
- [ ] Should redirect to dashboard
- [ ] Check browser DevTools → Application → Local Storage → authToken exists
- [ ] Logout and login again
- [ ] Should go directly to dashboard (ToS already accepted)

### Test Case 2: User Declines
- [ ] Login with Google
- [ ] Click **Decline** on ToS page
- [ ] Should be logged out
- [ ] Check Local Storage → authToken should be removed
- [ ] Should redirect to login page with message
- [ ] Login again with same Google account
- [ ] Should see ToS page again (not auto-accepted)

### Test Case 3: Existing OAuth User
- [ ] Login with Google account created before this feature
- [ ] Should see ToS page (termsAccepted = false by default)
- [ ] Accept ToS
- [ ] Subsequent logins go directly to dashboard

---

## 🎨 UI/UX Recommendations

### Terms & Conditions Page Layout
```
┌─────────────────────────────────────┐
│  Terms of Service & Privacy Policy  │
├─────────────────────────────────────┤
│                                     │
│  [Terms of Service content]         │
│                                     │
│  [Privacy Policy content]           │
│                                     │
│  ┌─────────┐  ┌─────────┐         │
│  │ Accept  │  │ Decline │         │
│  └─────────┘  └─────────┘         │
└─────────────────────────────────────┘
```

### Button States
- **Accept Button**: Primary color (green/blue)
- **Decline Button**: Secondary/warning color (gray/red)
- **Loading State**: Disable both buttons while API call in progress
- **Show spinner** on button during API call

### Messages
**After Decline**:
```
"You must accept our Terms of Service to use FitRecipes. 
You can try again by logging in."
```

**Network Error**:
```
"Unable to save your choice. Please check your connection and try again."
```

---

## 🔧 API Configuration

### Development
```tsx
const API_URL = 'http://localhost:3000/api/v1';
```

### Staging
```tsx
const API_URL = 'https://fitrecipes-backend-staging.onrender.com/api/v1';
```

### Production
```tsx
const API_URL = 'https://fitrecipes-backend.onrender.com/api/v1';
```

---

## 📊 Expected API Responses

### Success Responses
```json
// Accept Terms
{
  "status": "success",
  "message": "Terms of Service accepted successfully"
}

// Decline Terms
{
  "status": "success",
  "message": "Terms of Service declined. You have been logged out."
}
```

### Error Responses
```json
// Not Authenticated
{
  "status": "error",
  "message": "User not authenticated"
}

// Already Accepted
{
  "status": "error",
  "message": "Terms already accepted"
}
```

---

## 🔐 Security Notes

1. **Always use HTTPS** in production
2. **Include Authorization header** with Bearer token for both endpoints
3. **Clear token on decline** to prevent unauthorized access
4. **Validate token expiration** - if token expired, redirect to login
5. **Handle network errors** gracefully with user-friendly messages

---

## 🚀 Implementation Steps

1. **Update OAuth callback page**
   - Extract token from URL params
   - Store token in localStorage
   - Fetch user info (`/auth/me`)
   - Check `termsAccepted` field
   - Redirect accordingly

2. **Update Terms & Conditions page**
   - Add `handleAccept` function
   - Add `handleDecline` function
   - Connect to existing Accept/Decline buttons
   - Add loading states
   - Add error handling

3. **Add route guard (optional)**
   - Create `ProtectedRoute` component
   - Check `termsAccepted` on mount
   - Redirect to ToS if not accepted

4. **Test thoroughly**
   - Test all 3 scenarios above
   - Test network errors
   - Test token expiration
   - Test page refresh

---

## 📝 Code Examples

### Complete OAuth Callback Handler
```tsx
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

    localStorage.setItem('authToken', token);
    checkTermsAcceptance(token);
  }, [searchParams, navigate]);

  async function checkTermsAcceptance(token: string) {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Auth check failed');

      const data = await response.json();

      if (data.data.user.termsAccepted) {
        navigate('/dashboard');
      } else {
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

### Complete Terms & Conditions Page
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api/v1';

export function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_URL}/auth/terms/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to accept terms');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_URL}/auth/terms/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        localStorage.removeItem('authToken');
        navigate('/login', { 
          state: { message: 'You must accept Terms of Service to continue' }
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to decline terms');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terms-container">
      <h1>Terms of Service & Privacy Policy</h1>
      
      <div className="terms-content">
        {/* Your existing ToS and Privacy Policy content */}
      </div>

      {error && <div className="error-message">{error}</div>}

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

## 📚 Complete Documentation

Full technical details available in backend repo:
`docs/TERMS_OF_SERVICE_OAUTH_FLOW.md`

Includes:
- Database schema changes
- Backend implementation details
- API endpoint specifications
- Testing scenarios
- Security features

---

## ✅ Summary

**What Backend Provides**:
- ✅ OAuth response includes `termsAccepted` field
- ✅ `/auth/terms/accept` endpoint to accept ToS
- ✅ `/auth/terms/decline` endpoint to decline (logs out user)
- ✅ `/auth/me` endpoint to check current ToS status
- ✅ Database tracks acceptance with timestamp

**What Frontend Needs**:
- ⚠️ Check `termsAccepted` after OAuth callback
- ⚠️ Redirect to ToS page if not accepted
- ⚠️ Wire up Accept button to `/auth/terms/accept`
- ⚠️ Wire up Decline button to `/auth/terms/decline`
- ⚠️ Handle logout after decline
- ⚠️ Add loading and error states

**Estimated Implementation Time**: 2-3 hours

---

**Questions?** Refer to `docs/TERMS_OF_SERVICE_OAUTH_FLOW.md` in backend repo for complete technical documentation.

**Backend Status**: ✅ COMPLETE AND DEPLOYED  
**Frontend Status**: ⚠️ NEEDS IMPLEMENTATION  
**Ready to Start**: ✅ YES
