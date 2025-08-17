# JWT Token Authentication Flow Implementation

## Overview

This document describes the complete JWT token-based authentication flow implemented in the client application. The system stores JWT tokens in localStorage and automatically includes them in API request headers.

## Flow Summary

1. **User Login**: User submits OTP via `/api/auth/login-otp`
2. **Token Storage**: JWT token is automatically stored in localStorage
3. **Header Injection**: All subsequent API calls automatically include the token in Authorization header
4. **Authentication Check**: Token is validated on each protected API call
5. **State Management**: Authentication state is managed via Redux and custom hooks

## Key Components

### 1. Token Management (`client/src/utils/tokenManager.js`)

Centralized token handling utilities:

```javascript
// Store JWT token
export const storeToken = (token) => { ... }

// Retrieve token
export const getToken = () => { ... }

// Remove token
export const removeToken = () => { ... }

// Validate token expiration
export const hasValidToken = () => { ... }

// Get token expiration time
export const getTokenExpiration = () => { ... }

// Extract user ID from token
export const getUserIdFromToken = () => { ... }
```

### 2. Authentication Service (`client/src/services/auth.js`)

Handles all authentication-related API calls and automatically stores tokens:

```javascript
// Login with OTP
loginWithOTP: async (data) => {
  const response = await api.post("/auth/login-otp", data, {
    skipErrorMessage: true,
    skipRedirect: true,
  });
  
  // Extract token from nested response structure
  const token = response.data?.data?.token || response.data?.token;
  if (token) {
    storeToken(token); // Uses tokenManager
    resetAuthFailureState();
  }
  return response;
}
```

### 3. API Service (`client/src/services/api.js`)

Automatically injects JWT tokens into request headers:

```javascript
// Request interceptor
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = getToken(); // Uses tokenManager
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. Authentication Hook (`client/src/hooks/useAuth.js`)

Provides authentication state and methods:

```javascript
export const useAuth = () => {
  // Handle successful login and update auth state
  const handleSuccessfulLogin = useCallback(async (loginResponse) => {
    const userData = loginResponse.data?.data?.user || loginResponse.data?.user;
    const token = loginResponse.data?.data?.token || loginResponse.data?.token;
    
    if (userData && token) {
      setIsAuthenticated(true);
      setUser(userData);
      setError(null);
      
      // Verify the token is working by making an auth check
      await checkAuthStatus();
      return userData;
    }
  }, [checkAuthStatus]);
  
  // ... other methods
};
```

### 5. Login Form (`client/src/components/auth/LoginForm.jsx`)

Uses the authentication hook for login:

```javascript
const onSubmit = async (data) => {
  try {
    const response = await authService.loginWithOTP({
      phone: data.phone, 
      otp: data.otp
    });

    // Use the new handleSuccessfulLogin function
    await handleSuccessfulLogin(response);
    
    // Close the modal after successful login
    onClose();
  } catch (error) {
    // Handle error
  }
};
```

## API Response Structure

The API returns tokens in this nested structure:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68a06a0141fcc1a9e38e8b1a",
      "name": "John Snow",
      "email": "vipinqurilo@gmail.com",
      "role": "user",
      "isVerified": true,
      "subscription": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

## Token Flow

1. **Login Request**: `POST /api/auth/login-otp`
2. **Response Processing**: Token extracted from `response.data.data.token`
3. **Storage**: Token stored in localStorage via `storeToken()`
4. **Header Injection**: All subsequent requests automatically include `Authorization: Bearer <token>`
5. **Validation**: Server validates token on each protected endpoint

## Security Features

- **Token Expiration**: Automatic validation and cleanup of expired tokens
- **Admin Guard**: Prevents admin tokens from being used in client app
- **Automatic Cleanup**: Tokens removed on logout or authentication failure
- **Error Handling**: Graceful fallback when tokens are invalid

## Debug Tools

### AuthDebug Component

Located at `/debug/api`, provides real-time authentication state:

- Current authentication status
- Token validity and expiration
- User information
- Manual token management
- API testing capabilities

### Console Logging

Comprehensive logging throughout the authentication flow:

```
🔐 Token stored in localStorage
🔍 checkAuthStatus: Starting auth check...
🔐 handleSuccessfulLogin: Processing login response
```

## Testing the Flow

1. **Navigate to**: `http://localhost:3000/#/debug/api`
2. **Login**: Use the login form with OTP
3. **Monitor**: Watch the AuthDebug panel for state changes
4. **Test APIs**: Use the API test buttons to verify authentication
5. **Check Network**: Monitor browser dev tools for Authorization headers

## Troubleshooting

### Common Issues

1. **Token Not Stored**: Check browser console for storage errors
2. **Headers Missing**: Verify tokenManager is working correctly
3. **401 Errors**: Check token expiration and validity
4. **State Mismatch**: Ensure useAuth hook is properly updating state

### Debug Steps

1. Check localStorage for token presence
2. Verify Authorization header in Network tab
3. Monitor console for authentication logs
4. Use AuthDebug component for real-time state
5. Test individual API endpoints

## Future Enhancements

- **Token Refresh**: Implement automatic token renewal
- **Secure Storage**: Consider using httpOnly cookies for production
- **Offline Support**: Cache authentication state for offline use
- **Multi-device**: Handle concurrent sessions across devices
