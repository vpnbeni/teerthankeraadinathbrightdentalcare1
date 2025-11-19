# 🚀 Hostinger CI/CD Deployment Checklist

Use this checklist to ensure everything is set up correctly for automatic deployment.

---

## 📋 Pre-Deployment Checklist

### Hostinger Account Setup
- [ ] Hostinger hosting plan is active
- [ ] Domain is connected to hosting
- [ ] SSL certificate is installed (recommended)
- [ ] FTP access is enabled
- [ ] File Manager access is available

### FTP Credentials Collected
- [ ] FTP Server/Host address noted
- [ ] FTP Username noted
- [ ] FTP Password available
- [ ] FTP Port confirmed (21 or 22)
- [ ] Connection tested with FTP client (optional)

### GitHub Repository Ready
- [ ] Repository exists on GitHub
- [ ] You have admin access to repository
- [ ] Latest code is pushed to `main` branch
- [ ] All dependencies are in package.json
- [ ] package-lock.json is committed

---

## 🔧 Configuration Checklist

### GitHub Secrets Added
Go to: Repository → Settings → Secrets and variables → Actions

- [ ] `FTP_SERVER` - Your FTP host (e.g., ftp.yourdomain.com)
- [ ] `FTP_USERNAME` - Your FTP username
- [ ] `FTP_PASSWORD` - Your FTP password
- [ ] `FTP_PORT` - Port number (21 or 22)
- [ ] `FTP_PROTOCOL` - Protocol (ftp or ftps)
- [ ] `FTP_CLIENT_PATH` - Client path (/public_html/)
- [ ] `FTP_ADMIN_PATH` - Admin path (/public_html/admin/)
- [ ] `CLIENT_VITE_API_URL` - Client API URL
- [ ] `ADMIN_VITE_API_URL` - Admin API URL

### Hostinger Directory Structure
Using File Manager or FTP:

- [ ] `public_html/` directory exists
- [ ] `public_html/admin/` directory created
- [ ] Correct file permissions (755 for directories, 644 for files)
- [ ] Old files backed up (if updating existing site)

### Workflow Files Created
In `.github/workflows/` directory:

- [ ] `deploy-client.yml` exists
- [ ] `deploy-admin.yml` exists
- [ ] `deploy-all.yml` exists (optional)
- [ ] Files are committed to repository

### Application Configuration
Client app:

- [ ] `client/.htaccess` file created
- [ ] `client/.env.production` configured
- [ ] `client/vite.config.js` base path is `/`
- [ ] Build script works: `npm run build`

Admin app:

- [ ] `admin/.htaccess` file created
- [ ] `admin/.env.production` configured
- [ ] `admin/vite.config.js` base path is `/admin/`
- [ ] Build script works: `npm run build`

---

## 🧪 Testing Checklist

### Local Build Test
Before pushing:

Client:
```bash
cd client
npm ci
npm run build
# Check dist folder created
```

- [ ] Client builds without errors
- [ ] `dist/` folder contains files
- [ ] `dist/index.html` exists
- [ ] Assets are in `dist/assets/`

Admin:
```bash
cd admin
npm ci
npm run build
# Check dist folder created
```

- [ ] Admin builds without errors
- [ ] `dist/` folder contains files
- [ ] `dist/index.html` exists
- [ ] Assets are in `dist/assets/`

### GitHub Actions Test
After first push:

- [ ] Go to Actions tab on GitHub
- [ ] Workflow triggered automatically
- [ ] Workflow shows green checkmark
- [ ] No error messages in logs
- [ ] Build step completed successfully
- [ ] Deploy step completed successfully

---

## 🌐 Deployment Verification

### Client Application
Visit: `https://yourdomain.com`

- [ ] Home page loads correctly
- [ ] No 404 errors
- [ ] Assets (images, CSS, JS) load
- [ ] Navigation works
- [ ] Routes work (e.g., /login, /dashboard)
- [ ] API calls work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] PWA features work (if enabled)

### Admin Application  
Visit: `https://yourdomain.com/admin`

- [ ] Admin login page loads
- [ ] No 404 errors
- [ ] Assets load correctly
- [ ] Can navigate to different pages
- [ ] Routes work properly
- [ ] API calls work
- [ ] Authentication works
- [ ] Dashboard displays data
- [ ] No console errors

### Browser Testing
Test in multiple browsers:

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

### Performance Check
Using browser DevTools:

- [ ] Page load time < 3 seconds
- [ ] Assets are cached
- [ ] Gzip compression active
- [ ] No broken links
- [ ] Lighthouse score > 80

---

## 🔐 Security Checklist

### HTTPS/SSL
- [ ] SSL certificate installed
- [ ] HTTP redirects to HTTPS
- [ ] Mixed content warnings resolved
- [ ] Secure cookies (if used)

### Headers
Check `.htaccess` includes:

- [ ] X-Frame-Options set
- [ ] X-XSS-Protection enabled
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy configured

### Access Control
- [ ] Admin area requires authentication
- [ ] API endpoints are secured
- [ ] Environment variables not exposed
- [ ] No sensitive data in logs
- [ ] GitHub secrets are secure

---

## 📊 Post-Deployment Checklist

### Monitoring
- [ ] Google Analytics installed (optional)
- [ ] Error tracking set up (optional)
- [ ] Uptime monitoring configured (optional)
- [ ] Performance monitoring active

### Documentation
- [ ] Deployment process documented
- [ ] Team members informed
- [ ] Credentials stored securely
- [ ] Backup procedures documented

### Maintenance
- [ ] Schedule for dependency updates
- [ ] Backup schedule confirmed
- [ ] Rollback procedure tested
- [ ] Support contacts listed

---

## 🐛 Troubleshooting Checklist

### If Deployment Fails

FTP Connection Issues:
- [ ] Verify FTP credentials in GitHub Secrets
- [ ] Test FTP connection with FileZilla
- [ ] Check Hostinger FTP service is running
- [ ] Verify firewall not blocking connection
- [ ] Try different FTP port (21 vs 22)

Build Issues:
- [ ] Check Node.js version compatibility
- [ ] Verify all dependencies installed
- [ ] Check for TypeScript errors
- [ ] Review build logs in GitHub Actions
- [ ] Test build locally first

Deploy Issues:
- [ ] Check file permissions on server
- [ ] Verify correct remote paths
- [ ] Ensure sufficient disk space
- [ ] Check `.htaccess` syntax
- [ ] Review deployment logs

### If Site Not Loading

404 Errors:
- [ ] `.htaccess` file uploaded
- [ ] Verify base path in vite.config.js
- [ ] Check RewriteBase in .htaccess
- [ ] Ensure mod_rewrite enabled
- [ ] Clear browser cache

Asset Loading Issues:
- [ ] Check asset paths in built files
- [ ] Verify base URL configuration
- [ ] Check file permissions (644)
- [ ] Inspect network tab in DevTools
- [ ] Clear CDN cache (if used)

API Issues:
- [ ] Verify API URL in environment
- [ ] Check CORS configuration
- [ ] Test API endpoint directly
- [ ] Review API error logs
- [ ] Check authentication tokens

---

## 🎯 Quick Reference

### Essential URLs
- Hostinger hPanel: `https://hpanel.hostinger.com`
- GitHub Actions: `https://github.com/USERNAME/REPO/actions`
- Your Client Site: `https://yourdomain.com`
- Your Admin Site: `https://yourdomain.com/admin`

### Essential Commands
```bash
# Test build locally
npm run build

# Manual deployment
git add .
git commit -m "Deploy changes"
git push origin main

# View GitHub Actions
# Go to: https://github.com/USERNAME/REPO/actions
```

### Contact Information
- Hostinger Support: Available in hPanel
- GitHub Support: https://support.github.com
- Your Team: [Add team contact info]

---

## ✅ Final Sign-Off

Once everything is checked:

- [ ] All checklist items completed
- [ ] Deployments tested multiple times
- [ ] Team members notified
- [ ] Documentation updated
- [ ] Backup procedures in place
- [ ] Monitoring active

**Deployment Status**: 
- [ ] ✅ READY FOR PRODUCTION
- [ ] ⚠️ NEEDS ATTENTION
- [ ] ❌ BLOCKED (specify reason)

**Deployed By**: _________________

**Date**: _________________

**Notes**: 
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## 🎉 Success!

If all items are checked, congratulations! Your CI/CD pipeline is fully operational.

**Every push to GitHub main branch will now automatically deploy to Hostinger!** 🚀

---

## 📞 Support Resources

**If you need help:**

1. **Check logs** in GitHub Actions
2. **Review documentation** 
   - QUICK_SETUP_CICD.md
   - HOSTINGER_CICD_SETUP.md
3. **Test manually** with FTP client
4. **Contact Hostinger** support via hPanel
5. **Search GitHub** issues for similar problems

**Emergency Rollback:**
If something goes wrong, you can always:
1. Restore from Hostinger backup
2. Deploy previous version manually
3. Revert Git commit and push

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintained By**: [Your Name/Team]

