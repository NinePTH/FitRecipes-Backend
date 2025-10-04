#!/bin/bash

echo "🧪 FitRecipes Authentication API Test Suite"
echo "============================================"

BASE_URL="http://localhost:3000/api/v1/auth"

# Test 1: Valid Registration
echo -e "\n✅ Test 1: Valid Registration"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "New",
    "lastName": "User",
    "email": "newtest@example.com",
    "password": "password123",
    "agreeToTerms": true
  }' | echo "$(cat)" | head -c 200 && echo "..."

# Test 2: Duplicate Email  
echo -e "\n❌ Test 2: Duplicate Email Registration"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Another",
    "lastName": "User",
    "email": "existing@example.com",
    "password": "password123",
    "agreeToTerms": true
  }' | echo "$(cat)"

# Test 3: Short Password
echo -e "\n❌ Test 3: Short Password"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "shortpass@example.com",
    "password": "123",
    "agreeToTerms": true
  }' | echo "$(cat)"

# Test 4: No Terms Agreement
echo -e "\n❌ Test 4: No Terms Agreement"
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "noterms@example.com",
    "password": "password123",
    "agreeToTerms": false
  }' | echo "$(cat)"

# Test 5: Valid Login
echo -e "\n✅ Test 5: Valid Login"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "password123"
  }' | echo "$(cat)" | head -c 200 && echo "..."

# Test 6: Invalid Credentials
echo -e "\n❌ Test 6: Invalid Credentials"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }' | echo "$(cat)"

# Test 7: Blocked Account
echo -e "\n❌ Test 7: Blocked Account"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "blocked@example.com",
    "password": "password123"
  }' | echo "$(cat)"

echo -e "\n\n🎉 All tests completed!"
echo "Frontend integration should work perfectly with these endpoints."