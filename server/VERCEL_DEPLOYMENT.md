# Vercel Deployment Guide

## Pre-deployment Checklist

### 1. Files Ready ✅

- [x] `vercel.json` - Vercel configuration
- [x] `api/index.js` - Serverless entry point
- [x] `package.json` - Dependencies and scripts
- [x] `build.js` - Build validation script

### 2. Environment Variables Required

Add these in your Vercel dashboard (Settings → Environment Variables):

#### Essential Variables

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secure-256-bit-jwt-secret-key
```

#### Payment Integration

```
RAZORPAY_KEY_ID=rzp_live_or_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### File Upload (Cloudinary)

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Security (HIPAA Compliance)

```
ENCRYPTION_KEY=64-character-hex-string-for-encryption
```

#### SMS Provider (Choose one)

**Option A - MSG91:**

```
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SIGNUP_TEMPLATE_ID=68d793ac2eaa4904d84ec094
MSG91_LOGIN_TEMPLATE_ID=68d79385b2eae3049a0a8c13
MSG91_SENDER_ID=TABDCL
```

**Option B - Twilio:**

```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3. Deployment Steps

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **Important:** Set Root Directory to `server`

3. **Configure Environment Variables**

   - Go to Project Settings → Environment Variables
   - Add all required variables listed above

4. **Deploy**
   - Click "Deploy" or push to trigger automatic deployment

### 4. Post-deployment Testing

Test these URLs after deployment:

#### Health Checks

- `https://your-app.vercel.app/` - Basic health check
- `https://your-app.vercel.app/api` - API health check
- `https://your-app.vercel.app/api/test` - Environment variables test
- `https://your-app.vercel.app/api/health` - Database connection test

#### API Endpoints

- `POST https://your-app.vercel.app/api/auth/register` - User registration
- `POST https://your-app.vercel.app/api/auth/login` - User login
- `GET https://your-app.vercel.app/api/plans` - Get plans

### 5. Common Issues & Solutions

#### 404 Error

- **Cause:** Root directory not set to `server`
- **Solution:** Go to Vercel project settings → Set Root Directory to `server`

#### Environment Variables Missing

- **Cause:** Required env vars not set in Vercel dashboard
- **Solution:** Add all required variables in Vercel dashboard

#### Database Connection Failed

- **Cause:** Invalid MongoDB URI or network issues
- **Solution:** Check MongoDB Atlas whitelist (allow all IPs: 0.0.0.0/0)

#### CORS Errors

- **Cause:** Frontend domain not in CORS whitelist
- **Solution:** Update CORS configuration in `api/index.js`

### 6. Monitoring & Logs

- **Vercel Dashboard:** View deployment logs and function logs
- **MongoDB Atlas:** Monitor database connections and queries
- **Error Tracking:** Check Vercel function logs for errors

### 7. Production Optimization

#### Performance

- Database connection pooling (already configured)
- Response compression (already enabled)
- Request size limits (already set)

#### Security

- CORS properly configured
- Rate limiting (implement if needed)
- Input validation (already implemented)
- HTTPS enforced by Vercel

#### Monitoring

- Set up alerts for function errors
- Monitor database performance
- Track API response times

## Quick Deployment Command

Run this to validate your setup before deployment:

```bash
npm run build
```

This will check all required files and dependencies are in place.

## Support

If you encounter issues:

1. Check Vercel function logs
2. Verify all environment variables are set
3. Test database connection separately
4. Check CORS configuration for your frontend domain
