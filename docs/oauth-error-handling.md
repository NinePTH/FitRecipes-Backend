# OAuth User Login Scenarios

## 📋 **User Authentication Scenarios**

### **Scenario 1: Regular User Login** ✅
```bash
# User registered with email/password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"regular@example.com","password":"correct-password"}'

# Response: 200 OK
{
  "status": "success",
  "data": {
    "user": { "id": "...", "email": "...", "role": "USER" },
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

### **Scenario 2: OAuth User Tries Password Login** ⚠️
```bash
# User created via Google OAuth tries password login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"oauth-user@gmail.com","password":"any-password"}'

# Response: 400 Bad Request
{
  "status": "error",
  "data": null,
  "message": "This account is linked to Google. Please use \"Sign in with Google\" instead of email/password."
}
```

### **Scenario 3: Invalid Credentials** ❌
```bash
# Wrong email or password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"wrong-password"}'

# Response: 401 Unauthorized
{
  "status": "error",
  "data": null,
  "message": "Invalid email or password"
}
```

### **Scenario 4: Account Temporarily Locked** 🔒
```bash
# Account blocked due to too many failed attempts
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"blocked@example.com","password":"any-password"}'

# Response: 401 Unauthorized
{
  "status": "error",
  "data": null,
  "message": "Account temporarily locked"
}
```

## 🎯 **Error Message Guidelines**

### **Clear and Actionable Messages**
- ✅ **OAuth Users**: Explains exactly what to do (use Google login)
- ✅ **Invalid Credentials**: Generic message for security
- ✅ **Account Locked**: Clear status indication
- ✅ **Validation Errors**: Specific field-level feedback

### **HTTP Status Codes**
- `200` - Successful login
- `400` - Bad request (OAuth user, validation errors)
- `401` - Unauthorized (wrong credentials, locked account)
- `500` - Internal server error (unexpected errors)

### **Frontend Integration**
```javascript
// Example frontend error handling
async function handleLogin(email, password) {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success: store token, redirect user
      localStorage.setItem('token', data.data.token);
      redirectToHome();
    } else {
      // Handle specific error cases
      if (data.message.includes('linked to Google')) {
        showGoogleLoginOption();
      } else if (data.message.includes('temporarily locked')) {
        showAccountLockedMessage();
      } else {
        showGenericError(data.message);
      }
    }
  } catch (error) {
    showNetworkError();
  }
}
```

## ✅ **Testing Verification**

All scenarios have been tested and return appropriate error messages:

1. **OAuth Detection**: ✅ Correctly identifies OAuth users
2. **Error Messages**: ✅ Clear, actionable feedback
3. **Status Codes**: ✅ Proper HTTP codes for each scenario
4. **Security**: ✅ No sensitive information leaked
5. **User Experience**: ✅ Guides users to correct login method