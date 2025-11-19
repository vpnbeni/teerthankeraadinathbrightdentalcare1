# 🚀 Stage Deployment Setup Guide

Complete guide for setting up staging deployments to Hostinger with GitHub Actions.

## 📋 Overview

**Stage Branch:** `stage`  
**Client URL:** https://stage.teerthankeraadinathbrightdentalcare.in/  
**Admin URL:** https://admin-stage.teerthankeraadinathbrightdentalcare.in/  
**Stage API:** https://stage-tabdc-server.vercel.app/api  

## 🔐 GitHub Secrets Required

Go to **GitHub → Settings → Secrets and variables → Actions** and add these **NEW** secrets:

### New Stage-Specific Secrets

```
FTP_STAGE_CLIENT_PATH=/public_html/stage/
FTP_STAGE_ADMIN_PATH=/public_html/admin-stage/
STAGE_VITE_API_URL=https://stage-tabdc-server.vercel.app/api
```

### Existing Secrets (Reused)

These are already configured for production and will be reused:
- `FTP_SERVER` - Your Hostinger FTP server
- `FTP_USERNAME` - Your FTP username
- `FTP_PASSWORD` - Your FTP password
- `FTP_PORT` - FTP port (default: 21)
- `FTP_PROTOCOL` - Protocol (ftp or sftp)

## 📁 Hostinger Folder Structure

Your Hostinger hosting should have this structure:

```
/public_html/
├── (WordPress root files)
├── client/              # Production client
├── admin/               # Production admin
├── stage/               # STAGE client ← NEW
└── admin-stage/         # STAGE admin ← NEW
```

### Create These Folders in Hostinger

1. Log in to **Hostinger File Manager**
2. Navigate to `/public_html/`
3. Create folder: `stage`
4. Create folder: `admin-stage`
5. Set permissions to **755** for both

## 🌐 Subdomain Configuration

### In Hostinger cPanel

#### 1. Client Stage Subdomain
- **Subdomain:** `stage`
- **Domain:** `teerthankeraadinathbrightdentalcare.in`
- **Document Root:** `/public_html/stage`

#### 2. Admin Stage Subdomain
- **Subdomain:** `admin-stage`
- **Domain:** `teerthankeraadinathbrightdentalcare.in`
- **Document Root:** `/public_html/admin-stage`

### Verify DNS Propagation

After creating subdomains, verify they're working:

```bash
# Check DNS
nslookup stage.teerthankeraadinathbrightdentalcare.in
nslookup admin-stage.teerthankeraadinathbrightdentalcare.in
```

## 🔄 Workflow Files Created

Three new workflows for stage deployments:

### 1. `deploy-client-stage.yml`
- Triggers on push to `stage` branch (client changes)
- Builds client with stage API URL
- Deploys to `/public_html/stage/`

### 2. `deploy-admin-stage.yml`
- Triggers on push to `stage` branch (admin changes)
- Builds admin with stage API URL
- Deploys to `/public_html/admin-stage/`

### 3. `deploy-all-stage.yml`
- Triggers on push to `stage` branch (any changes)
- Deploys both client and admin sequentially
- Full staging environment update

## 🛠️ How to Deploy to Stage

### Option 1: Push to Stage Branch (Recommended)

```bash
# Switch to stage branch
git checkout stage

# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: new feature for testing"
git push origin stage
```

### Option 2: Manual Trigger

1. Go to **GitHub → Actions**
2. Select a stage workflow
3. Click **"Run workflow"**
4. Select branch: `stage`
5. Click **"Run workflow"**

### Option 3: Merge from Feature Branch

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: implement new feature"

# Merge to stage for testing
git checkout stage
git merge feature/new-feature
git push origin stage
```

## 🔍 Vercel Stage API Configuration

### CORS Settings (CRITICAL!)

Your Vercel stage API must allow these origins:

```javascript
// In your Vercel API (vercel.json or server config)
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://stage.teerthankeraadinathbrightdentalcare.in" },
        { "key": "Access-Control-Allow-Origin", "value": "https://admin-stage.teerthankeraadinathbrightdentalcare.in" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### Or Set Environment Variable on Vercel

In Vercel Dashboard → Your Stage Project → Settings → Environment Variables:

```
ALLOWED_ORIGINS=https://stage.teerthankeraadinathbrightdentalcare.in,https://admin-stage.teerthankeraadinathbrightdentalcare.in
```

## 📊 Deployment Flow Comparison

| Environment | Branch | Client Domain | Admin Domain | API URL |
|-------------|--------|---------------|--------------|---------|
| **Production** | `main` | client.teerthankeraadinathbrightdentalcare.in | admin.teerthankeraadinathbrightdentalcare.in | api.teerthankerdentalcare.com |
| **Staging** | `stage` | stage.teerthankeraadinathbrightdentalcare.in | admin-stage.teerthankeraadinathbrightdentalcare.in | stage-tabdc-server.vercel.app |

## ✅ Verification Checklist

After setup, verify:

- [ ] GitHub secrets added (3 new stage secrets)
- [ ] Hostinger folders created (`stage/`, `admin-stage/`)
- [ ] Subdomains configured in Hostinger
- [ ] DNS propagation complete
- [ ] Stage branch exists on GitHub
- [ ] Vercel stage API CORS configured
- [ ] First deployment successful
- [ ] Can access https://stage.teerthankeraadinathbrightdentalcare.in/
- [ ] Can access https://admin-stage.teerthankeraadinathbrightdentalcare.in/
- [ ] Stage API responding at https://stage-tabdc-server.vercel.app/

## 🚨 Troubleshooting

### Stage Deployment Fails
- Check GitHub secrets are correct
- Verify FTP paths exist on Hostinger
- Check workflow logs in GitHub Actions

### Stage Site Shows 404
- Verify `.htaccess` is in the deployed folder
- Check subdomain document root in Hostinger
- Ensure `base: '/'` in `vite.config.js`

### API CORS Errors
- Add stage domains to Vercel CORS settings
- Check Vercel environment variables
- Test API directly: https://stage-tabdc-server.vercel.app/

### DNS Not Resolving
- Wait 24-48 hours for DNS propagation
- Clear browser cache
- Try different browser or incognito mode

## 🔄 Promoting Stage to Production

When stage testing is complete:

```bash
# Checkout production branch
git checkout main

# Merge stage (assuming stage is tested and working)
git merge stage

# Push to production
git push origin main
```

This will trigger production deployments automatically!

## 📝 Best Practices

1. **Always test on stage first** before pushing to production
2. **Keep stage and main branches in sync** - regularly merge main to stage
3. **Use feature branches** for development, merge to stage for testing
4. **Monitor both environments** - check logs in GitHub Actions
5. **Separate databases** - Use different MongoDB/database for stage vs production

## 🎯 Workflow Summary

```
Development Flow:
feature branch → stage branch (auto-deploy to stage) → test → main branch (auto-deploy to production)
```

## 🔗 Useful Links

- **Production Client:** https://client.teerthankeraadinathbrightdentalcare.in/
- **Production Admin:** https://admin.teerthankeraadinathbrightdentalcare.in/
- **Stage Client:** https://stage.teerthankeraadinathbrightdentalcare.in/
- **Stage Admin:** https://admin-stage.teerthankeraadinathbrightdentalcare.in/
- **Production API:** https://api.teerthankerdentalcare.com/api
- **Stage API:** https://stage-tabdc-server.vercel.app/api
- **GitHub Actions:** https://github.com/YOUR_USERNAME/YOUR_REPO/actions

---

**Setup Complete!** 🎉 You now have a fully automated staging environment.

