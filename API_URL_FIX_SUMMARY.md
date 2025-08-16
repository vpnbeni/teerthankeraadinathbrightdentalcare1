# API URL Fix Summary

## Problem
The admin build hosted on Hostinger was trying to hit the wrong API endpoint:
- **Wrong URL**: `https://api.teerthankerdentalcare.com/api/auth/admin/login`
- **Correct URL**: `https://teerthanker-server.vercel.app/api/auth/admin/login`

## Root Cause
1. The `shared/constants/api.js` file contained the old API domain
2. The Vite build process wasn't properly setting environment variables for production
3. The admin and client builds were falling back to localhost URLs

## Files Fixed

### 1. Shared Constants
- **File**: `shared/constants/api.js`
- **Change**: Updated `API_BASE_URL` from `https://api.teerthankerdentalcare.com` to `https://teerthanker-server.vercel.app`

### 2. Vite Configurations
- **Admin**: `admin/vite.config.js` - Added environment loading and production API URL definition
- **Client**: `client/vite.config.js` - Added environment loading and production API URL definition

### 3. Package.json Scripts
- **Admin**: `admin/package.json` - Added `build:prod` script with `--mode production`
- **Client**: `client/package.json` - Added `build:prod` script with `--mode production`

### 4. Environment Files
- **Admin**: `admin/env.production` - Production environment variables
- **Client**: `client/env.production` - Production environment variables

### 5. Build Scripts
- **Windows**: `scripts/build-production.bat` - Automated production build script
- **Unix**: `scripts/build-production.sh` - Automated production build script

## How to Rebuild

### Option 1: Using Build Scripts (Recommended)
```bash
# Windows
scripts\build-production.bat

# Unix/Linux/Mac
./scripts/build-production.sh
```

### Option 2: Manual Build
```bash
# Build Admin
cd admin
npm run build:prod

# Build Client
cd client
npm run build:prod
```

### Option 3: Standard Build (Not Recommended for Production)
```bash
# Admin
cd admin
npm run build

# Client
cd client
npm run build
```

## Verification

### 1. Check Built Files
After building, verify the correct API URL is in the built JavaScript files:
```bash
# Check admin build
grep -r "teerthanker-server.vercel.app" admin/dist/

# Check client build
grep -r "teerthanker-server.vercel.app" client/dist/
```

### 2. Test API Configuration
Run the test script to verify API connectivity:
```bash
node test-api-config.js
```

## Deployment

### Hostinger Deployment
1. **Rebuild** both admin and client using the production build commands
2. **Upload** the new `dist` folder contents to your Hostinger subdomains
3. **Verify** that the login API calls now go to `https://teerthanker-server.vercel.app/api/auth/admin/login`

### File Structure After Build
```
admin/dist/          # Admin dashboard build output
client/dist/         # Client portal build output
```

## Environment Variables

### Production Environment
The builds now automatically use these production values:
- `VITE_API_URL`: `https://teerthanker-server.vercel.app/api`
- `VITE_NODE_ENV`: `production`

### Development Environment
Development builds still use:
- `VITE_API_URL`: `http://localhost:5000/api` (or from .env file)
- `VITE_NODE_ENV`: `development`

## Testing

### Before Deployment
1. Run `npm run build:prod` in both admin and client directories
2. Check that the built files contain the correct API URL
3. Test locally with `npm run preview`

### After Deployment
1. Verify login functionality works
2. Check browser network tab to confirm API calls go to Vercel
3. Run the API test script to verify connectivity

## Troubleshooting

### Common Issues
1. **Wrong API URL still showing**: Ensure you're using `build:prod` not `build`
2. **Build fails**: Check that all dependencies are installed
3. **API calls still failing**: Verify your Vercel server is running and accessible

### Debug Steps
1. Check browser console for API errors
2. Verify the built JavaScript contains correct URLs
3. Test API endpoints directly with tools like Postman
4. Check Vercel deployment status

## Summary
The fix ensures that:
- ✅ Production builds use the correct Vercel API URL
- ✅ Development builds still use localhost
- ✅ Environment variables are properly handled during build
- ✅ Build process is automated and verifiable
- ✅ API calls will now go to `https://teerthanker-server.vercel.app/api`

After rebuilding and redeploying, your admin login should work correctly with the Vercel server.
