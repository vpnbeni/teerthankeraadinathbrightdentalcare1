# 🚀 Quick Start - Your Configuration

## Your Setup

- **WordPress**: https://teerthankeraadinathbrightdentalcare.in/
- **Client App**: https://client.teerthankeraadinathbrightdentalcare.in/
- **Admin App**: https://admin.teerthankeraadinathbrightdentalcare.in/

---

## ⚡ 5-Step Setup (10 Minutes)

### Step 1: Create Environment Files (1 min)

#### Copy `CLIENT_ENV_PRODUCTION.txt` content to `client/.env.production`:
```bash
cd client
# Create file .env.production with this content:
VITE_API_URL=https://api.teerthankerdentalcare.com/api
VITE_API_BASE_URL=https://api.teerthankerdentalcare.com
VITE_APP_NAME=Teerthanker Aadinath Bright Dental Care
```

#### Copy `ADMIN_ENV_PRODUCTION.txt` content to `admin/.env.production`:
```bash
cd admin
# Create file .env.production with this content:
VITE_API_URL=https://api.teerthankerdentalcare.com/api
VITE_API_BASE_URL=https://api.teerthankerdentalcare.com
VITE_APP_NAME=Dental Care Admin
```

---

### Step 2: Add GitHub Secrets (3 min)

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

Add these 9 secrets (click **New repository secret** for each):

```
FTP_SERVER = 145.79.210.142
FTP_USERNAME = u730516688.teerthankeraadinathbrightdentalcare.in
FTP_PASSWORD = 9AQoMuRhxiXH3c:X
FTP_PORT = 21
FTP_PROTOCOL = ftp
FTP_CLIENT_PATH = /public_html/client/
FTP_ADMIN_PATH = /public_html/admin/
CLIENT_VITE_API_URL = https://api.teerthankerdentalcare.com/api
ADMIN_VITE_API_URL = https://api.teerthankerdentalcare.com/api
```

**⚠️ SECURITY**: Change FTP password after setup!

---

### Step 3: Create Folders on Hostinger (2 min)

Log in to Hostinger hPanel:

1. Go to **Files** → **File Manager**
2. Navigate to `public_html/`
3. Create two folders:
   - `client`
   - `admin`

---

### Step 4: Configure Subdomains (2 min)

In Hostinger hPanel → **Domains** → **Subdomains**:

1. **client.teerthankeraadinathbrightdentalcare.in**
   - Document Root: `/public_html/client`
   - Enable SSL ✅

2. **admin.teerthankeraadinathbrightdentalcare.in**
   - Document Root: `/public_html/admin`
   - Enable SSL ✅

---

### Step 5: Deploy! (2 min)

```bash
git add .
git commit -m "Setup CI/CD deployment"
git push origin main
```

Then:
1. Go to **GitHub Actions** tab
2. Watch deployment progress
3. Wait for ✅ green checkmark

---

## ✅ Test Your Deployment

Visit these URLs:

- Client: https://client.teerthankeraadinathbrightdentalcare.in/
- Admin: https://admin.teerthankeraadinathbrightdentalcare.in/

Both should load correctly! 🎉

---

## 🔄 How to Deploy Updates

```bash
# Make your changes
# Then:
git add .
git commit -m "Your update message"
git push origin main
# ✅ Automatic deployment happens!
```

---

## 📖 Full Documentation

- **Start Here**: `FINAL_SETUP_INSTRUCTIONS.md` ⭐ Complete guide
- **Vercel CORS**: `VERCEL_API_CORS_SETUP.md` ⭐ Critical for API
- **Your Config**: `HOSTINGER_SETUP_YOUR_CONFIG.md`
- **Complete Guide**: `HOSTINGER_CICD_SETUP.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🐛 Troubleshooting

### Deployment Failed?
1. Check **GitHub Actions** logs
2. Verify all 9 GitHub Secrets are correct
3. Test FTP connection with FileZilla

### Site Not Loading?
1. Check subdomain DNS (may take up to 24 hours)
2. Verify folders exist on Hostinger
3. Check subdomain document root paths

### API Not Working?
1. **CRITICAL**: Configure CORS on Vercel API (see `VERCEL_API_CORS_SETUP.md`)
2. Verify API URL is correct (`https://api.teerthankerdentalcare.com`)
3. Check browser console for CORS errors
4. Test API directly: Visit https://api.teerthankerdentalcare.com/api/plans

---

## 📞 Need Help?

- **Detailed Setup**: See `HOSTINGER_SETUP_YOUR_CONFIG.md`
- **Hostinger Support**: hPanel → Support
- **GitHub Actions**: [Your repo]/actions

---

**You're all set! 🚀**

Every push to GitHub will now automatically deploy your apps!

