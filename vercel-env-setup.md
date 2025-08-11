# Vercel Environment Variables Setup

## Problem

Your Vercel deployment is failing because `MONGODB_URI` is undefined. Vercel doesn't automatically load `.env` files - you need to set environment variables in the Vercel dashboard.

## Solution Steps

### 1. Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Select your `teerthanker-server` project
3. Go to Settings → Environment Variables

### 2. Add These Environment Variables

Copy these EXACT values into Vercel's environment variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://vpnbenidev:Vipin%406921@cluster0.agz3j.mongodb.net/teerthanker-dental-care-test
JWT_SECRET=super-secret-jwt-key-for-development-only-make-it-long-and-complex-at-least-32-characters
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
ENCRYPTION_KEY=378d8ba5ab559343e9b57e817a73ec39828e08cf5a5a8ca2fc38cd34899ef84b
CLOUDINARY_CLOUD_NAME=dummy-cloud-name
CLOUDINARY_API_KEY=dummy-api-key
CLOUDINARY_API_SECRET=dummy-api-secret
MSG91_AUTH_KEY=455054AEZWUdcJOVj68826953P1
MSG91_TEMPLATE_ID=68839baad6fc05627e3c1915
EMAIL_FROM_NAME=Teerthanker Dental Care
EMAIL_FROM=vpnbeniwal123@gmail.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=vpnbeniwal123@gmail.com
EMAIL_PASS=egtx hkaw irze nspv
RAZORPAY_KEY_ID=rzp_test_tbHCcBCOBwdMeC
RAZORPAY_KEY_SECRET=jI9QtrX5ucMPrM3qbhPTMCpO
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret-here
CLIENT_URL=https://teerthankeraadinathbrightdentalcare-ten.vercel.app
ADMIN_URL=https://teerthankeraadinathbrightdentalcare-ten.vercel.app
```

### 3. Redeploy

After adding the environment variables, trigger a new deployment by:

- Pushing a small change to your repository, OR
- Going to Deployments tab and clicking "Redeploy"

### 4. Test the Fixed Endpoint

After redeployment, test:

```
https://teerthanker-server.vercel.app/api/test
```

This should show all environment variables as "✅ Set" instead of "❌ Missing".

## About the Localhost Error

The localhost error `"Access denied. No token provided."` is CORRECT behavior. The `/api/auth/check` endpoint requires authentication. To test it properly, you need to:

1. First login via `/api/auth/login` to get a token
2. Then use that token to access `/api/auth/check`

## Quick Test Commands

Test the fixed Vercel deployment:

```bash
curl https://teerthanker-server.vercel.app/api/test
```

Test localhost (this should still show the token error, which is correct):

```bash
curl http://localhost:5000/api/auth/check
```
