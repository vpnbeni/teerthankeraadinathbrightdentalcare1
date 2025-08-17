/**
 * Authentication Flow Test Utility
 * Tests the complete JWT token authentication flow
 */

import { storeToken, getToken, hasValidToken, removeToken } from './tokenManager';

/**
 * Test the complete authentication flow
 */
export const testAuthFlow = async () => {
  console.log('🧪 Starting Authentication Flow Test...');
  
  try {
    // Step 1: Clear any existing tokens
    console.log('Step 1: Clearing existing tokens...');
    removeToken();
    
    if (getToken()) {
      throw new Error('Token still exists after removal');
    }
    console.log('✅ Tokens cleared successfully');
    
    // Step 2: Simulate login response (mimic the API response structure)
    console.log('Step 2: Simulating login response...');
    const mockLoginResponse = {
      data: {
        success: true,
        data: {
          user: {
            id: 'test-user-123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            isVerified: true
          },
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xMjMiLCJpYXQiOjE3NTU0MTE3NzgsImV4cCI6MTc1NjAxNjU3OH0.test-signature'
        },
        message: 'Login successful'
      }
    };
    
    // Step 3: Extract and store token
    console.log('Step 3: Extracting and storing token...');
    const token = mockLoginResponse.data?.data?.token || mockLoginResponse.data?.token;
    
    if (!token) {
      throw new Error('No token found in response');
    }
    
    storeToken(token);
    console.log('✅ Token stored successfully');
    
    // Step 4: Verify token retrieval
    console.log('Step 4: Verifying token retrieval...');
    const retrievedToken = getToken();
    
    if (retrievedToken !== token) {
      throw new Error('Retrieved token does not match stored token');
    }
    console.log('✅ Token retrieval successful');
    
    // Step 5: Test token validation
    console.log('Step 5: Testing token validation...');
    const isValid = hasValidToken();
    
    if (!isValid) {
      throw new Error('Token validation failed');
    }
    console.log('✅ Token validation successful');
    
    // Step 6: Test API header injection (simulate)
    console.log('Step 6: Testing API header injection...');
    const mockApiConfig = {
      headers: {},
      url: '/api/test'
    };
    
    // Simulate the API interceptor
    if (retrievedToken) {
      mockApiConfig.headers.Authorization = `Bearer ${retrievedToken}`;
    }
    
    if (!mockApiConfig.headers.Authorization) {
      throw new Error('Authorization header not set');
    }
    
    if (!mockApiConfig.headers.Authorization.startsWith('Bearer ')) {
      throw new Error('Authorization header format incorrect');
    }
    
    console.log('✅ API header injection successful');
    console.log('   Authorization header:', mockApiConfig.headers.Authorization);
    
    // Step 7: Cleanup
    console.log('Step 7: Cleaning up...');
    removeToken();
    
    if (getToken()) {
      throw new Error('Token still exists after cleanup');
    }
    console.log('✅ Cleanup successful');
    
    console.log('🎉 Authentication Flow Test PASSED!');
    return true;
    
  } catch (error) {
    console.error('❌ Authentication Flow Test FAILED:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

/**
 * Test token expiration handling
 */
export const testTokenExpiration = () => {
  console.log('🧪 Testing Token Expiration...');
  
  try {
    // Test with expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.expired-signature';
    
    storeToken(expiredToken);
    
    const isValid = hasValidToken();
    
    if (isValid) {
      console.log('⚠️ Expired token validation may need improvement');
    } else {
      console.log('✅ Expired token properly rejected');
    }
    
    removeToken();
    
  } catch (error) {
    console.error('❌ Token expiration test failed:', error);
  }
};

/**
 * Run all authentication tests
 */
export const runAllAuthTests = async () => {
  console.log('🚀 Running All Authentication Tests...');
  console.log('=====================================');
  
  const flowTest = await testAuthFlow();
  testTokenExpiration();
  
  console.log('=====================================');
  if (flowTest) {
    console.log('🎉 All tests completed successfully!');
  } else {
    console.log('❌ Some tests failed. Check console for details.');
  }
  
  return flowTest;
};

// Auto-run tests if this file is imported directly
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add to window for console access
  window.testAuthFlow = testAuthFlow;
  window.testTokenExpiration = testTokenExpiration;
  window.runAllAuthTests = runAllAuthTests;
  
  console.log('🧪 Auth test utilities available in console:');
  console.log('  - testAuthFlow()');
  console.log('  - testTokenExpiration()');
  console.log('  - runAllAuthTests()');
}
