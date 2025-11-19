# Vercel API CORS Configuration

## Critical: Your API Must Allow Requests from Hostinger Subdomains

Since your frontend apps are on Hostinger subdomains but your API is on Vercel, you MUST configure CORS on your Vercel API.

---

## Your Configuration

**API on Vercel**: https://api.teerthankerdentalcare.com

**Frontend Apps on Hostinger**:
- https://client.teerthankeraadinathbrightdentalcare.in
- https://admin.teerthankeraadinathbrightdentalcare.in

---

## Option 1: Environment Variables (Recommended)

### In Vercel Dashboard:

1. Go to your API project
2. Click **Settings** → **Environment Variables**
3. Add this variable:

**Variable Name**: `ALLOWED_ORIGINS`

**Value**:
```
https://client.teerthankeraadinathbrightdentalcare.in,https://admin.teerthankeraadinathbrightdentalcare.in,http://localhost:5173,http://localhost:3001
```

4. Click **Save**
5. **Redeploy** your API

---

## Option 2: Code Configuration

### Using Express.js:

Add this to your `server/src/index.js` or `server/server.js`:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration
const allowedOrigins = [
  'https://client.teerthankeraadinathbrightdentalcare.in',
  'https://admin.teerthankeraadinathbrightdentalcare.in',
  'http://localhost:5173', // Client dev
  'http://localhost:3001', // Admin dev
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests
app.options('*', cors());

// Your routes...
app.use('/api', apiRoutes);

// Start server...
```

---

## Option 3: Middleware Configuration

### Using Environment Variables in Code:

```javascript
const cors = require('cors');

// Get allowed origins from environment
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || '';
  return origins.split(',').filter(Boolean);
};

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow no origin (for mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));
```

**Then in Vercel**:
- Add `ALLOWED_ORIGINS` environment variable
- Redeploy

---

## Testing CORS Configuration

### Test from Browser Console:

#### On Client App (https://client.teerthankeraadinathbrightdentalcare.in/):

```javascript
fetch('https://api.teerthankerdentalcare.com/api/plans')
  .then(response => response.json())
  .then(data => console.log('✅ API working:', data))
  .catch(error => console.error('❌ API error:', error));
```

#### On Admin App (https://admin.teerthankeraadinathbrightdentalcare.in/):

```javascript
fetch('https://api.teerthankerdentalcare.com/api/appointments')
  .then(response => response.json())
  .then(data => console.log('✅ API working:', data))
  .catch(error => console.error('❌ API error:', error));
```

### Expected Results:

✅ **Success**: Data returned, no errors in console
❌ **CORS Error**: "Access to fetch... has been blocked by CORS policy"

---

## Common CORS Errors & Solutions

### Error 1: "No 'Access-Control-Allow-Origin' header"

**Problem**: API doesn't have CORS configured

**Solution**: Add CORS middleware to your API

### Error 2: "Origin ... is not allowed"

**Problem**: Your subdomain not in allowed origins list

**Solution**: Add your subdomains to `allowedOrigins` array

### Error 3: "Preflight request doesn't pass"

**Problem**: OPTIONS method not handled

**Solution**: Add `app.options('*', cors());` before routes

### Error 4: "Credentials not allowed"

**Problem**: Using credentials without proper CORS setup

**Solution**: Set `credentials: true` in CORS config and specify exact origins (not `*`)

---

## Vercel Deployment

After updating CORS configuration:

```bash
# Commit changes
git add server/
git commit -m "Add CORS configuration for Hostinger subdomains"
git push origin main
```

Vercel will automatically redeploy your API.

**Or manually redeploy**:
1. Go to Vercel Dashboard
2. Select your API project
3. Click **Deployments** tab
4. Click **⋯** on latest deployment
5. Click **Redeploy**

---

## Environment Variables Checklist

In **Vercel Dashboard** → **Your API Project** → **Settings** → **Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `ALLOWED_ORIGINS` | `https://client.teerthankeraadinathbrightdentalcare.in,https://admin.teerthankeraadinathbrightdentalcare.in,http://localhost:5173,http://localhost:3001` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `MONGODB_URI` | `your_mongodb_connection` | Production |
| (other env vars) | ... | ... |

---

## Security Best Practices

### DO:
✅ Specify exact origins (not `*`)
✅ Use HTTPS in production
✅ Include `credentials: true` if using cookies/auth
✅ List only necessary methods
✅ Validate origin on server
✅ Handle OPTIONS preflight

### DON'T:
❌ Use `*` with credentials
❌ Allow all origins in production
❌ Forget to handle preflight requests
❌ Expose sensitive headers
❌ Allow unnecessary methods

---

## Debugging CORS Issues

### 1. Check Network Tab in DevTools:

- Look for OPTIONS request (preflight)
- Check response headers
- Verify status code (should be 200 or 204)

### 2. Check Vercel Logs:

- Go to Vercel Dashboard
- Click your API project
- Go to **Deployments** → **Functions**
- Check logs for CORS errors

### 3. Test API Directly:

```bash
# Test API directly (no CORS)
curl https://api.teerthankerdentalcare.com/api/plans

# Test with Origin header
curl -H "Origin: https://client.teerthankeraadinathbrightdentalcare.in" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.teerthankerdentalcare.com/api/plans
```

### 4. Check CORS Headers:

Expected response headers:
```
Access-Control-Allow-Origin: https://client.teerthankeraadinathbrightdentalcare.in
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

---

## Quick Fix Checklist

If API calls fail from Hostinger:

- [ ] CORS middleware installed (`npm install cors`)
- [ ] CORS configured in API code
- [ ] Allowed origins include Hostinger subdomains
- [ ] Environment variables set in Vercel
- [ ] API redeployed after CORS changes
- [ ] Browser cache cleared
- [ ] No typos in URLs
- [ ] HTTPS used (not HTTP)
- [ ] Preflight requests handled

---

## Example: Complete Express.js Setup

```javascript
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS Configuration
const allowedOrigins = [
  'https://client.teerthankeraadinathbrightdentalcare.in',
  'https://admin.teerthankeraadinathbrightdentalcare.in',
  'http://localhost:5173',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Parse JSON
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api', require('./routes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
```

---

## Verification

Once CORS is configured correctly, you should see:

✅ **In Browser Console**: No CORS errors
✅ **In Network Tab**: Status 200 for API requests
✅ **In Response Headers**: Correct CORS headers
✅ **In Your Apps**: Data loads from API

---

## Support

**If CORS still doesn't work**:

1. Check Vercel logs for errors
2. Verify exact URL spelling (no trailing slashes, etc.)
3. Test API with curl/Postman
4. Check browser console for specific error
5. Verify SSL certificates are valid
6. Contact Vercel support if infrastructure issue

---

**After CORS configuration, your frontend apps will successfully communicate with your Vercel API!** ✅

