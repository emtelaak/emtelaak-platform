# Emtelaak Platform - Production Deployment Guide

## Overview

This guide walks you through deploying the Emtelaak fractional real estate platform to production using:

- **GitHub** - Source code repository
- **Vercel** - Frontend and backend hosting
- **TiDB Cloud** - MySQL-compatible serverless database

**Estimated Time:** 30-45 minutes

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] TiDB Cloud account (sign up at https://tidbcloud.com)
- [ ] Git installed on your local machine
- [ ] Access to your project files

---

## Part 1: GitHub Repository Setup

### Step 1: Create GitHub Repository

1. **Go to GitHub**
   - Visit https://github.com
   - Click the **+** icon in the top right
   - Select **New repository**

2. **Configure Repository**
   - **Repository name:** `emtelaak-platform` (or your preferred name)
   - **Description:** "Emtelaak - Fractional Real Estate Investment Platform"
   - **Visibility:** Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click **Create repository**

3. **Copy Repository URL**
   - You'll see a URL like: `https://github.com/YOUR_USERNAME/emtelaak-platform.git`
   - Keep this handy for the next step

### Step 2: Initialize Git in Your Project

Open terminal in your project directory and run:

```bash
# Navigate to project directory
cd /path/to/emtelaak-platform

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Emtelaak platform with authentication, profile, and image cropping"

# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/emtelaak-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace** `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your project files
3. Verify these key files are present:
   - `package.json`
   - `client/` directory
   - `server/` directory
   - `drizzle/` directory
   - `.gitignore`

### Step 4: Set Up GitHub Secrets (Optional)

If you want to use GitHub Actions for CI/CD:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets (we'll use these later):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

---

## Part 2: TiDB Cloud Database Setup

### Step 1: Create TiDB Cloud Account

1. **Sign Up**
   - Visit https://tidbcloud.com
   - Click **Sign Up** or **Get Started Free**
   - Use GitHub, Google, or email to sign up
   - Verify your email

2. **Create Organization** (if prompted)
   - Organization name: Your company name or "Emtelaak"
   - Click **Create**

### Step 2: Create Serverless Cluster

1. **Create New Cluster**
   - Click **Create Cluster** or **+ New Cluster**
   - Select **Serverless** (free tier available)

2. **Configure Cluster**
   - **Cluster Name:** `emtelaak-production`
   - **Cloud Provider:** AWS (recommended) or GCP
   - **Region:** Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)
   - **Spending Limit:** Set to $0 for free tier or your budget
   - Click **Create**

3. **Wait for Cluster Creation**
   - Takes 1-3 minutes
   - Status will change from "Creating" to "Available"

### Step 3: Get Database Connection String

1. **Open Cluster**
   - Click on your cluster name (`emtelaak-production`)

2. **Get Connection Info**
   - Click **Connect** button
   - Select **General** connection type
   - Choose **MySQL CLI** or **Node.js** tab

3. **Copy Connection String**
   - You'll see something like:
   ```
   mysql://USERNAME.root:PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}
   ```

4. **Save Credentials**
   - **Host:** `gateway01.us-east-1.prod.aws.tidbcloud.com`
   - **Port:** `4000`
   - **Username:** `USERNAME.root`
   - **Password:** `PASSWORD` (shown once, save it!)
   - **Database:** `test` (we'll create our database)

### Step 4: Create Database

1. **Open SQL Editor**
   - In TiDB Cloud console, click **SQL Editor** or **Chat2Query**

2. **Create Database**
   ```sql
   CREATE DATABASE emtelaak;
   USE emtelaak;
   ```

3. **Verify Database Created**
   ```sql
   SHOW DATABASES;
   ```
   - You should see `emtelaak` in the list

### Step 5: Update Connection String

Update your connection string to use the new database:

```
mysql://USERNAME.root:PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/emtelaak?ssl={"rejectUnauthorized":true}
```

**Important:** Change `test` to `emtelaak` in the URL.

### Step 6: Configure IP Allowlist (if required)

1. **Go to Cluster Settings**
   - Click on cluster → **Settings** tab

2. **Add IP Addresses**
   - Click **IP Access List**
   - For Vercel deployment, add: `0.0.0.0/0` (allow all - Vercel uses dynamic IPs)
   - For production, restrict to specific IPs if possible

3. **Save Changes**

### Step 7: Run Database Migrations

From your local machine:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="mysql://USERNAME.root:PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/emtelaak?ssl={\"rejectUnauthorized\":true}"

# Run migrations
pnpm db:push
```

This will create all tables from your schema.

---

## Part 3: Vercel Deployment

### Step 1: Create Vercel Account

1. **Sign Up**
   - Visit https://vercel.com
   - Click **Sign Up**
   - **Use GitHub** to sign up (recommended for easy integration)
   - Authorize Vercel to access your GitHub account

### Step 2: Import GitHub Repository

1. **Create New Project**
   - Click **Add New...** → **Project**
   - Or visit https://vercel.com/new

2. **Import Repository**
   - Select **Import Git Repository**
   - Find `emtelaak-platform` in the list
   - Click **Import**

3. **Configure Project**
   - **Project Name:** `emtelaak-platform` (or your preferred name)
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `pnpm run build` (should auto-detect)
   - **Output Directory:** `dist` (should auto-detect)
   - **Install Command:** `pnpm install` (should auto-detect)

### Step 3: Configure Environment Variables

**Critical:** Add these environment variables before deploying.

1. **Click "Environment Variables"** (expand section)

2. **Add Required Variables:**

#### Database
```
DATABASE_URL
mysql://USERNAME.root:PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/emtelaak?ssl={"rejectUnauthorized":true}
```

#### Authentication
```
JWT_SECRET
your-super-secret-jwt-key-change-this-in-production
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Email (SMTP)
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

#### Frontend URL
```
FRONTEND_URL
https://emtelaak-platform.vercel.app
```

**Note:** Update this after deployment with your actual Vercel URL.

#### App Configuration
```
VITE_APP_TITLE
Emtelaak - Fractional Real Estate

VITE_APP_LOGO
/logo.png
```

#### Node Options (for build)
```
NODE_OPTIONS
--max-old-space-size=4096
```

3. **Select Environment**
   - For each variable, select: **Production**, **Preview**, **Development**
   - Or just **Production** for secrets

4. **Click "Add"** for each variable

### Step 4: Deploy

1. **Click "Deploy"**
   - Vercel will start building your project
   - This takes 3-5 minutes

2. **Monitor Build**
   - Watch the build logs
   - Look for any errors

3. **Wait for Success**
   - You'll see "Congratulations!" when done
   - You'll get a URL like: `https://emtelaak-platform.vercel.app`

### Step 5: Update Frontend URL

1. **Copy Your Vercel URL**
   - Example: `https://emtelaak-platform.vercel.app`

2. **Update Environment Variable**
   - Go to Project **Settings** → **Environment Variables**
   - Find `FRONTEND_URL`
   - Click **Edit**
   - Update to your actual Vercel URL
   - Save

3. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**
   - Or push a new commit to GitHub (auto-deploys)

### Step 6: Configure Custom Domain (Optional)

1. **Add Domain**
   - Go to Project **Settings** → **Domains**
   - Click **Add**
   - Enter your domain: `emtelaak.com`

2. **Configure DNS**
   - Add DNS records as shown by Vercel:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Wait for Verification**
   - Takes 5-60 minutes
   - Vercel will auto-issue SSL certificate

4. **Update Environment Variables**
   - Update `FRONTEND_URL` to `https://emtelaak.com`
   - Redeploy

---

## Part 4: Post-Deployment Configuration

### Step 1: Test Authentication

1. **Visit Your Site**
   - Go to your Vercel URL

2. **Register Test Account**
   - Click **Register**
   - Fill in details
   - Submit

3. **Check Email**
   - Verify welcome email arrives
   - Check spam folder if not in inbox

4. **Log In**
   - Use registered credentials
   - Verify login works

### Step 2: Test Profile Picture Upload

1. **Go to Profile Page**
   - Navigate to `/profile`

2. **Upload Picture**
   - Click camera icon
   - Select image
   - Crop image
   - Verify upload succeeds

3. **Check S3 Storage**
   - Verify image appears
   - Verify URL is accessible

### Step 3: Test Password Reset

1. **Log Out**

2. **Click "Forgot Password"**
   - Enter email
   - Submit

3. **Check Email**
   - Verify reset email arrives
   - Click reset link

4. **Reset Password**
   - Enter new password
   - Submit
   - Verify redirect to login

5. **Log In**
   - Use new password
   - Verify login works

### Step 4: Monitor Errors

1. **Check Vercel Logs**
   - Go to Project → **Deployments** → Click deployment
   - Click **Functions** tab
   - Look for errors

2. **Check TiDB Cloud Monitoring**
   - Go to cluster → **Monitoring**
   - Check query performance
   - Check connection count

3. **Set Up Error Tracking** (Optional)
   - Integrate Sentry: https://sentry.io
   - Add to Vercel environment variables

---

## Part 5: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Start a new build
3. Deploy to production
4. Update your live site

### Preview Deployments

For branches other than `main`:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

Vercel will:
1. Create a preview deployment
2. Give you a unique URL
3. You can test before merging to `main`

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | TiDB Cloud connection string | `mysql://user:pass@host:4000/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `abc123...` (32+ chars) |
| `FRONTEND_URL` | Your Vercel URL | `https://emtelaak.vercel.app` |
| `NODE_OPTIONS` | Node memory limit | `--max-old-space-size=4096` |

### Email Variables (Required for password reset)

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | `apikey` |
| `SMTP_PASSWORD` | SMTP password | `SG.xxx` |
| `SMTP_FROM_EMAIL` | From email address | `noreply@emtelaak.com` |
| `SMTP_FROM_NAME` | From name | `Emtelaak Platform` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_TITLE` | App title | `Emtelaak` |
| `VITE_APP_LOGO` | Logo URL | `/logo.png` |

---

## Troubleshooting

### Build Fails on Vercel

**Error:** "JavaScript heap out of memory"

**Solution:** Add `NODE_OPTIONS=--max-old-space-size=4096` to environment variables

---

**Error:** "Cannot find module 'xyz'"

**Solution:** 
1. Check `package.json` includes the module
2. Ensure `pnpm install` runs before build
3. Clear Vercel cache and redeploy

---

### Database Connection Fails

**Error:** "connect ETIMEDOUT"

**Solution:**
1. Check TiDB Cloud cluster is running
2. Verify IP allowlist includes `0.0.0.0/0`
3. Check `DATABASE_URL` is correct
4. Ensure SSL is enabled in connection string

---

**Error:** "Access denied for user"

**Solution:**
1. Verify username and password in `DATABASE_URL`
2. Check user has permissions on database
3. Ensure database name is correct (`emtelaak`, not `test`)

---

### Email Not Sending

**Error:** "Failed to send email"

**Solution:**
1. Check SMTP credentials are correct
2. Verify SendGrid API key is active
3. Check `SMTP_FROM_EMAIL` is verified in SendGrid
4. Look at Vercel function logs for detailed error

---

### Profile Picture Upload Fails

**Error:** "Upload failed"

**Solution:**
1. Check S3 credentials are configured
2. Verify S3 bucket exists and is accessible
3. Check CORS settings on S3 bucket
4. Ensure file size is under 5MB

---

## Security Checklist

Before going live, ensure:

- [ ] `JWT_SECRET` is a strong, random string (32+ characters)
- [ ] `DATABASE_URL` password is strong and unique
- [ ] SMTP credentials are secure and not exposed
- [ ] Environment variables are set to "Production" only (not in git)
- [ ] `.env` files are in `.gitignore`
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] Database has proper access controls
- [ ] Rate limiting is configured (if needed)
- [ ] Error messages don't expose sensitive info

---

## Performance Optimization

### Enable Caching

Vercel automatically caches static assets. To optimize:

1. **Add Cache Headers** (in `vercel.json`):
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Enable Compression

Vercel automatically compresses responses. No action needed.

### Database Optimization

1. **Add Indexes** to frequently queried columns
2. **Use Connection Pooling** (TiDB Cloud handles this)
3. **Monitor Slow Queries** in TiDB Cloud dashboard

---

## Monitoring and Analytics

### Vercel Analytics

1. **Enable Analytics**
   - Go to Project → **Analytics**
   - Click **Enable**
   - Free tier: 100k requests/month

2. **View Metrics**
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### TiDB Cloud Monitoring

1. **View Dashboard**
   - Go to Cluster → **Monitoring**

2. **Key Metrics**
   - QPS (Queries Per Second)
   - Connection count
   - Storage usage
   - Query latency

### Error Tracking (Optional)

**Sentry Integration:**

1. **Sign up** at https://sentry.io
2. **Create project** for Node.js
3. **Get DSN** (Data Source Name)
4. **Add to Vercel** environment variables:
   ```
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
5. **Install Sentry:**
   ```bash
   pnpm add @sentry/node @sentry/tracing
   ```

---

## Backup and Recovery

### Database Backups

TiDB Cloud automatically backs up your database:

1. **View Backups**
   - Go to Cluster → **Backup**

2. **Restore from Backup**
   - Click **Restore** on a backup
   - Choose restore point
   - Confirm

### Code Backups

GitHub automatically stores your code:

1. **View Commits**
   - Go to repository → **Commits**

2. **Revert to Previous Version**
   ```bash
   git checkout <commit-hash>
   git push -f origin main
   ```

---

## Scaling Considerations

### Vercel Scaling

Vercel automatically scales:
- **Serverless Functions:** Auto-scale based on traffic
- **Edge Network:** Global CDN
- **No configuration needed**

### Database Scaling

TiDB Cloud Serverless auto-scales:
- **Storage:** Grows automatically
- **Compute:** Scales based on usage
- **Monitor usage** in dashboard

### Upgrade to Paid Plan

When you need more:

**Vercel Pro:** $20/month
- More bandwidth
- More build minutes
- Team features

**TiDB Cloud Dedicated:** Starting at $0.50/hour
- Dedicated resources
- Better performance
- More storage

---

## Next Steps After Deployment

1. **Set Up Custom Domain**
   - Register domain (e.g., emtelaak.com)
   - Configure DNS
   - Add to Vercel

2. **Configure Email Domain**
   - Set up SPF, DKIM, DMARC records
   - Verify domain in SendGrid
   - Update `SMTP_FROM_EMAIL`

3. **Add Analytics**
   - Google Analytics
   - Vercel Analytics
   - Mixpanel or Amplitude

4. **Set Up Monitoring**
   - Sentry for errors
   - LogRocket for session replay
   - Uptime monitoring (UptimeRobot)

5. **Enable CI/CD**
   - GitHub Actions for tests
   - Automated deployments
   - Code quality checks

6. **Add Testing**
   - Unit tests (Vitest)
   - E2E tests (Playwright)
   - Integration tests

---

## Support Resources

### Documentation

- **Vercel Docs:** https://vercel.com/docs
- **TiDB Cloud Docs:** https://docs.pingcap.com/tidbcloud
- **GitHub Docs:** https://docs.github.com

### Community

- **Vercel Discord:** https://vercel.com/discord
- **TiDB Community:** https://ask.pingcap.com
- **GitHub Community:** https://github.community

### Support

- **Vercel Support:** support@vercel.com
- **TiDB Support:** support@pingcap.com
- **GitHub Support:** https://support.github.com

---

## Summary

You've successfully deployed the Emtelaak platform to production! 🎉

**What you've accomplished:**

✅ Pushed code to GitHub  
✅ Created TiDB Cloud database  
✅ Deployed to Vercel  
✅ Configured environment variables  
✅ Set up continuous deployment  
✅ Tested core features  

**Your platform is now live at:** `https://your-app.vercel.app`

**Next steps:**
1. Add custom domain
2. Configure email domain
3. Set up monitoring
4. Add analytics
5. Invite users!

---

## Quick Reference Commands

```bash
# Push to GitHub
git add .
git commit -m "Your message"
git push origin main

# Run migrations
export DATABASE_URL="your-tidb-url"
pnpm db:push

# Test locally
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

**Need help?** Check the troubleshooting section or reach out to support.

**Good luck with your launch! 🚀**
