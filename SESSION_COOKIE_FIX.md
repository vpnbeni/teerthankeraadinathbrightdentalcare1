# Session Cookie Fix for Production

## Issue Description

When users log in using Gmail authentication in production, they experience:

1. Successful verification token validation
2. Brief session-related error flash (1 second)
3. Redirect to home page
4. Profile API returns "Your session has expired please log in again"
5. Issue doesn't occur in localhost

## Root Cause Analysis

The issue was caused by **cookie configuration problems** in production:

### 1. CORS Configuration Issues

- Production CORS origins only included `client.teerthankerdentalcare.com` and `admin.teerthankerdentalcare.com`
- Actual production URL is `https://teerthankeraadinathbrightdentalcare-ten.vercel.app`
- Requests from the actual domain were being blocked by CORS

### 2. Cookie Domain Issues

- Cookies were being set with domain `.teerthankerdentalcare.com` in production
- Vercel deployment uses `teerthankeraadinathbrightdentalcare-ten.vercel.app` domain
- Browser couldn't set/read cookies due to domain mismatch

### 3. Cookie SameSite Issues

- Production cookies were set with `sameSite: "strict"`
- This prevents cookies from being sent in cross-site requests
- Vercel deployments often require `sameSite: "none"` for proper functionality

## Applied Fixes

### 1. Updated CORS Configuration

**File:** `server/src/middleware/security.js`

```javascript
// Before
const allowedOrigins = config.NODE_ENV === "production"
  ? [
      "https://client.teerthankerdentalcare.com",
      "https://admin.teerthankerdentalcare.com",
    ]
  : [...];

// After
const allowedOrigins = config.NODE_ENV === "production"
  ? config.CORS_ORIGINS.production
  : config.CORS_ORIGINS.development;
```

**File:** `server/src/config/environment.js`

```javascript
CORS_ORIGINS: {
  production: [
    process.env.CLIENT_URL || "https://teerthankeraadinathbrightdentalcare-ten.vercel.app",
    process.env.ADMIN_URL || "https://teerthankeraadinathbrightdentalcare-ten.vercel.app",
    process.env.PROD_CLIENT_URL || "https://client.teerthankerdentalcare.com",
    process.env.PROD_ADMIN_URL || "https://admin.teerthankerdentalcare.com",
    "https://teerthankeraadinathbrightdentalcare.vercel.app",
  ],
}
```

### 2. Fixed Cookie Configuration

**File:** `server/src/services/authService.js`

```javascript
// Before
setTokenCookie(res, token) {
  const cookieOptions = {
    // ...
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    domain: config.NODE_ENV === "production" ? ".teerthankerdentalcare.com" : undefined,
  };
}

// After
setTokenCookie(res, token) {
  const cookieOptions = {
    // ...
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    domain: undefined, // Don't set domain for Vercel deployments
  };
}
```

### 3. Updated Admin Login Cookie

**File:** `server/src/controllers/authController.js`

```javascript
// Before
res.cookie("token", result.token, {
  sameSite: "strict",
});

// After
res.cookie("token", result.token, {
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});
```

### 4. Added CORS Debugging

Added logging to help debug CORS issues:

```javascript
if (allowedOrigins.includes(origin)) {
  callback(null, true);
} else {
  console.log(`CORS blocked origin: ${origin}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
  callback(new Error("Not allowed by CORS"));
}
```

## Environment Variables to Update

Make sure these environment variables are set correctly in production:

```bash
CLIENT_URL=https://teerthankeraadinathbrightdentalcare-ten.vercel.app
ADMIN_URL=https://teerthankeraadinathbrightdentalcare-ten.vercel.app
NODE_ENV=production
```

## Testing

1. **Test CORS**: Check browser network tab for CORS errors
2. **Test Cookies**: Check Application tab in DevTools for cookie presence
3. **Test Authentication**: Complete login flow and verify session persistence
4. **Test Profile API**: Ensure profile API works after login

## Expected Behavior After Fix

1. ✅ Gmail authentication completes successfully
2. ✅ No session-related error flash
3. ✅ User remains logged in after verification
4. ✅ Profile API returns user data correctly
5. ✅ Session persists across page refreshes

## Deployment Notes

After applying these fixes:

1. **Redeploy the server** with updated configurations
2. **Clear browser cache** and cookies for testing
3. **Test the complete authentication flow** in production
4. **Monitor server logs** for any CORS-related errors

## Prevention

To prevent similar issues in the future:

1. Always test authentication flow in production environment
2. Use environment variables for all domain configurations
3. Set up proper CORS logging for debugging
4. Document all cookie configuration requirements
5. Test with different browsers and incognito mode
