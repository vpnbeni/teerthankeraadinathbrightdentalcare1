# Hostinger Shared Hosting - CI/CD Pipeline Setup Guide

## Overview

This guide will help you set up automatic deployment from GitHub to Hostinger shared hosting for both your **Admin** and **Client** applications.

## Prerequisites

### 1. Hostinger Account Information

You'll need:

- **FTP/SFTP Host**: Usually `ftp.yourdomain.com` or from Hostinger control panel
- **FTP/SFTP Username**: From Hostinger control panel
- **FTP/SFTP Password**: From Hostinger control panel
- **FTP Port**: Usually `21` (FTP) or `22` (SFTP)
- **Remote Path**:
  - Client app path (e.g., `/public_html/` or `/domains/yourdomain.com/public_html/`)
  - Admin app path (e.g., `/public_html/admin/`)

### 2. GitHub Repository

- Your code should be on GitHub
- You need admin access to add secrets

### 3. Environment Variables

Prepare your production environment variables for both apps.

---

## Step 1: Get Hostinger FTP/SFTP Credentials

### Option A: Using Hostinger Control Panel (hPanel)

1. **Log in to Hostinger**
2. Go to **Hosting** → Select your hosting plan
3. Go to **Files** → **FTP Accounts**
4. Create or use existing FTP account:
   - Username: Note it down (e.g., `u123456789`)
   - Password: Set/reset password
   - Host: Usually shown as `ftp.yourdomain.com`
   - Port: `21` for FTP

### Option B: Using SSH/SFTP (Recommended - More Secure)

1. **Enable SSH** in Hostinger control panel:

   - Go to **Advanced** → **SSH Access**
   - Enable SSH access
   - Note down SSH credentials

2. **SSH Details**:
   - Host: Your domain or IP
   - Port: `22`
   - Username: Same as hosting username
   - Password: Your hosting password

---

## Step 2: Prepare Your Applications

### Update Build Scripts

Make sure both apps have production build scripts in their `package.json`:

**Client (`client/package.json`):**

```json
{
  "scripts": {
    "build": "vite build",
    "build:prod": "vite build --mode production"
  }
}
```

**Admin (`admin/package.json`):**

```json
{
  "scripts": {
    "build": "vite build",
    "build:prod": "vite build --mode production"
  }
}
```

### Create Production Environment Files

**Client (`client/.env.production`):**

```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=Teerthanker Aadinath Bright Dental Care
```

**Admin (`admin/.env.production`):**

```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=Dental Care Admin
```

---

## Step 3: Add GitHub Secrets

Go to your GitHub repository:

1. Click **Settings**
2. Go to **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add the following secrets:

### For FTP Deployment:

```
FTP_SERVER=ftp.yourdomain.com
FTP_USERNAME=your_ftp_username
FTP_PASSWORD=your_ftp_password
FTP_CLIENT_PATH=/public_html/
FTP_ADMIN_PATH=/public_html/admin/
```

### For SFTP Deployment (Recommended):

```
SFTP_HOST=yourdomain.com
SFTP_PORT=22
SFTP_USERNAME=your_ssh_username
SFTP_PASSWORD=your_ssh_password
SFTP_CLIENT_PATH=/domains/yourdomain.com/public_html/
SFTP_ADMIN_PATH=/domains/yourdomain.com/public_html/admin/
```

### Environment Variables (Optional):

```
CLIENT_VITE_API_URL=https://yourdomain.com/api
ADMIN_VITE_API_URL=https://yourdomain.com/api
```

---

## Step 4: Create GitHub Actions Workflow Files

Create the `.github/workflows` directory structure:

```bash
mkdir -p .github/workflows
```

### Workflow 1: Deploy Client Application

Create `.github/workflows/deploy-client.yml`:

```yaml
name: Deploy Client to Hostinger

on:
  push:
    branches:
      - main # Deploy when pushing to main branch
    paths:
      - "client/**"
      - "shared/**"
      - ".github/workflows/deploy-client.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install shared dependencies
        working-directory: ./shared
        run: npm ci

      - name: Install client dependencies
        working-directory: ./client
        run: npm ci

      - name: Build client application
        working-directory: ./client
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.CLIENT_VITE_API_URL }}

      - name: Deploy to Hostinger via SFTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          port: ${{ secrets.SFTP_PORT }}
          protocol: ftps
          local-dir: ./client/dist/
          server-dir: ${{ secrets.SFTP_CLIENT_PATH }}
          dangerous-clean-slate: false

      - name: Deployment successful
        run: echo "✅ Client deployed successfully to Hostinger!"
```

### Workflow 2: Deploy Admin Application

Create `.github/workflows/deploy-admin.yml`:

```yaml
name: Deploy Admin to Hostinger

on:
  push:
    branches:
      - main # Deploy when pushing to main branch
    paths:
      - "admin/**"
      - "shared/**"
      - ".github/workflows/deploy-admin.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install shared dependencies
        working-directory: ./shared
        run: npm ci

      - name: Install admin dependencies
        working-directory: ./admin
        run: npm ci

      - name: Build admin application
        working-directory: ./admin
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.ADMIN_VITE_API_URL }}

      - name: Deploy to Hostinger via SFTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          port: ${{ secrets.SFTP_PORT }}
          protocol: ftps
          local-dir: ./admin/dist/
          server-dir: ${{ secrets.SFTP_ADMIN_PATH }}
          dangerous-clean-slate: false

      - name: Deployment successful
        run: echo "✅ Admin deployed successfully to Hostinger!"
```

### Workflow 3: Deploy Both (Optional)

Create `.github/workflows/deploy-all.yml`:

```yaml
name: Deploy All Applications to Hostinger

on:
  push:
    branches:
      - main
  workflow_dispatch: # Allow manual trigger

jobs:
  deploy-client:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install shared dependencies
        working-directory: ./shared
        run: npm ci

      - name: Install client dependencies
        working-directory: ./client
        run: npm ci

      - name: Build client
        working-directory: ./client
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.CLIENT_VITE_API_URL }}

      - name: Deploy client to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          port: ${{ secrets.SFTP_PORT }}
          protocol: ftps
          local-dir: ./client/dist/
          server-dir: ${{ secrets.SFTP_CLIENT_PATH }}

  deploy-admin:
    runs-on: ubuntu-latest
    needs: deploy-client # Run after client deployment

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install shared dependencies
        working-directory: ./shared
        run: npm ci

      - name: Install admin dependencies
        working-directory: ./admin
        run: npm ci

      - name: Build admin
        working-directory: ./admin
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.ADMIN_VITE_API_URL }}

      - name: Deploy admin to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          port: ${{ secrets.SFTP_PORT }}
          protocol: ftps
          local-dir: ./admin/dist/
          server-dir: ${{ secrets.SFTP_ADMIN_PATH }}
```

---

## Step 5: Setup Hostinger Directory Structure

### Recommended Structure:

```
/domains/yourdomain.com/
├── public_html/              # Client application (main site)
│   ├── index.html
│   ├── assets/
│   └── ...
├── public_html/admin/        # Admin application
│   ├── index.html
│   ├── assets/
│   └── ...
└── api/                      # Your backend API (if hosted here)
```

### Create Directories on Hostinger:

1. **Using File Manager**:

   - Log in to Hostinger hPanel
   - Go to **Files** → **File Manager**
   - Navigate to `public_html`
   - Create `admin` folder

2. **Using SSH**:
   ```bash
   ssh username@yourdomain.com
   cd public_html
   mkdir -p admin
   ```

---

## Step 6: Configure .htaccess for React Router

### Client (.htaccess in /public_html/)

Create or update `.htaccess`:

```apache
# Enable Rewrite Engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect HTTP to HTTPS (if you have SSL)
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Handle React Router
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Admin (.htaccess in /public_html/admin/)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/

  # Handle React Router
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>
```

---

## Step 7: Update Vite Config for Base Path

### Admin (admin/vite.config.js):

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/admin/", // Important for admin subdirectory
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
```

### Client (client/vite.config.js):

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // Root for main site
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
```

---

## Step 8: Test and Deploy

### Initial Manual Test:

1. **Build locally**:

   ```bash
   cd client
   npm run build

   cd ../admin
   npm run build
   ```

2. **Upload manually first** (via FileZilla or Hostinger File Manager):

   - Upload `client/dist/*` to `/public_html/`
   - Upload `admin/dist/*` to `/public_html/admin/`

3. **Test in browser**:
   - Client: `https://yourdomain.com`
   - Admin: `https://yourdomain.com/admin`

### Automatic Deployment:

1. **Commit workflow files**:

   ```bash
   git add .github/workflows/
   git commit -m "Add CI/CD workflows for Hostinger deployment"
   git push origin main
   ```

2. **Monitor deployment**:

   - Go to GitHub repository
   - Click **Actions** tab
   - Watch the deployment progress

3. **Check logs**:
   - Click on running/completed workflow
   - Review each step
   - Check for errors

---

## Step 9: Troubleshooting

### Common Issues:

#### 1. FTP Connection Failed

```
Error: Unable to connect to FTP server
```

**Solution**:

- Verify FTP credentials in GitHub Secrets
- Check if Hostinger FTP is enabled
- Try using port 21 for FTP or 22 for SFTP
- Check firewall settings

#### 2. Permission Denied

```
Error: Permission denied
```

**Solution**:

- Check file permissions on Hostinger (should be 755 for directories, 644 for files)
- Verify FTP user has write access
- Use correct server path

#### 3. Build Fails

```
Error: npm ci failed
```

**Solution**:

- Check Node.js version compatibility
- Verify package.json and package-lock.json are committed
- Check for missing dependencies

#### 4. 404 on Routes

```
Error: Cannot GET /some-route
```

**Solution**:

- Verify `.htaccess` is uploaded
- Check Apache mod_rewrite is enabled
- Ensure base path is correct in vite.config.js

#### 5. Assets Not Loading

```
Error: Failed to load resource
```

**Solution**:

- Check base path in vite.config.js
- Verify assets are in correct directory
- Check file permissions

---

## Step 10: Optimization

### 1. Add Build Caching

Update workflows to cache dependencies:

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 2. Notify on Deployment

Add Slack/Discord notifications:

```yaml
- name: Notify Deployment Success
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Deployment successful!"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 3. Run Tests Before Deploy

```yaml
- name: Run tests
  working-directory: ./client
  run: npm test
```

---

## Alternative: Using Git Deploy

If your Hostinger plan supports Git:

### Enable Git Version Control:

1. Go to Hostinger hPanel
2. Navigate to **Git Version Control**
3. Create repository
4. Link to GitHub
5. Set up webhook for auto-deployment

This is simpler but may not be available on all plans.

---

## Security Best Practices

1. **Never commit secrets** to repository
2. **Use SFTP instead of FTP** when possible
3. **Enable 2FA** on Hostinger account
4. **Use strong passwords** for FTP/SFTP
5. **Regularly update dependencies**
6. **Review GitHub Actions logs** for sensitive data
7. **Use environment-specific configs**

---

## Monitoring and Maintenance

### 1. Set up monitoring:

- Use Hostinger's built-in analytics
- Add Google Analytics
- Monitor error logs

### 2. Regular checks:

- Test deployments after each push
- Review GitHub Actions logs
- Check application performance

### 3. Backups:

- Enable automatic backups in Hostinger
- Keep local backups of database
- Version control for code

---

## Quick Reference Commands

```bash
# Commit and push to trigger deployment
git add .
git commit -m "Your changes"
git push origin main

# Manual deploy trigger (if workflow_dispatch enabled)
# Go to GitHub → Actions → Deploy All → Run workflow

# Check deployment status
# GitHub → Actions → Latest workflow run

# SSH into Hostinger
ssh username@yourdomain.com

# View deployed files
cd public_html
ls -la
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action)
- [Hostinger Tutorials](https://www.hostinger.com/tutorials/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Verify Hostinger settings
3. Test FTP connection manually
4. Review this guide
5. Contact Hostinger support if needed

Happy deploying! 🚀
