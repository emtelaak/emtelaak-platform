# Vercel Deployment Guide - Emtelaak Platform

**Complete step-by-step guide to deploy your Emtelaak platform to Vercel with automated database setup.**

---

## 📋 Prerequisites

Before you begin, you'll need:
- ✅ GitHub account (you have: emtelaak)
- ✅ GitHub repository (you have: emtelaak-platform-test)
- ⏳ TiDB Cloud account (we'll create this - 2 minutes)
- ⏳ Vercel account (we'll create this - 1 minute)

---

## 🚀 Part 1: Create TiDB Cloud Database (5 Minutes)

### Step 1.1: Sign Up for TiDB Cloud

1. Go to: **https://tidbcloud.com**
2. Click "**Sign up free**" or "**Get Started**"
3. Choose sign-up method:
   - **Recommended**: Click "**Continue with GitHub**" (same account as your repo)
   - Alternative: Use email

4. If using GitHub:
   - Click "Authorize TiDB Cloud"
   - You're logged in!

5. If using email:
   - Enter your email
   - Create password
   - Verify email (check inbox)

### Step 1.2: Create Serverless Cluster (Free)

1. After login, you'll see TiDB Cloud Console
2. Click "**Create Cluster**" button (big green button)

3. Choose plan:
   - Select "**Serverless**" tab
   - This is **100% FREE** with:
     - 5 GB storage
     - 50M Request Units/month
     - Perfect for testing

4. Configure cluster:
   ```
   Cluster Name: emtelaak-production
   Cloud Provider: AWS (recommended)
   Region: Choose closest to you:
     - US: us-east-1
     - Europe: eu-west-1
     - Asia: ap-southeast-1
   ```

5. Click "**Create**" button

6. Wait 1-2 minutes (status: Creating → Available)

### Step 1.3: Get Database Connection String

1. Click on your cluster name "**emtelaak-production**"

2. Click "**Connect**" button (top right)

3. **Set Root Password** (first time only):
   - Click "**Generate Password**" button
   - **IMPORTANT**: Copy and save this password immediately!
   - Or create your own strong password
   - Click "**Create Password**"

4. **Copy Connection String**:
   - You'll see connection details
   - Look for "**Connection String**" section
   - Copy the full string, it looks like:
   ```
   mysql://4xxxxxx.root:YOUR_PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test
   ```

5. **Modify the connection string**:
   - Change `/test` at the end to `/emtelaak`
   - Final format:
   ```
   mysql://4xxxxxx.root:YOUR_PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/emtelaak
   ```

6. **Save this connection string** - you'll need it for Vercel!

### Step 1.4: Create Database

1. In TiDB Cloud Console, click "**SQL Editor**" (left sidebar)

2. Paste and run this SQL:
   ```sql
   CREATE DATABASE emtelaak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Click "**Run**" or press Ctrl+Enter

4. You should see: "✅ Query OK"

**✅ Database is ready!** Keep your connection string handy.

---

## 🌐 Part 2: Deploy to Vercel (10 Minutes)

### Step 2.1: Create Vercel Account

1. Go to: **https://vercel.com**

2. Click "**Sign Up**" button

3. Choose "**Continue with GitHub**"
   - This automatically connects your repositories
   - Click "Authorize Vercel"

4. You're logged in to Vercel dashboard!

### Step 2.2: Import Your Repository

1. Click "**Add New...**" button (top right)

2. Select "**Project**" from dropdown

3. You'll see "Import Git Repository" section

4. Find your repository:
   - Look for "**emtelaak/emtelaak-platform-test**"
   - Click "**Import**" button next to it

### Step 2.3: Configure Project

You'll see a configuration page. Fill in:

**1. Project Name**
```
emtelaak-platform-test
```
(or customize as you like)

**2. Framework Preset**
- Click the dropdown
- Select "**Vite**"

**3. Root Directory**
- Leave as: `./`

**4. Build and Output Settings**

Click "**Override**" and set:
```
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install
```

### Step 2.4: Add Environment Variables

**IMPORTANT**: Before clicking Deploy!

1. Scroll down to "**Environment Variables**" section

2. Click to expand it

3. Add these variables one by one:

**Variable 1: DATABASE_URL**
```
Name: DATABASE_URL
Value: [Paste your TiDB connection string from Part 1]
Example: mysql://4xxxxxx.root:password@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/emtelaak
```

**Variable 2: JWT_SECRET**
```
Name: JWT_SECRET
Value: emtelaak_prod_jwt_2024_x7k9mP3nQ8wL5vR2tY6uI1oE4sA0zX
```

**Variable 3: OWNER_OPEN_ID**
```
Name: OWNER_OPEN_ID
Value: admin-emtelaak-001
```
(This will be your super admin ID)

**Variable 4: OWNER_NAME**
```
Name: OWNER_NAME
Value: Emtelaak Admin
```
(Or your actual name)

**Variable 5: NODE_OPTIONS**
```
Name: NODE_OPTIONS
Value: --max-old-space-size=3072
```

**Variable 6: VITE_APP_TITLE**
```
Name: VITE_APP_TITLE
Value: Emtelaak Platform
```

**Variable 7: VITE_APP_LOGO**
```
Name: VITE_APP_LOGO
Value: /logo.svg
```

4. After adding all variables, click "**Deploy**" button

### Step 2.5: Wait for Deployment

1. Vercel will now:
   - Install dependencies (2-3 minutes)
   - Build your application (1-2 minutes)
   - Deploy to production

2. You'll see a progress screen with logs

3. When complete, you'll see:
   - "**Congratulations!**" message
   - Your live URL (e.g., `emtelaak-platform-test.vercel.app`)

4. Click "**Visit**" to see your live site!

---

## 🗄️ Part 3: Setup Database Tables (2 Minutes)

Your app is deployed, but the database is empty. Let's set it up!

### Option A: Run Setup Script Locally

1. **Clone your repository** (if not already):
   ```bash
   git clone https://github.com/emtelaak/emtelaak-platform-test.git
   cd emtelaak-platform-test
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set DATABASE_URL**:
   ```bash
   export DATABASE_URL="your-tidb-connection-string-here"
   ```

4. **Run setup script**:
   ```bash
   node scripts/setup-database.mjs
   ```

5. You'll see:
   ```
   🚀 Emtelaak Platform - Database Setup Script
   📊 Connecting to database...
   ✅ Connected to database successfully
   📋 Step 1: Creating database tables...
     ✅ Created table: users
     ✅ Created table: properties
     ✅ Created table: offerings
     ... (8 tables total)
   ✅ All tables created successfully
   🎉 Your database is ready to use!
   ```

### Option B: Run Setup via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Run setup script**:
   ```bash
   vercel env pull .env.local
   node scripts/setup-database.mjs
   ```

### Option C: Manual SQL Setup

If you prefer manual setup, run these SQL commands in TiDB Cloud SQL Editor:

```sql
-- See the setup-database.mjs file for complete SQL
-- Or use the manual-investment-migration.sql file
```

---

## ✅ Part 4: Verify Deployment

### 4.1: Check Your Live Site

1. Go to your Vercel URL: `https://emtelaak-platform-test.vercel.app`

2. You should see:
   - ✅ Homepage loads
   - ✅ No errors in console
   - ✅ Navigation works

### 4.2: Test Admin Access

1. Click "Login" or go to `/admin`

2. First user to login becomes super admin (if their OWNER_OPEN_ID matches)

3. After login, check:
   - ✅ Admin dashboard accessible
   - ✅ User management works
   - ✅ Property management works

### 4.3: Check Database Connection

1. Go to: `https://your-app.vercel.app/admin/user-management`

2. If you see users table (even if empty), database is connected!

3. If you see errors, check:
   - DATABASE_URL is correct in Vercel
   - Database tables are created
   - TiDB cluster is running

---

## 🎉 Success Checklist

- [ ] TiDB Cloud account created
- [ ] Database cluster created and running
- [ ] Database connection string obtained
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] All environment variables added
- [ ] Deployment successful
- [ ] Database tables created
- [ ] Homepage loads correctly
- [ ] Admin dashboard accessible
- [ ] Database connection working

---

## 🔧 Troubleshooting

### Issue: Build Failed

**Error**: "Build failed with exit code 137"

**Solution**: Memory limit reached
1. In Vercel project settings
2. Go to "Settings" → "Functions"
3. Increase memory limit to 3008 MB

### Issue: Database Connection Failed

**Error**: "Cannot connect to database"

**Solutions**:
1. Check DATABASE_URL is correct
2. Ensure TiDB cluster is running
3. Verify database name is `emtelaak` not `test`
4. Check firewall/network settings

### Issue: Tables Not Created

**Solution**: Run the setup script again:
```bash
export DATABASE_URL="your-connection-string"
node scripts/setup-database.mjs
```

### Issue: Admin Access Denied

**Solution**: 
1. Check OWNER_OPEN_ID matches your OAuth ID
2. Or manually update user role in database:
   ```sql
   UPDATE users SET role='admin' WHERE email='your-email@example.com';
   ```

---

## 📊 What's Deployed

Your live platform includes:

**Frontend (58 Pages)**:
- Homepage
- Property listings
- Offering dashboard
- Investment flow
- Admin dashboard (16 pages)
- Super admin dashboard
- User profiles
- KYC verification

**Backend (100+ APIs)**:
- User management
- Property management
- Investment processing
- Payment handling
- Email notifications
- Security features

**Database (30+ Tables)**:
- Users and authentication
- Properties and offerings
- Investments and payments
- Reservations and escrow
- Documents and distributions

---

## 🚀 Next Steps

1. **Customize Branding**
   - Update logo in `client/public/`
   - Change colors in `client/src/index.css`
   - Update VITE_APP_TITLE in Vercel

2. **Add Test Data**
   - Create test properties
   - Create test offerings
   - Invite test users

3. **Configure Email**
   - Add SMTP settings in Vercel
   - Test email notifications

4. **Set Up Domain**
   - Go to Vercel project settings
   - Add custom domain
   - Update DNS records

5. **Enable Analytics**
   - Vercel Analytics (built-in)
   - Google Analytics
   - Custom tracking

---

## 📞 Support

**Documentation**:
- README.md - Project overview
- DEPLOYMENT.md - Detailed deployment guide
- GITHUB_SETUP.md - GitHub configuration

**Resources**:
- Vercel Docs: https://vercel.com/docs
- TiDB Cloud Docs: https://docs.pingcap.com/tidbcloud
- GitHub Repo: https://github.com/emtelaak/emtelaak-platform-test

**Need Help?**
- Check Vercel deployment logs
- Review TiDB Cloud monitoring
- Check browser console for errors

---

## 🎊 Congratulations!

Your Emtelaak Platform is now live on Vercel with a production database!

**Your URLs**:
- **Production**: https://emtelaak-platform-test.vercel.app
- **Admin**: https://emtelaak-platform-test.vercel.app/admin
- **GitHub**: https://github.com/emtelaak/emtelaak-platform-test

**Share with your team and start testing!** 🚀
