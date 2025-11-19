# Quick Setup Guide - Hostinger CI/CD

## 🚀 Quick Start (10 Minutes)

Follow these steps to set up automatic deployment from GitHub to Hostinger.

---

## Step 1: Get Hostinger FTP Credentials (2 min)

1. **Log in to Hostinger** (https://hostinger.com)
2. Go to **hPanel** → **Hosting**
3. Select your hosting plan
4. Navigate to **Files** → **FTP Accounts**
5. **Create or view** FTP account
6. **Note down**:
   - **Server/Host**: `ftp.yourdomain.com` (or IP address)
   - **Username**: `u123456789` (your FTP username)
   - **Password**: Your FTP password
   - **Port**: `21` (FTP) or `22` (SFTP recommended)

---

## Step 2: Add GitHub Secrets (3 min)

1. Go to your **GitHub repository**
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets **one by one**:

```
Name: FTP_SERVER
Value: ftp.yourdomain.com

Name: FTP_USERNAME
Value: your_ftp_username

Name: FTP_PASSWORD
Value: your_ftp_password

Name: FTP_PORT
Value: 21

Name: FTP_PROTOCOL
Value: ftp

Name: FTP_CLIENT_PATH
Value: /public_html/

Name: FTP_ADMIN_PATH
Value: /public_html/admin/

Name: CLIENT_VITE_API_URL
Value: https://yourdomain.com/api

Name: ADMIN_VITE_API_URL
Value: https://yourdomain.com/api
```

**Important**: Replace `yourdomain.com` with your actual domain!

---

## Step 3: Setup Hostinger Directory (2 min)

### Option A: Using Hostinger File Manager

1. Go to **hPanel** → **Files** → **File Manager**
2. Navigate to `public_html`
3. Create folder: **`admin`**

### Option B: Using FTP Client (FileZilla)

1. Connect to your Hostinger FTP
2. Navigate to `public_html`
3. Create folder: **`admin`**

**Your structure should look like:**

```
public_html/
├── admin/          # Admin app will be here
└── (client files will be in root)
```

---

## Step 4: Commit and Push Workflow Files (2 min)

The workflow files are already created in `.github/workflows/`. Now commit them:

```bash
git add .github/workflows/
git add admin/vite.config.js
git add admin/.htaccess
git add client/.htaccess
git commit -m "Add CI/CD workflows for Hostinger deployment"
git push origin main
```

---

## Step 5: Watch Deployment (1 min)

1. Go to your **GitHub repository**
2. Click the **Actions** tab
3. You should see workflows running:
   - ✅ Deploy Client to Hostinger
   - ✅ Deploy Admin to Hostinger
4. Click on a workflow to see progress
5. Wait for ✅ **green checkmark** (means success!)

---

## Step 6: Test Your Deployment

Once deployment is complete:

1. **Test Client**: Open `https://yourdomain.com`
2. **Test Admin**: Open `https://yourdomain.com/admin`

Both should load successfully! 🎉

---

## 🎯 How It Works

**From now on, whenever you push to GitHub:**

### For Client Changes:

```bash
# Make changes in client folder
git add client/
git commit -m "Update client"
git push origin main
# ✅ Automatically deploys to yourdomain.com
```

### For Admin Changes:

```bash
# Make changes in admin folder
git add admin/
git commit -m "Update admin"
git push origin main
# ✅ Automatically deploys to yourdomain.com/admin
```

### For Both:

```bash
# Make changes anywhere
git add .
git commit -m "Update all"
git push origin main
# ✅ Deploys both automatically!
```

---

## 📋 Verification Checklist

After first deployment, verify:

- [ ] Client loads at `https://yourdomain.com`
- [ ] Admin loads at `https://yourdomain.com/admin`
- [ ] Client routes work (e.g., `/login`, `/dashboard`)
- [ ] Admin routes work (e.g., `/admin/appointments`)
- [ ] API calls work correctly
- [ ] Images and assets load
- [ ] No console errors in browser

---

## 🐛 Troubleshooting

### ❌ Deployment Failed

**Check GitHub Actions logs:**

1. Go to **Actions** tab
2. Click on failed workflow
3. Read error message
4. Common issues:
   - ❌ Wrong FTP credentials → Update GitHub Secrets
   - ❌ Connection timeout → Check Hostinger FTP is enabled
   - ❌ Build error → Check Node.js version, dependencies

### ❌ 404 Error on Routes

**Fix `.htaccess`:**

1. Make sure `.htaccess` files are uploaded
2. Check if `mod_rewrite` is enabled on Hostinger
3. Verify paths in `.htaccess` match your setup

### ❌ Assets Not Loading

**Check base path:**

1. Verify `admin/vite.config.js` has `base: '/admin/'` for production
2. Rebuild and redeploy
3. Clear browser cache

### ❌ API Not Working

**Check environment variables:**

1. Verify `CLIENT_VITE_API_URL` and `ADMIN_VITE_API_URL` in GitHub Secrets
2. Make sure API URL is correct and accessible
3. Check CORS settings on your backend

---

## 🔧 Manual Deployment (Backup Method)

If automated deployment fails, you can deploy manually:

```bash
# Build client
cd client
npm run build

# Build admin
cd ../admin
npm run build
```

Then upload:

- `client/dist/*` → Upload to `/public_html/`
- `admin/dist/*` → Upload to `/public_html/admin/`

Using:

- Hostinger File Manager, OR
- FTP client (FileZilla, WinSCP, etc.)

---

## 💡 Pro Tips

### 1. **Test Before Deploying**

Always test locally before pushing:

```bash
npm run build
npm run preview
```

### 2. **Deploy to Staging First**

Create a `staging` branch that deploys to a subdomain:

- Staging: `staging.yourdomain.com`
- Production: `yourdomain.com`

### 3. **Enable Manual Trigger**

All workflows have `workflow_dispatch` enabled.

**To manually trigger:**

1. Go to **Actions** tab
2. Select workflow (e.g., "Deploy Client to Hostinger")
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow** button

### 4. **Monitor Deployment**

- Check GitHub Actions regularly
- Set up notifications (Settings → Notifications)
- Subscribe to workflow runs

### 5. **Backup Before Deploying**

Hostinger provides automatic backups, but you can also:

- Download current site via FTP
- Keep local copies
- Use Hostinger backup feature

---

## 📚 Additional Resources

- **Full Documentation**: See `HOSTINGER_CICD_SETUP.md`
- **GitHub Actions**: https://docs.github.com/actions
- **Hostinger Help**: https://www.hostinger.com/tutorials
- **FTP Deploy Action**: https://github.com/SamKirkland/FTP-Deploy-Action

---

## ✅ Success Indicators

You'll know it's working when:

✅ Push to GitHub
✅ GitHub Actions run automatically  
✅ Build completes successfully
✅ Files upload to Hostinger
✅ Website updates immediately
✅ No manual intervention needed

---

## 🎉 That's It!

You now have:

- ✅ Automatic deployment on push
- ✅ Client app at root domain
- ✅ Admin app at /admin subdirectory
- ✅ Separate or combined deployments
- ✅ Build optimization
- ✅ Browser caching
- ✅ Security headers

**Push once, deploy everywhere!** 🚀

---

## 🆘 Need Help?

1. **Check logs** in GitHub Actions
2. **Review** `HOSTINGER_CICD_SETUP.md` for detailed info
3. **Test FTP connection** manually with FileZilla
4. **Contact** Hostinger support if server issues
5. **Open GitHub issue** if workflow problems

---

**Happy Deploying!** 🎊
