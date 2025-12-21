# Quick Deployment Checklist

## ✅ What's Already Done

- [x] Code is ready for deployment
- [x] Git repository initialized
- [x] All changes committed to `main` branch
- [x] GitHub remote configured: `https://github.com/emtelaak/emtelaak-platform-test.git`

---

## 🚀 What You Need to Do

### Step 1: Push to GitHub (5 minutes)

**Option A: Using GitHub CLI (Recommended)**

```bash
# Install GitHub CLI if not installed
# Visit: https://cli.github.com/

# Login to GitHub
gh auth login

# Push to GitHub
cd /home/ubuntu/emtelaak-platform
git push github main
```

**Option B: Using Personal Access Token**

1. **Create Personal Access Token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: "Emtelaak Deployment"
   - Scopes: Select `repo` (full control)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using token:**
   ```bash
   cd /home/ubuntu/emtelaak-platform
   git push https://YOUR_TOKEN@github.com/emtelaak/emtelaak-platform-test.git main
   ```

**Option C: Using SSH (Most Secure)**

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   cat ~/.ssh/id_ed25519.pub
   ```

2. **Add to GitHub:**
   - Copy the public key
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste and save

3. **Update remote and push:**
   ```bash
   cd /home/ubuntu/emtelaak-platform
   git remote set-url github git@github.com:emtelaak/emtelaak-platform-test.git
   git push github main
   ```

---

### Step 2: Set Up TiDB Cloud Database (10 minutes)

1. **Sign up:** https://tidbcloud.com
2. **Create Serverless Cluster:**
   - Name: `emtelaak-production`
   - Region: Choose closest to your users
   - Click "Create"
3. **Get Connection String:**
   - Click "Connect"
   - Copy the MySQL connection URL
   - Should look like: `mysql://user:pass@gateway.tidbcloud.com:4000/test`
4. **Create Database:**
   - Open SQL Editor in TiDB Cloud
   - Run:
     ```sql
     CREATE DATABASE emtelaak;
     ```
5. **Update Connection String:**
   - Change `test` to `emtelaak` in the URL
   - Save this URL - you'll need it for Vercel

---

### Step 3: Deploy to Vercel (15 minutes)

1. **Sign up:** https://vercel.com (use GitHub to sign in)

2. **Import Repository:**
   - Click "Add New..." → "Project"
   - Select `emtelaak-platform-test` repository
   - Click "Import"

3. **Configure Build Settings:**
   - Framework: Vite (auto-detected)
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **Add Environment Variables:**

   Click "Environment Variables" and add these:

   **Database:**
   ```
   DATABASE_URL
   mysql://user:pass@gateway.tidbcloud.com:4000/emtelaak?ssl={"rejectUnauthorized":true}
   ```
   *(Use your actual TiDB Cloud connection string)*

   **Authentication:**
   ```
   JWT_SECRET
   ```
   Generate a secure secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   **Email (SendGrid):**
   ```
   SMTP_HOST
   smtp.sendgrid.net

   SMTP_PORT
   587

   SMTP_SECURE
   false

   SMTP_USER
   apikey

   SMTP_PASSWORD
   SG.your-sendgrid-api-key

   SMTP_FROM_EMAIL
   noreply@emtelaak.com

   SMTP_FROM_NAME
   Emtelaak Platform
   ```

   **Frontend URL:**
   ```
   FRONTEND_URL
   https://emtelaak-platform-test.vercel.app
   ```
   *(Update after deployment with actual URL)*

   **Build Configuration:**
   ```
   NODE_OPTIONS
   --max-old-space-size=4096
   ```

   **App Configuration:**
   ```
   VITE_APP_TITLE
   Emtelaak - Fractional Real Estate

   VITE_APP_LOGO
   /logo.png
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 3-5 minutes
   - Copy your Vercel URL

6. **Update FRONTEND_URL:**
   - Go to Settings → Environment Variables
   - Update `FRONTEND_URL` with your actual Vercel URL
   - Redeploy (Deployments → ⋯ → Redeploy)

---

### Step 4: Run Database Migrations (5 minutes)

From your local machine or sandbox:

```bash
# Set DATABASE_URL
export DATABASE_URL="mysql://user:pass@gateway.tidbcloud.com:4000/emtelaak?ssl={\"rejectUnauthorized\":true}"

# Navigate to project
cd /home/ubuntu/emtelaak-platform

# Run migrations
pnpm db:push
```

This creates all database tables.

---

### Step 5: Test Your Deployment (10 minutes)

1. **Visit your Vercel URL**
2. **Register a test account**
3. **Check email** (verify welcome email arrives)
4. **Log in**
5. **Upload profile picture** (test S3 storage)
6. **Test password reset**
7. **Verify everything works**

---

## 📋 Environment Variables Quick Reference

Copy these to Vercel (update with your actual values):

```env
# Database
DATABASE_URL=mysql://user:pass@gateway.tidbcloud.com:4000/emtelaak?ssl={"rejectUnauthorized":true}

# Authentication
JWT_SECRET=your-generated-secret-here

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform

# Frontend
FRONTEND_URL=https://your-app.vercel.app

# Build
NODE_OPTIONS=--max-old-space-size=4096

# App
VITE_APP_TITLE=Emtelaak - Fractional Real Estate
VITE_APP_LOGO=/logo.png
```

---

## 🆘 Need Help?

- **Full Guide:** See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **Email Setup:** See `EMAIL_SERVICE_SETUP.md` for SendGrid configuration
- **Troubleshooting:** Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`

---

## ✅ Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create TiDB Cloud cluster
- [ ] Get database connection string
- [ ] Create `emtelaak` database
- [ ] Sign up for Vercel
- [ ] Import GitHub repository
- [ ] Add all environment variables
- [ ] Deploy to Vercel
- [ ] Run database migrations
- [ ] Update FRONTEND_URL
- [ ] Redeploy
- [ ] Test registration
- [ ] Test login
- [ ] Test profile picture upload
- [ ] Test password reset
- [ ] 🎉 Launch!

---

**Estimated Total Time:** 45 minutes

**Your platform will be live at:** `https://your-app.vercel.app`

Good luck! 🚀
