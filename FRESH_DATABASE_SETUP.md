# 🗄️ Fresh Database Setup Guide

## ⚠️ Important: Nothing is Created Automatically!

When you connect to a fresh/new database, **NOTHING is created automatically**. The server will start successfully but the database will be **completely empty**.

You **MUST** manually run initialization scripts to set up:
1. ✅ Admin user
2. ✅ Dental plans (adult + kids)
3. ✅ Availability templates
4. ✅ Database indexes

---

## 📋 Step-by-Step Setup

### Step 1: Update Database URL

#### On Vercel (Production):

1. Go to **Vercel Dashboard** → Your Project
2. Go to **Settings** → **Environment Variables**
3. Update `MONGODB_URI` with your new database URL:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dental-care?retryWrites=true&w=majority
   ```
4. Redeploy or restart the server

#### Locally (For testing):

Update `server/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dental-care?retryWrites=true&w=majority
```

---

### Step 2: Run Initialization Scripts

⚠️ **Run these scripts IN ORDER from the `server` directory:**

```bash
cd server
```

#### 1️⃣ Create Admin User

**Option A: Using npm script (Recommended - need to add this):**
```bash
npm run create-admin
```

**Option B: Direct command:**
```bash
node scripts/createAdmin.js
```

**✅ This creates:**
- **Email:** `admin@teerthankerdentalcare.com`
- **Password:** `admin123`
- **Role:** `admin`

⚠️ **IMPORTANT:** Change the password after first login!

---

#### 2️⃣ Seed Dental Plans

```bash
npm run seed-plans
```

**✅ This creates 5 plans:**
- **Adult Plans:**
  - Tooth Protector Plan (₹6,999/year)
  - Dental Shield Plan (₹12,999/year)
  - Smile Saver Plan (₹24,999/year)
- **Kids Plans (Age 3-14):**
  - Kids Protect Plan (₹4,999/year)
  - Kids Shield Plan (₹8,999/year)

---

#### 3️⃣ Seed Availability Templates

```bash
npm run seed-availability
```

**✅ This creates:**
- Default Schedule (9 AM - 5 PM)
- Extended Hours (8 AM - 8 PM)
- Morning Only (9 AM - 12 PM)
- Sample holidays
- **Note:** Also creates an admin user if one doesn't exist

---

#### 4️⃣ Fix Database Indexes (Optional but Recommended)

```bash
node scripts/check-and-fix-indexes.js
```

**✅ This ensures:**
- All required indexes are created
- Email and phone indexes are correct
- Performance optimizations are in place

---

## 🚀 Quick Setup Script

Run all initialization steps at once:

```bash
cd server

# 1. Create admin
node scripts/createAdmin.js

# 2. Seed plans
npm run seed-plans

# 3. Seed availability
npm run seed-availability

# 4. Fix indexes
node scripts/check-and-fix-indexes.js

echo "✅ Database initialization complete!"
```

---

## 📝 What Gets Created

### Users:
- ✅ **1 Admin User**
  - Email: `admin@teerthankerdentalcare.com`
  - Password: `admin123`
  - Role: `admin`
  - Status: Verified

### Plans (5 total):
- ✅ **3 Adult Plans** (₹6,999 - ₹24,999)
- ✅ **2 Kids Plans** (₹4,999 - ₹8,999)

### Availability:
- ✅ **3 Availability Templates** (Default, Extended, Morning)
- ✅ **Sample Holidays**

### Indexes:
- ✅ Email index (unique)
- ✅ Phone index (unique)
- ✅ Other performance indexes

---

## 🔐 First Login (Admin)

After initialization:

1. Visit: `https://admin.teerthankeraadinathbrightdentalcare.in/`
2. Login with:
   - **Email:** `admin@teerthankerdentalcare.com`
   - **Password:** `admin123`
3. **Immediately change password** in settings!

---

## ❌ What Does NOT Get Created

These need to be created manually through the app:

- ❌ Regular users (patients)
- ❌ Appointments
- ❌ Settings/configurations
- ❌ Notifications
- ❌ Any custom holidays (beyond sample)
- ❌ Analytics data

---

## 🔍 Verify Setup

### Check Admin User:
```bash
# In MongoDB shell or Compass
db.users.findOne({ role: "admin" })
```

### Check Plans:
```bash
db.plans.find().count()  # Should return 5
```

### Check Availability Templates:
```bash
db.availabilitytemplates.find().count()  # Should return 3
```

---

## 🐛 Troubleshooting

### Script fails with "admin already exists"
✅ **This is fine!** Admin already created. Skip this script.

### Script fails with "connection refused"
❌ Check your `MONGODB_URI` is correct
❌ Check your database allows connections from your IP
❌ Check your network/firewall

### Plans not showing in app
1. Check database: `db.plans.find()`
2. Re-run: `npm run seed-plans`
3. Check API endpoint: `https://api.teerthankerdentalcare.com/api/plans`

### Can't login as admin
1. Verify admin exists: `db.users.findOne({ role: "admin" })`
2. Re-run: `node scripts/createAdmin.js`
3. Check email is **exactly**: `admin@teerthankerdentalcare.com`
4. Password is **exactly**: `admin123`

---

## 📦 Adding npm Script for Admin Creation

To make it easier, add this to `server/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "create-admin": "node scripts/createAdmin.js",  // ← ADD THIS
  "seed-plans": "node src/scripts/seedPlans.js",
  "seed-availability": "node src/scripts/seedAvailabilityData.js"
}
```

Then you can run:
```bash
npm run create-admin
```

---

## 🔄 Reset Everything (Fresh Start)

If you want to completely reset the database:

```bash
# In MongoDB shell or Compass
use dental-care  # Your database name
db.dropDatabase()
```

Then run all initialization scripts again.

---

## 📊 Production Checklist

After switching to fresh database in production:

- [ ] Updated `MONGODB_URI` on Vercel
- [ ] Redeployed server
- [ ] Created admin user
- [ ] Seeded dental plans
- [ ] Seeded availability templates
- [ ] Fixed indexes
- [ ] Tested admin login
- [ ] Changed admin password
- [ ] Verified plans show in client app
- [ ] Tested appointment booking flow
- [ ] Checked all API endpoints work

---

## 🆘 Need Help?

If scripts fail:
1. Check `MONGODB_URI` is correct
2. Check database connection is working
3. Check you're in the `server` directory
4. Check Node.js version (should be 18+)
5. Check `npm install` was run

---

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| Create Admin | `node scripts/createAdmin.js` |
| Seed Plans | `npm run seed-plans` |
| Seed Availability | `npm run seed-availability` |
| Fix Indexes | `node scripts/check-and-fix-indexes.js` |
| Admin Login | Email: `admin@teerthankerdentalcare.com`<br>Password: `admin123` |

---

**Remember:** Always run these scripts when:
- Setting up a new database
- After database reset
- After database migration
- Moving from development to production

✅ **Database initialization is complete!**

