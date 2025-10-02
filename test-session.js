// Simple test script to demonstrate session management
const baseURL = 'http://localhost:3000/api/v1';

async function testSessionManagement() {
  console.log('🧪 Testing Session Management\n');

  try {
    // Step 1: Register a new user
    console.log('1. Registering user...');
    const registerResponse = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        agreeToTerms: true
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration:', registerData.status);
    
    if (registerData.status !== 'success') {
      console.log('❌ Registration failed:', registerData.message);
      return;
    }
    
    const token = registerData.data.token;
    console.log('🔑 Token received:', token.substring(0, 20) + '...\n');

    // Step 2: Test /me with valid token
    console.log('2. Testing /me with valid token...');
    const meResponse1 = await fetch(`${baseURL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const meData1 = await meResponse1.json();
    console.log('✅ /me response:', meData1.status);
    
    // Step 3: Logout (invalidate session)
    console.log('\n3. Logging out...');
    const logoutResponse = await fetch(`${baseURL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const logoutData = await logoutResponse.json();
    console.log('✅ Logout response:', logoutData.status);
    
    // Step 4: Test /me with same token after logout (should fail)
    console.log('\n4. Testing /me with same token after logout...');
    const meResponse2 = await fetch(`${baseURL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const meData2 = await meResponse2.json();
    console.log('❌ /me response after logout:', meData2.status, '-', meData2.message);
    
    if (meData2.status === 'error') {
      console.log('\n🎉 SUCCESS: Token is properly invalidated after logout!');
    } else {
      console.log('\n❌ FAILURE: Token still works after logout!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testSessionManagement();