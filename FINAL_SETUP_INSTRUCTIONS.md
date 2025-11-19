# 🚀 Final Setup Instructions - Hostinger CI/CD

## Your Architecture

```
┌─────────────────────────────────────────────────────┐
│  WordPress (Main Site)                              │
│  https://teerthankeraadinathbrightdentalcare.in/   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Client React App (Hostinger)                       │
│  https://client.teerthankeraadinathbrightdentalcare.in/ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Admin React App (Hostinger)                        │
│  https://admin.teerthankeraadinathbrightdentalcare.in/  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Backend API (Vercel)                               │
│  https://api.teerthankerdentalcare.com             │
└─────────────────────────────────────────────────────┘
```

**Key Point**: Only frontend apps deploy to Hostinger. API stays on Vercel!

---

## ⚡ Quick Setup (15 Minutes)

### Step 1: Create Environment Files (2 min)

#### Client Environment (`client/.env.production`):

```env
VITE_API_URL=https://api.teerthankerdentalcare.com/api
VITE_API_BASE_URL=https://api.teerthankerdentalcare.com
VITE_APP_NAME=Teerthanker Aadinath Bright Dental Care
```

#### Admin Environment (`admin/.env.production`):

```env
VITE_API_URL=https://api.teerthankerdentalcare.com/api
VITE_API_BASE_URL=https://api.teerthankerdentalcare.com
VITE_APP_NAME=Dental Care Admin
```

**Quick command:**
```bash
cp CLIENT_ENV_PRODUCTION.txt client/.env.production
cp ADMIN_ENV_PRODUCTION.txt admin/.env.production
```

---

### Step 2: Add GitHub Secrets (3 min)

**Go to**: GitHub Repository → **Settings** → **Secrets and variables** → **Actions**

Click **"New repository secret"** for each:

| Secret Name | Value |
|------------|-------|
| `FTP_SERVER` | `145.79.210.142` |
| `FTP_USERNAME` | `u730516688.teerthankeraadinathbrightdentalcare.in` |
| `FTP_PASSWORD` | `9AQoMuRhxiXH3c:X` |
| `FTP_PORT` | `21` |
| `FTP_PROTOCOL` | `ftp` |
| `FTP_CLIENT_PATH` | `/public_html/client/` |
| `FTP_ADMIN_PATH` | `/public_html/admin/` |
| `CLIENT_VITE_API_URL` | `https://api.teerthankerdentalcare.com/api` |
| `ADMIN_VITE_API_URL` | `https://api.teerthankerdentalcare.com/api` |

**⚠️ Security**: Change FTP password after first deployment!

---

### Step 3: Hostinger Folder Setup (2 min)

Log in to **Hostinger hPanel**:

1. Go to **Files** → **File Manager**
2. Navigate to `public_html/`
3. Create folders (if they don't exist):
   - **`client`**
   - **`admin`**

**Your structure:**
```
public_html/
├── (WordPress files)
├── wp-content/
├── wp-admin/
├── client/          ← React client deploys here
└── admin/           ← React admin deploys here
```

---

### Step 4: Configure Subdomains (3 min)

**In Hostinger hPanel** → **Domains** → **Subdomains**:

#### Client Subdomain:
- **Subdomain**: client.teerthankeraadinathbrightdentalcare.in
- **Document Root**: `/public_html/client`
- **SSL**: Enable ✅

#### Admin Subdomain:
- **Subdomain**: admin.teerthankeraadinathbrightdentalcare.in
- **Document Root**: `/public_html/admin`
- **SSL**: Enable ✅

---

### Step 5: Configure Vercel API CORS (CRITICAL - 3 min)

Your Vercel API needs to allow requests from your Hostinger subdomains.

**In Vercel Dashboard**:

1. Go to your API project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```
ALLOWED_ORIGINS=https://client.teerthankeraadinathbrightdentalcare.in,https://admin.teerthankeraadinathbrightdentalcare.in
```

**In your API code** (e.g., `server.js` or `index.js`):

```javascript
const cors = require('cors');

const allowedOrigins = [
  'https://client.teerthankeraadinathbrightdentalcare.in',
  'https://admin.teerthankeraadinathbrightdentalcare.in',
  'http://localhost:5173', // for local dev
  'http://localhost:3001'  // for local dev
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Redeploy your Vercel API** after adding CORS configuration!

---

### Step 6: Deploy! (2 min)

```bash
git add .
git commit -m "Configure CI/CD for Hostinger with Vercel API"
git push origin main
```

**Then watch**:
1. Go to **GitHub Actions** tab
2. Monitor "Deploy Client to Hostinger" 
3. Monitor "Deploy Admin to Hostinger"
4. Wait for ✅ green checkmarks (~3-5 min)

---

## ✅ Verify Your Deployment

### 1. Check Client App:

Visit: https://client.teerthankeraadinathbrightdentalcare.in/

- [ ] Page loads correctly
- [ ] No 404 errors
- [ ] Navigation works
- [ ] Open DevTools Console - no errors

**Test API connection:**
```javascript
// In browser console
fetch('https://api.teerthankerdentalcare.com/api/plans')
  .then(r => r.json())
  .then(d => console.log('API response:', d))
```

### 2. Check Admin App:

Visit: https://admin.teerthankeraadinathbrightdentalcare.in/

- [ ] Login page loads
- [ ] Routes work
- [ ] Can authenticate
- [ ] Dashboard displays data
- [ ] No console errors

### 3. Check API Connection:

- [ ] Client can fetch from Vercel API
- [ ] Admin can fetch from Vercel API
- [ ] No CORS errors in console
- [ ] Authentication works

---

## 🔄 How Auto-Deployment Works

**After setup, every push triggers deployment:**

```bash
# Make your changes
git add .
git commit -m "Update UI"
git push origin main

# GitHub Actions automatically:
# 1. Detects which app changed (client/admin)
# 2. Builds in production mode
# 3. Deploys to Hostinger via FTP
# 4. Your live site updates!
```

### Smart Deployment:

- Changes in `client/**` → Only client deploys
- Changes in `admin/**` → Only admin deploys
- Changes in `shared/**` → Both deploy
- Changes in `server/**` → No frontend deployment (only affects Vercel)

---

## 🌐 Your Complete URL Map

| Service | URL | Hosting |
|---------|-----|---------|
| **Main WordPress** | https://teerthankeraadinathbrightdentalcare.in/ | Hostinger |
| **Client App** | https://client.teerthankeraadinathbrightdentalcare.in/ | Hostinger (auto-deployed) |
| **Admin App** | https://admin.teerthankeraadinathbrightdentalcare.in/ | Hostinger (auto-deployed) |
| **Backend API** | https://api.teerthankerdentalcare.com | Vercel (separate deployment) |

---

## 🔧 Configuration Summary

### Client App:
- **Base URL**: `/`
- **API URL**: `https://api.teerthankerdentalcare.com/api`
- **Deploy Path**: `/public_html/client/`
- **Subdomain**: client.teerthankeraadinathbrightdentalcare.in

### Admin App:
- **Base URL**: `/`
- **API URL**: `https://api.teerthankerdentalcare.com/api`
- **Deploy Path**: `/public_html/admin/`
- **Subdomain**: admin.teerthankeraadinathbrightdentalcare.in

### API (Vercel):
- **Base URL**: https://api.teerthankerdentalcare.com
- **Allowed Origins**: client & admin subdomains
- **Separate deployment**: Push to Vercel (not affected by Hostinger CI/CD)

---

## 🐛 Troubleshooting

### ❌ CORS Error in Console

**Error**: "Access to fetch at 'https://api.teerthankerdentalcare.com/api/...' from origin '...' has been blocked by CORS policy"

**Solution**:
1. Check Vercel API has correct CORS configuration
2. Verify allowed origins include your subdomains
3. Redeploy Vercel API after CORS changes
4. Clear browser cache and reload

### ❌ API Returns 404

**Check**:
1. Vercel API is running (visit https://api.teerthankerdentalcare.com/api/plans)
2. API routes are correct
3. Vercel deployment succeeded

### ❌ Subdomain Shows 404

**Check**:
1. Folders exist on Hostinger (`/public_html/client/` and `/public_html/admin/`)
2. Subdomains point to correct folders
3. Files uploaded successfully (check File Manager)
4. `.htaccess` files are present
5. DNS propagated (can take up to 24 hours)

### ❌ GitHub Actions Fails

**Check**:
1. All 9 GitHub Secrets are correct
2. FTP credentials valid
3. Hostinger FTP is enabled
4. View detailed error in Actions logs

**Test FTP manually** with FileZilla:
- Host: 145.79.210.142
- Username: u730516688.teerthankeraadinathbrightdentalcare.in
- Password: Your password
- Port: 21

---

## 🔐 Security Checklist

- [ ] Change FTP password after first deployment
- [ ] Enable SSL on both subdomains
- [ ] Enable 2FA on Hostinger
- [ ] Enable 2FA on GitHub
- [ ] Configure CORS properly on Vercel API
- [ ] Don't commit `.env` files to Git
- [ ] Keep GitHub Secrets secure
- [ ] Regular security updates on Vercel API

---

## 📊 Deployment Monitoring

### GitHub Actions:
- View all deployments: **Actions** tab
- Download logs for debugging
- Email notifications: Settings → Notifications

### Hostinger:
- File Manager: Check uploaded files
- Access logs: Monitor traffic
- Error logs: Debug issues

### Vercel:
- Dashboard: API deployment status
- Logs: Real-time API monitoring
- Analytics: API usage stats

---

## 🚀 Production Deployment Workflow

### For Frontend Changes:

```bash
# 1. Make changes to client or admin
# 2. Test locally
cd client
npm run dev

# 3. Deploy
git add .
git commit -m "Update frontend"
git push origin main
# ✅ Auto-deploys to Hostinger
```

### For Backend (API) Changes:

```bash
# 1. Make changes to server
# 2. Test locally
cd server
npm run dev

# 3. Deploy to Vercel
git add .
git commit -m "Update API"
git push origin main
# ✅ Vercel auto-deploys (separate workflow)
```

---

## 📝 Quick Commands

```bash
# Deploy frontend changes
git add client/ admin/ shared/
git commit -m "Frontend updates"
git push origin main

# Check deployment status
# Visit: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# Test locally before deploying
cd client && npm run build && npm run preview
cd admin && npm run build && npm run preview

# Manual FTP upload (backup method)
# Build first:
cd client && npm run build
# Then upload client/dist/* to /public_html/client/
```

---

## 🎯 Testing Checklist

After deployment:

**Client App** (https://client.teerthankeraadinathbrightdentalcare.in/):
- [ ] Homepage loads
- [ ] Can view dental plans
- [ ] Can select a plan
- [ ] Authentication works
- [ ] Appointment booking works
- [ ] API calls successful
- [ ] No console errors
- [ ] Responsive on mobile

**Admin App** (https://admin.teerthankeraadinathbrightdentalcare.in/):
- [ ] Login page loads
- [ ] Can log in
- [ ] Dashboard displays
- [ ] Can view appointments
- [ ] Can manage plans
- [ ] Can view analytics
- [ ] API calls successful
- [ ] No console errors

**API** (https://api.teerthankerdentalcare.com):
- [ ] API responds to requests
- [ ] CORS allows frontend requests
- [ ] Authentication works
- [ ] Database queries work
- [ ] No errors in Vercel logs

---

## 📞 Support Resources

**Documentation**:
- This file: Complete setup guide
- `QUICK_START.md`: Fast overview
- `WORDPRESS_API_CORS.md`: ~~Not needed (using Vercel API)~~
- GitHub Actions logs: Detailed deployment info

**External Resources**:
- Hostinger Support: hPanel → Support
- Vercel Docs: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/actions

---

## ✅ Final Checklist

Before going live:

- [ ] **Step 1**: Environment files created
- [ ] **Step 2**: GitHub Secrets added (all 9)
- [ ] **Step 3**: Hostinger folders created
- [ ] **Step 4**: Subdomains configured with SSL
- [ ] **Step 5**: Vercel API CORS configured
- [ ] **Step 6**: First deployment successful
- [ ] **Verify**: Client loads and works
- [ ] **Verify**: Admin loads and works
- [ ] **Verify**: API calls work from both apps
- [ ] **Security**: FTP password changed
- [ ] **Security**: 2FA enabled everywhere
- [ ] **Testing**: All features work on production

---

## 🎉 You're All Set!

Your complete architecture:

✅ **WordPress** on Hostinger (main site)
✅ **Client React App** on Hostinger (auto-deployed)
✅ **Admin React App** on Hostinger (auto-deployed)
✅ **API** on Vercel (separate deployment)

**From now on**: Every push to GitHub automatically deploys your frontend apps to Hostinger!

---

**Questions?** Check the troubleshooting section or GitHub Actions logs! 🚀

