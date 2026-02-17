# Deploy to Vercel (Server, Client, Admin)

This guide explains how to deploy the entire Teerthanker Dental Care application (server, client, and admin) to Vercel instead of Hostinger.

## Overview

The project has three deployable parts:

| App | Directory | Framework | Vercel Project |
|-----|-----------|-----------|----------------|
| **Server** (API) | `server/` | Node.js serverless | teerthanker-server |
| **Client** (Patient app) | `client/` | Vite + React | teerthanker-client |
| **Admin** (Dashboard) | `admin/` | Vite + React | teerthanker-admin |

## Option 1: Vercel Git Integration (Recommended)

The simplest approach is to connect your GitHub repo to Vercel. Each push will automatically deploy the changed projects.

### Step 1: Create Three Vercel Projects

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository **three times** (once per app)
3. For each import, configure:

#### Server Project
- **Project Name**: `teerthanker-server` (or your existing name)
- **Root Directory**: `server`
- **Framework Preset**: Other (uses `server/vercel.json`)
- **Environment Variables**: Copy from `vercel-production.env` (server vars)

#### Client Project
- **Project Name**: `teerthanker-client`
- **Root Directory**: `client`
- **Framework Preset**: Vite (auto-detected)
- **Environment Variables**:
  - `VITE_API_URL` = `https://teerthanker-server.vercel.app/api` (or your server URL)
  - `VITE_API_BASE_URL` = `https://teerthanker-server.vercel.app`

#### Admin Project
- **Project Name**: `teerthanker-admin`
- **Root Directory**: `admin`
- **Framework Preset**: Vite (auto-detected)
- **Environment Variables**:
  - `VITE_API_URL` = `https://teerthanker-server.vercel.app/api` (or your server URL)
  - `VITE_API_BASE_URL` = `https://teerthanker-server.vercel.app`

### Step 2: Configure Custom Domains (Optional)

In each project's Settings → Domains, add your custom domains:
- **Server**: `api.teerthankerdentalcare.com`
- **Client**: `client.teerthankerdentalcare.com` or `teerthankeraadinathbrightdentalcare.in`
- **Admin**: `admin.teerthankerdentalcare.com`

---

## Option 2: GitHub Actions Deployment

Use the included workflow when you prefer deploying via GitHub Actions instead of Vercel's Git integration.

### Step 1: Get Vercel Credentials

1. **Vercel Token**: [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token
2. **Org ID & Project IDs**: Run locally:
   ```bash
   cd server && vercel link
   cd ../client && vercel link
   cd ../admin && vercel link
   ```
   Each `.vercel/project.json` contains `orgId` and `projectId`.

### Step 2: Add GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Your Vercel API token |
| `VERCEL_ORG_ID` | Your Vercel team/org ID |
| `VERCEL_SERVER_PROJECT_ID` | Server project ID |
| `VERCEL_CLIENT_PROJECT_ID` | Client project ID |
| `VERCEL_ADMIN_PROJECT_ID` | Admin project ID |

### Step 3: Deploy

- **Automatic**: Push to `main` (when `client/`, `admin/`, `server/`, or `shared/` change)
- **Manual**: Actions → Deploy All to Vercel → Run workflow

---

## Environment Variables

### Server (in Vercel Dashboard)

Copy from `vercel-production.env`. Key variables:
- `MONGODB_URI` / `STAGE_MONGODB_URI`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_*`, `MSG91_*`, `EMAIL_*`, etc.
- `CLIENT_URL`, `ADMIN_URL` (your Vercel client/admin URLs)

### Client & Admin

Set in each project's Environment Variables:
- `VITE_API_URL` = Your server API URL (e.g. `https://teerthanker-server.vercel.app/api`)
- `VITE_API_BASE_URL` = Base URL without `/api`
- `VITE_RAZORPAY_KEY_ID` = Razorpay public key (for client)

---

## CORS

The server is configured to allow requests from:
- `*.vercel.app` (all Vercel deployments)
- Your custom domains
- Localhost (development)

---

## Migration from Hostinger

1. Set up the three Vercel projects as above
2. Add environment variables from your existing Hostinger/server config
3. (Optional) Disable the old `deploy-all.yml` workflow or remove Hostinger-related secrets
4. Update DNS to point your domains to Vercel (or use Vercel subdomains for testing)
