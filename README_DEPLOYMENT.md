# 🚀 Automated Deployment to Hostinger - Complete Setup

## Overview

This repository is configured with **GitHub Actions CI/CD pipeline** to automatically deploy your **Client** and **Admin** applications to **Hostinger shared hosting** whenever you push changes to GitHub.

---

## 🎯 What This Does

- ✅ **Automatic deployment** on every push to `main` branch
- ✅ **Separate workflows** for Client and Admin apps
- ✅ **Build optimization** (production builds only)
- ✅ **Smart deployment** (only deploys changed apps)
- ✅ **Zero downtime** deployments
- ✅ **Manual trigger** option available

---

## 📂 Project Structure

```
teerthankeraadinathbrightdentalcare/
├── .github/
│   └── workflows/
│       ├── deploy-client.yml     # Auto-deploy client app
│       ├── deploy-admin.yml      # Auto-deploy admin app
│       └── deploy-all.yml        # Deploy both apps
│
├── client/                        # Main website
│   ├── .htaccess                 # Apache config for React Router
│   ├── .env.production           # Production environment
│   └── vite.config.js            # Build config (base: /)
│
├── admin/                         # Admin dashboard
│   ├── .htaccess                 # Apache config for /admin/
│   ├── .env.production           # Production environment
│   └── vite.config.js            # Build config (base: /admin/)
│
├── QUICK_SETUP_CICD.md           # 10-minute setup guide
├── HOSTINGER_CICD_SETUP.md       # Complete documentation
├── DEPLOYMENT_CHECKLIST.md       # Step-by-step checklist
└── README_DEPLOYMENT.md          # This file
```

---

## 🚀 Quick Start

### 1️⃣ Get Hostinger Credentials (2 min)

Log in to Hostinger hPanel and get:
- FTP Server (e.g., `ftp.yourdomain.com`)
- FTP Username
- FTP Password
- FTP Port (usually `21`)

### 2️⃣ Add GitHub Secrets (3 min)

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these secrets:
```
FTP_SERVER          = ftp.yourdomain.com
FTP_USERNAME        = your_ftp_username
FTP_PASSWORD        = your_ftp_password
FTP_PORT            = 21
FTP_PROTOCOL        = ftp
FTP_CLIENT_PATH     = /public_html/
FTP_ADMIN_PATH      = /public_html/admin/
CLIENT_VITE_API_URL = https://yourdomain.com/api
ADMIN_VITE_API_URL  = https://yourdomain.com/api
```

### 3️⃣ Create Admin Folder on Hostinger (1 min)

Using Hostinger File Manager:
- Navigate to `public_html/`
- Create folder: `admin`

### 4️⃣ Push to GitHub (1 min)

```bash
git add .
git commit -m "Setup CI/CD deployment"
git push origin main
```

### 5️⃣ Watch Magic Happen! ✨

- Go to **Actions** tab on GitHub
- Watch your app deploy automatically
- Visit your live site!

**Total Time: ~7 minutes** ⏱️

---

## 📖 Documentation

| Document | Description | Time |
|----------|-------------|------|
| **[QUICK_SETUP_CICD.md](./QUICK_SETUP_CICD.md)** | Fast setup guide | 10 min |
| **[HOSTINGER_CICD_SETUP.md](./HOSTINGER_CICD_SETUP.md)** | Complete documentation | 30 min |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Step-by-step checklist | - |

---

## 🔄 How It Works

### Automatic Deployment

**When you push to main branch:**

1. **GitHub Actions** detects changes
2. **Builds** the application (production mode)
3. **Deploys** via FTP to Hostinger
4. **Your site updates** automatically!

### Smart Deployment

- Changes in `client/**` → Only client deploys
- Changes in `admin/**` → Only admin deploys
- Changes in `shared/**` → Both deploy
- Changes in workflows → Respective app deploys

---

## 🌐 Live URLs

After deployment:

- **Client (Main Site)**: `https://yourdomain.com`
- **Admin Dashboard**: `https://yourdomain.com/admin`

---

## 💡 Common Usage

### Deploy Client Changes
```bash
# Make changes in client folder
cd client
# ... make your changes ...

git add .
git commit -m "Update client UI"
git push origin main
# ✅ Client auto-deploys to yourdomain.com
```

### Deploy Admin Changes
```bash
# Make changes in admin folder
cd admin
# ... make your changes ...

git add .
git commit -m "Update admin dashboard"
git push origin main
# ✅ Admin auto-deploys to yourdomain.com/admin
```

### Deploy Both
```bash
# Make changes anywhere
git add .
git commit -m "Update multiple files"
git push origin main
# ✅ Both auto-deploy!
```

### Manual Deployment

1. Go to **Actions** tab on GitHub
2. Select workflow (e.g., "Deploy Client to Hostinger")
3. Click **Run workflow**
4. Select `main` branch
5. Click green **Run workflow** button

---

## 🔧 Configuration

### Environment Variables

**Client** (`client/.env.production`):
```env
VITE_API_URL=https://yourdomain.com/api
```

**Admin** (`admin/.env.production`):
```env
VITE_API_URL=https://yourdomain.com/api
```

### Base Paths

**Client** (`client/vite.config.js`):
```javascript
base: '/'  // Root domain
```

**Admin** (`admin/vite.config.js`):
```javascript
base: mode === 'production' ? '/admin/' : '/'  // Subdirectory
```

### Apache Configuration

Both apps include `.htaccess` files for:
- React Router support (SPA)
- Gzip compression
- Browser caching
- Security headers

---

## 🧪 Testing

### Before Pushing

Always test locally:

```bash
# Test client
cd client
npm run build
npm run preview

# Test admin
cd admin
npm run build
npm run preview
```

### After Deployment

Check both sites:
- ✅ Pages load correctly
- ✅ Routes work (no 404)
- ✅ Assets load
- ✅ API calls work
- ✅ No console errors

---

## 🐛 Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs**
   - Go to Actions tab
   - Click failed workflow
   - Read error messages

2. **Common Issues**:
   - ❌ Wrong FTP credentials → Update GitHub Secrets
   - ❌ Build error → Check `npm run build` locally
   - ❌ Connection timeout → Verify Hostinger FTP is enabled

### Site Not Loading

1. **Check .htaccess uploaded**
   - Verify in Hostinger File Manager
   - Ensure mod_rewrite is enabled

2. **Check base paths**
   - Client: `base: '/'`
   - Admin: `base: '/admin/'`

3. **Clear cache**
   - Browser cache
   - CDN cache (if using)

### API Not Working

1. **Verify environment variables**
   - Check GitHub Secrets
   - Rebuild and redeploy

2. **Check CORS settings**
   - On your backend
   - Allow your domain

---

## 📊 Workflow Status

You can see deployment status:

**Badge URLs** (add to README):
```markdown
![Deploy Client](https://github.com/USERNAME/REPO/actions/workflows/deploy-client.yml/badge.svg)
![Deploy Admin](https://github.com/USERNAME/REPO/actions/workflows/deploy-admin.yml/badge.svg)
```

---

## 🔐 Security

### Best Practices

✅ **Never commit**:
- FTP passwords
- API keys
- Environment variables
- Sensitive data

✅ **Always use**:
- GitHub Secrets for credentials
- HTTPS/SSL on your domain
- Strong FTP passwords
- 2FA on GitHub and Hostinger

✅ **Regularly**:
- Update dependencies
- Review access logs
- Rotate passwords
- Backup data

---

## 📈 Monitoring

### GitHub Actions

- View deployment history in Actions tab
- Get email notifications (Settings → Notifications)
- Download workflow logs

### Hostinger

- Check access logs in hPanel
- Monitor disk space
- Review error logs

### Analytics (Optional)

- Google Analytics
- Uptime monitoring
- Performance monitoring

---

## 🔄 Rollback

If something goes wrong:

### Option 1: Revert Git Commit
```bash
git revert HEAD
git push origin main
# This will auto-deploy previous version
```

### Option 2: Manual Restore
1. Go to Hostinger hPanel
2. Use **Backups** feature
3. Restore to previous date

### Option 3: Manual Deployment
1. Checkout previous commit
2. Build locally
3. Upload via FTP manually

---

## 🛠️ Maintenance

### Regular Tasks

**Weekly**:
- Check deployment logs
- Review error reports
- Test site functionality

**Monthly**:
- Update dependencies
- Review GitHub Actions usage
- Check Hostinger disk space
- Backup database

**Quarterly**:
- Security audit
- Performance review
- Update documentation

---

## 📚 Additional Resources

### Documentation
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Hostinger Tutorials](https://www.hostinger.com/tutorials)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy)

### Support
- **Hostinger**: hPanel live chat
- **GitHub**: support.github.com
- **Project**: Open GitHub issue

---

## 🤝 Contributing

When contributing:

1. Create feature branch
2. Test locally
3. Create pull request
4. Review and merge
5. Deployment happens automatically!

---

## 📝 Notes

### Important Points

- Deployments trigger on push to `main` branch only
- Both apps share `shared/` components
- Builds are production-optimized
- Source maps disabled in production
- Assets are compressed and cached

### Current Setup

- **Node Version**: 18
- **Build Tool**: Vite
- **Framework**: React
- **Deployment**: FTP via GitHub Actions
- **Hosting**: Hostinger Shared Hosting

---

## ✅ Checklist for New Team Members

- [ ] Read QUICK_SETUP_CICD.md
- [ ] Get Hostinger access (if needed)
- [ ] Understand workflow files
- [ ] Test local builds
- [ ] Make test commit
- [ ] Watch deployment
- [ ] Verify live site

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ Push to GitHub → ✅ Actions run → ✅ Build succeeds → ✅ Deploy completes → ✅ Site updates → ✅ All automatic!

---

## 💬 FAQ

**Q: How long does deployment take?**
A: Usually 3-5 minutes for build + deploy.

**Q: Can I deploy to staging first?**
A: Yes! Create a `staging` branch with separate workflow.

**Q: What if I want to deploy manually?**
A: Use workflow_dispatch in Actions tab.

**Q: Can I see deployment history?**
A: Yes, in GitHub Actions tab - all runs are logged.

**Q: What happens if deployment fails?**
A: Previous version stays live, no downtime.

**Q: Can I deploy specific version?**
A: Yes, checkout that commit and push or use manual trigger.

---

## 🏆 Benefits

**For Developers**:
- ✅ No manual FTP uploads
- ✅ Consistent deployments
- ✅ Full deployment history
- ✅ Easy rollbacks

**For Team**:
- ✅ Collaborative workflow
- ✅ Reduced errors
- ✅ Faster iterations
- ✅ Better reliability

**For Project**:
- ✅ Professional setup
- ✅ Scalable approach
- ✅ Modern practices
- ✅ Production-ready

---

## 📞 Support

Need help? Check:

1. **[QUICK_SETUP_CICD.md](./QUICK_SETUP_CICD.md)** - Quick start guide
2. **[HOSTINGER_CICD_SETUP.md](./HOSTINGER_CICD_SETUP.md)** - Full documentation  
3. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Troubleshooting
4. **GitHub Actions logs** - Deployment details
5. **Hostinger support** - Hosting issues

---

**Happy Deploying! 🚀**

*Last Updated: [Date]*
*Version: 1.0*

