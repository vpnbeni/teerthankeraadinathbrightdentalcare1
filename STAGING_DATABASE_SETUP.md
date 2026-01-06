# 🗃️ Staging Database Setup Guide

Complete guide for setting up a separate MongoDB database for the staging environment with ₹1 plan prices for testing.

## 📋 Overview

When deploying to Hostinger (staging), the application will automatically use a **separate MongoDB database** where all subscription plans are priced at **₹1** for testing purposes.

| Environment | Database | Plan Prices | Purpose |
|-------------|----------|-------------|---------|
| **Production** | `teerthanker-dental-care` | Actual prices (₹6,999 - ₹24,999) | Live users |
| **Staging** | `teerthanker-dental-care-stage` | ₹1 (all plans) | Payment testing |

## 🔧 Setup Steps

### Step 1: Create Staging Database on MongoDB Atlas

1. **Log in to MongoDB Atlas**: https://cloud.mongodb.com/

2. **Create a new database** in your existing cluster:
   - Go to **Collections** → **Create Database**
   - Database Name: `teerthanker-dental-care-stage`
   - Collection Name: `plans` (initial collection)

3. **Get the connection string**:
   ```
   mongodb+srv://vpnbenidev:YOUR_PASSWORD@cluster0.agz3j.mongodb.net/teerthanker-dental-care-stage?retryWrites=true&w=majority
   ```

### Step 2: Add Environment Variable to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/

2. **Select your staging project** (stage-tabdc-server)

3. **Navigate to**: Settings → Environment Variables

4. **Add the following variables**:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `STAGE_MONGODB_URI` | `mongodb+srv://...your-stage-db-uri...` | Production |
   | `DEPLOY_ENV` | `stage` | Production |

### Step 3: Seed the Staging Database

Run the staging seed script to populate the database with ₹1 plans:

```bash
# Set the environment variables temporarily
export STAGE_MONGODB_URI="mongodb+srv://vpnbenidev:YOUR_PASSWORD@cluster0.agz3j.mongodb.net/teerthanker-dental-care-stage"
export DEPLOY_ENV="stage"

# Run the seeding script
npm run seed:stage-plans
```

Or directly:

```bash
cd server
STAGE_MONGODB_URI="your-stage-mongodb-uri" DEPLOY_ENV="stage" node src/scripts/seedStagePlans.js
```

### Step 4: Verify Setup

After seeding, verify the plans are correctly set:

```javascript
// Connect to staging database and check plans
db.plans.find({}, { name: 1, price: 1, category: 1 })
```

Expected output:
```
{ name: "Tooth Protector Plan", price: 1, category: "adult" }
{ name: "Dental Shield Plan", price: 1, category: "adult" }
{ name: "Smile Saver Plan", price: 1, category: "adult" }
{ name: "Kids Protect Plan", price: 1, category: "kids" }
{ name: "Kids Shield Plan", price: 1, category: "kids" }
```

## 🔄 How It Works

### Environment Detection

The server automatically detects the staging environment through:

1. **`DEPLOY_ENV=stage`** environment variable (explicit)
2. **`VERCEL_URL`** containing "stage" (automatic on Vercel)

```javascript
// server/src/config/environment.js
const isStageEnvironment = () => {
  if (process.env.DEPLOY_ENV === "stage") return true;
  if (process.env.VERCEL_URL?.includes("stage")) return true;
  return false;
};
```

### Database Selection

When in staging mode, the server uses `STAGE_MONGODB_URI`:

```javascript
const getMongoDbUri = () => {
  if (isStageEnvironment() && process.env.STAGE_MONGODB_URI) {
    console.log("📍 Using STAGING MongoDB database");
    return process.env.STAGE_MONGODB_URI;
  }
  console.log("📍 Using PRODUCTION MongoDB database");
  return process.env.MONGODB_URI;
};
```

## 📊 Vercel Environment Variables Summary

### Production Project (main branch)
```
MONGODB_URI=mongodb+srv://...production-db...
DEPLOY_ENV=production
```

### Staging Project (stage branch)
```
MONGODB_URI=mongodb+srv://...production-db...  # Fallback
STAGE_MONGODB_URI=mongodb+srv://...staging-db...  # Used
DEPLOY_ENV=stage
```

## 🧪 Testing Payments on Staging

### Razorpay Test Mode

Make sure to use **Razorpay Test Keys** on staging:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
```

### Test Card Details (Razorpay)

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | Any | Any future | Success |
| 4000 0000 0000 0002 | Any | Any future | Declined |

With ₹1 plans, you can test the complete payment flow without spending real money!

## 🔧 Troubleshooting

### Issue: Server still using production database

**Check logs for**:
```
📍 Using STAGING MongoDB database
```

If you see:
```
📍 Using PRODUCTION MongoDB database
```

**Solution**:
1. Verify `DEPLOY_ENV=stage` is set in Vercel
2. Verify `STAGE_MONGODB_URI` is correctly set
3. Redeploy the server

### Issue: Plans showing real prices on staging

**Solution**:
1. Confirm you're connected to the staging database
2. Re-run the seed script:
   ```bash
   npm run seed:stage-plans
   ```

### Issue: Connection timeouts

**Solution**:
1. Check MongoDB Atlas Network Access
2. Add `0.0.0.0/0` to allow all IPs (for Vercel serverless)
3. Ensure connection string is URL-encoded

## 📝 Quick Checklist

- [ ] Created `teerthanker-dental-care-stage` database in MongoDB Atlas
- [ ] Added `STAGE_MONGODB_URI` to Vercel staging project
- [ ] Added `DEPLOY_ENV=stage` to Vercel staging project
- [ ] Ran `npm run seed:stage-plans` to seed ₹1 plans
- [ ] Verified plans show ₹1 on staging site
- [ ] Using Razorpay test keys on staging
- [ ] Tested payment flow with ₹1

## 🎯 Best Practices

1. **Never mix databases** - Always verify which database you're connected to
2. **Use test payment keys** - Never use live Razorpay keys on staging
3. **Regular sync** - Keep staging data structure in sync with production
4. **Document changes** - Update this guide when adding new features

---

**Setup Complete!** 🎉 Your staging environment now has a separate database with ₹1 test plans.
