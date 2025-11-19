# 🚀 Hostinger CI/CD Setup - Your Configuration

## Your Domain Structure

- **Main Site (WordPress)**: https://teerthankeraadinathbrightdentalcare.in/
- **Client App (React)**: https://client.teerthankeraadinathbrightdentalcare.in/
- **Admin App (React)**: https://admin.teerthankeraadinathbrightdentalcare.in/

## Your FTP Details

- **FTP Server**: 145.79.210.142
- **Username**: u730516688.teerthankeraadinathbrightdentalcare.in
- **Port**: 21
- **Password**: [Use from Hostinger, keep it secure!]

---

## ✅ Complete Setup Checklist

### Step 1: GitHub Secrets (CRITICAL - Do This First!)

Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Click **New repository secret** and add each of these **9 secrets**:

#### Secret 1:
- **Name**: `FTP_SERVER`
- **Value**: `145.79.210.142`

#### Secret 2:
- **Name**: `FTP_USERNAME`
- **Value**: `u730516688.teerthankeraadinathbrightdentalcare.in`

#### Secret 3:
- **Name**: `FTP_PASSWORD`
- **Value**: `9AQoMuRhxiXH3c:X`
- ⚠️ **IMPORTANT**: Change this password in Hostinger after setup for security!

#### Secret 4:
- **Name**: `FTP_PORT`
- **Value**: `21`

#### Secret 5:
- **Name**: `FTP_PROTOCOL`
- **Value**: `ftp`

#### Secret 6:
- **Name**: `FTP_CLIENT_PATH`
- **Value**: `/public_html/client/`

#### Secret 7:
- **Name**: `FTP_ADMIN_PATH`
- **Value**: `/public_html/admin/`

#### Secret 8:
- **Name**: `CLIENT_VITE_API_URL`
- **Value**: `https://teerthankeraadinathbrightdentalcare.in/api`

#### Secret 9:
- **Name**: `ADMIN_VITE_API_URL`
- **Value**: `https://teerthankeraadinathbrightdentalcare.in/api`

---

### Step 2: Create Folders on Hostinger

Using Hostinger File Manager:

1. Log in to Hostinger hPanel
2. Go to **Files** → **File Manager**
3. Navigate to `public_html/`
4. Create these folders (if they don't exist):
   - **`client`**
   - **`admin`**

**Your structure:**
```
public_html/
├── (your WordPress files)
├── wp-content/
├── wp-admin/
├── client/           ← Client app deploys here
└── admin/            ← Admin app deploys here
```

---

### Step 3: Configure Subdomains on Hostinger

#### For Client Subdomain:

1. Go to **Domains** → **Subdomains** in hPanel
2. Find or create: **client.teerthankeraadinathbrightdentalcare.in**
3. Set Document Root to: `/public_html/client`
4. Enable SSL (if not already enabled)

#### For Admin Subdomain:

1. Go to **Domains** → **Subdomains** in hPanel
2. Find or create: **admin.teerthankeraadinathbrightdentalcare.in**
3. Set Document Root to: `/public_html/admin`
4. Enable SSL (if not already enabled)

---

### Step 4: Create Environment Files

#### Client Environment File

Create `client/.env.production` with:

```env
VITE_API_URL=https://teerthankeraadinathbrightdentalcare.in/api
VITE_APP_NAME=Teerthanker Aadinath Bright Dental Care
```

#### Admin Environment File

Create `admin/.env.production` with:

```env
VITE_API_URL=https://teerthankeraadinathbrightdentalcare.in/api
VITE_APP_NAME=Dental Care Admin
```

---

### Step 5: Commit and Push

```bash
# Add all changes
git add .

# Commit
git commit -m "Configure CI/CD for Hostinger deployment"

# Push (this will trigger automatic deployment!)
git push origin main
```

---

### Step 6: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflows:
   - "Deploy Client to Hostinger"
   - "Deploy Admin to Hostinger"
4. Wait for ✅ green checkmarks

---

### Step 7: Test Your Deployments

Once deployment completes:

1. **Test Client**: https://client.teerthankeraadinathbrightdentalcare.in/
   - Home page should load
   - Navigation should work
   - No 404 errors

2. **Test Admin**: https://admin.teerthankeraadinathbrightdentalcare.in/
   - Login page should load
   - Routes should work
   - Can log in successfully

3. **Test API**: 
   - Verify API calls work from both apps
   - Check browser console for errors

---

## 🎯 How It Works Now

### Automatic Deployment

**When you push changes:**

```bash
git add .
git commit -m "Update something"
git push origin main
```

**GitHub Actions will:**
1. Detect which files changed (client/admin)
2. Build the app(s) in production mode
3. Upload to correct Hostinger folder via FTP
4. Your subdomain(s) update automatically!

### Smart Deployment

- Changes in `client/**` → Only client deploys to `/public_html/client/`
- Changes in `admin/**` → Only admin deploys to `/public_html/admin/`
- Changes in `shared/**` → Both deploy

---

## 🌐 Your Live URLs

After successful deployment:

- **Main WordPress**: https://teerthankeraadinathbrightdentalcare.in/
- **Client App**: https://client.teerthankeraadinathbrightdentalcare.in/
- **Admin App**: https://admin.teerthankeraadinathbrightdentalcare.in/

---

## 🔧 Configuration Summary

### Client App Configuration

**Base URL**: `/` (root of subdomain)

**API Endpoint**: `https://teerthankeraadinathbrightdentalcare.in/api`

**Deployment Path**: `/public_html/client/`

**Subdomain**: client.teerthankeraadinathbrightdentalcare.in

### Admin App Configuration

**Base URL**: `/` (root of subdomain)

**API Endpoint**: `https://teerthankeraadinathbrightdentalcare.in/api`

**Deployment Path**: `/public_html/admin/`

**Subdomain**: admin.teerthankeraadinathbrightdentalcare.in

---

## 🐛 Troubleshooting

### If Client Subdomain Shows 404:

1. Check subdomain points to `/public_html/client/`
2. Verify files uploaded correctly via File Manager
3. Check `.htaccess` is present in `/public_html/client/`
4. Clear browser cache

### If Admin Subdomain Shows 404:

1. Check subdomain points to `/public_html/admin/`
2. Verify files uploaded correctly via File Manager
3. Check `.htaccess` is present in `/public_html/admin/`
4. Clear browser cache

### If Deployment Fails:

1. **Check GitHub Actions logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Read error messages

2. **Common Issues**:
   - ❌ Wrong FTP credentials → Verify GitHub Secrets
   - ❌ Build error → Test `npm run build` locally
   - ❌ Connection timeout → Check Hostinger FTP is enabled

3. **Verify FTP Connection**:
   ```bash
   # Use FileZilla or another FTP client to test
   # Host: 145.79.210.142
   # Username: u730516688.teerthankeraadinathbrightdentalcare.in
   # Password: Your password
   # Port: 21
   ```

### If API Calls Don't Work:

1. **Check CORS on WordPress**:
   - Your WordPress API needs to allow requests from:
     - client.teerthankeraadinathbrightdentalcare.in
     - admin.teerthankeraadinathbrightdentalcare.in

2. **Add to WordPress `.htaccess` or functions.php**:
   ```php
   header("Access-Control-Allow-Origin: *");
   header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
   header("Access-Control-Allow-Headers: Content-Type, Authorization");
   ```

---

## 🔐 Security Recommendations

### Immediate Actions:

1. ✅ **Change FTP password** after first successful deployment
2. ✅ **Enable 2FA** on Hostinger account
3. ✅ **Don't share** FTP credentials publicly
4. ✅ **Use HTTPS** for all sites (enable SSL in Hostinger)

### Best Practices:

- Keep GitHub Secrets secure
- Regularly update dependencies
- Monitor GitHub Actions logs
- Enable Hostinger auto-backups
- Use strong passwords

---

## 📊 Monitoring

### GitHub Actions:

- View all deployments in **Actions** tab
- Get email notifications (Settings → Notifications)
- Download logs for debugging

### Hostinger:

- Check access logs in hPanel
- Monitor disk space usage
- Review error logs
- Enable uptime monitoring

---

## 🚀 Manual Deployment (Backup Method)

If automatic deployment fails, deploy manually:

### Build Locally:

```bash
# Build client
cd client
npm run build

# Build admin
cd ../admin
npm run build
```

### Upload via FTP:

Using FileZilla or Hostinger File Manager:

1. **Client**: Upload `client/dist/*` to `/public_html/client/`
2. **Admin**: Upload `admin/dist/*` to `/public_html/admin/`

---

## 📝 Quick Reference

### Commands:

```bash
# Deploy changes
git add .
git commit -m "Your message"
git push origin main

# Test build locally
cd client && npm run build
cd admin && npm run build

# View deployment status
# Go to: GitHub → Actions tab
```

### URLs:

- Main: https://teerthankeraadinathbrightdentalcare.in/
- Client: https://client.teerthankeraadinathbrightdentalcare.in/
- Admin: https://admin.teerthankeraadinathbrightdentalcare.in/
- GitHub Actions: [Your GitHub repo]/actions

### Hostinger:

- hPanel: https://hpanel.hostinger.com
- File Manager: hPanel → Files → File Manager
- Subdomains: hPanel → Domains → Subdomains
- FTP Accounts: hPanel → Files → FTP Accounts

---

## ✅ Verification Checklist

After completing all steps:

- [ ] GitHub Secrets added (all 9)
- [ ] Folders created on Hostinger (client/ and admin/)
- [ ] Subdomains configured correctly
- [ ] Environment files created
- [ ] Code pushed to GitHub
- [ ] GitHub Actions completed successfully
- [ ] Client subdomain loads correctly
- [ ] Admin subdomain loads correctly
- [ ] API calls work from both apps
- [ ] No console errors
- [ ] Routes work (no 404)
- [ ] SSL enabled on subdomains

---

## 🎉 Success!

Once everything is working:

✅ Push to GitHub → ✅ Auto-deploy → ✅ Sites update!

**From now on, every push to `main` branch automatically deploys your apps!**

---

## 📞 Support

If you need help:

1. Check GitHub Actions logs
2. Review Hostinger File Manager
3. Test FTP connection with FileZilla
4. Verify subdomain DNS (may take up to 24 hours to propagate)
5. Contact Hostinger support if server issues

---

## 🔄 Regular Maintenance

### Weekly:
- Check deployment logs
- Monitor site performance
- Review error logs

### Monthly:
- Update dependencies (`npm update`)
- Test backup restoration
- Review security settings

### As Needed:
- Update FTP password
- Add/remove team members
- Scale resources if needed

---

**Happy Deploying! 🚀**

*Last Updated: November 2024*
*Your Configuration: Subdomain Setup*

