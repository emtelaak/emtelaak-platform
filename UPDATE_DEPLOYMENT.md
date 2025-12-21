# Update Existing Deployment - Quick Guide

## What's New in This Update

✅ **Standard Authentication System**
- Email/password authentication (replaces Manus OAuth)
- JWT-based session management
- Secure password hashing with bcrypt

✅ **Password Reset Flow**
- Email-based password reset
- Secure token generation (1-hour expiry)
- Beautiful HTML email templates

✅ **Profile Picture Upload**
- S3 storage integration
- Image validation (type, size)
- Avatar with initials fallback

✅ **Image Cropping Tool**
- Zoom control (1x-3x)
- Rotation control (0°-360°)
- Real-time circular preview
- High-quality output

✅ **Email Service**
- Nodemailer integration
- SMTP support (SendGrid, Gmail, etc.)
- Welcome emails
- Password reset emails

---

## 3-Step Update Process

### Step 1: Push Code to GitHub (2 minutes)

Your code is already committed. You just need to push it.

**Using GitHub Desktop:**
1. Open GitHub Desktop
2. Select `emtelaak-platform-test` repository
3. Click "Push origin" or "Push to GitHub"

**Using Command Line with Personal Access Token:**
```bash
cd /home/ubuntu/emtelaak-platform

# Push to GitHub (you'll be prompted for username and token)
git push github main
```

**Using Command Line with SSH:**
```bash
cd /home/ubuntu/emtelaak-platform

# If you have SSH key set up
git push github main
```

**Verify Push:**
- Go to https://github.com/emtelaak/emtelaak-platform-test
- Check that latest commit is visible
- Should see commit message: "feat: Add standard authentication, profile management, and image cropping"

---

### Step 2: Update Vercel Environment Variables (5 minutes)

**New Environment Variables Required:**

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Select your `emtelaak-platform` project
   - Go to **Settings** → **Environment Variables**

2. **Add/Update These Variables:**

#### JWT Secret (NEW - Required)
```
Name: JWT_SECRET
Value: [Generate using command below]
Environment: Production, Preview, Development
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as the value.

#### Email Configuration (NEW - Required for password reset)
```
Name: SMTP_HOST
Value: smtp.sendgrid.net
Environment: Production, Preview, Development

Name: SMTP_PORT
Value: 587
Environment: Production, Preview, Development

Name: SMTP_SECURE
Value: false
Environment: Production, Preview, Development

Name: SMTP_USER
Value: apikey
Environment: Production, Preview, Development

Name: SMTP_PASSWORD
Value: SG.your-sendgrid-api-key-here
Environment: Production, Preview, Development

Name: SMTP_FROM_EMAIL
Value: noreply@emtelaak.com
Environment: Production, Preview, Development

Name: SMTP_FROM_NAME
Value: Emtelaak Platform
Environment: Production, Preview, Development
```

**To get SendGrid API Key:**
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to Settings → API Keys
3. Create API Key with "Mail Send" permissions
4. Copy the key (starts with `SG.`)

#### Frontend URL (UPDATE - if changed)
```
Name: FRONTEND_URL
Value: https://your-actual-vercel-url.vercel.app
Environment: Production, Preview, Development
```

**Note:** If you already have `DATABASE_URL` and other variables, keep them as is.

3. **Save All Variables**

---

### Step 3: Run Database Migrations (3 minutes)

The new authentication system requires database schema updates.

**Option A: From Your Local Machine**

```bash
# Set your TiDB connection string
export DATABASE_URL="mysql://username:password@gateway.tidbcloud.com:4000/emtelaak?ssl={\"rejectUnauthorized\":true}"

# Navigate to project
cd /path/to/emtelaak-platform

# Install dependencies (if not already)
pnpm install

# Run migrations
pnpm db:push
```

**Option B: From Sandbox**

```bash
# Set your TiDB connection string
export DATABASE_URL="mysql://username:password@gateway.tidbcloud.com:4000/emtelaak?ssl={\"rejectUnauthorized\":true}"

# Navigate to project
cd /home/ubuntu/emtelaak-platform

# Run migrations
pnpm db:push
```

**What This Does:**
- Adds `password` field to `users` table
- Creates `password_reset_tokens` table
- Updates `user_profiles` table (if needed)
- No data loss - only adds new fields

**Expected Output:**
```
✓ Pushing schema changes to database
✓ Schema synchronized successfully
```

---

### Step 4: Redeploy on Vercel (1 minute)

After updating environment variables:

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to "Deployments" tab**
4. **Click the ⋯ menu** on the latest deployment
5. **Click "Redeploy"**
6. **Wait 2-3 minutes** for deployment to complete

**Or Automatic Redeploy:**
- Vercel will automatically redeploy when you push to GitHub
- Just wait for the deployment to finish

---

## Verification Checklist

After deployment, test these features:

### ✅ Authentication System

1. **Visit your site:** `https://your-app.vercel.app`

2. **Test Registration:**
   - Click "Register"
   - Fill in: Name, Email, Password
   - Submit
   - Check email for welcome message
   - Verify account created

3. **Test Login:**
   - Click "Login"
   - Enter email and password
   - Verify successful login
   - Verify redirected to homepage/dashboard

4. **Test Logout:**
   - Click logout button
   - Verify redirected to login page

### ✅ Password Reset

1. **Click "Forgot Password"** on login page
2. **Enter email** and submit
3. **Check email** for password reset link
4. **Click reset link** in email
5. **Enter new password** (with strength indicator)
6. **Submit** and verify redirect to login
7. **Login with new password**

### ✅ Profile Picture Upload

1. **Go to Profile page** (`/profile`)
2. **Click camera icon** on avatar
3. **Select an image** (JPG, PNG, or GIF)
4. **Verify cropper modal opens**
5. **Adjust crop, zoom, rotation**
6. **Click "Apply Crop"**
7. **Verify upload succeeds**
8. **Verify image displays** on profile

### ✅ Image Cropping

1. **Upload a new picture**
2. **Test zoom slider** (1x - 3x)
3. **Test rotation slider** (0° - 360°)
4. **Drag crop area** to reposition
5. **Verify circular preview** updates
6. **Apply crop** and verify result

---

## What Changed in the Database

### New Tables

**`password_reset_tokens`**
```sql
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Updated Tables

**`users` table - Added field:**
- `password` VARCHAR(255) - Hashed password

**`user_profiles` table - Already has:**
- `profilePicture` TEXT - S3 URL of profile picture

---

## Environment Variables Summary

### Required (Must Add)
- `JWT_SECRET` - For authentication tokens
- `SMTP_HOST` - Email server
- `SMTP_PORT` - Email server port
- `SMTP_SECURE` - TLS setting
- `SMTP_USER` - Email username
- `SMTP_PASSWORD` - Email password
- `SMTP_FROM_EMAIL` - Sender email
- `SMTP_FROM_NAME` - Sender name

### Already Have (Keep As Is)
- `DATABASE_URL` - TiDB connection
- `FRONTEND_URL` - Your Vercel URL
- `NODE_OPTIONS` - Build memory limit
- `VITE_APP_TITLE` - App title
- `VITE_APP_LOGO` - Logo URL

### Removed (No Longer Needed)
- `OAUTH_SERVER_URL` - Manus OAuth (replaced)
- `VITE_OAUTH_PORTAL_URL` - Manus OAuth (replaced)
- `OWNER_OPEN_ID` - Manus OAuth (replaced)
- `OWNER_NAME` - Manus OAuth (replaced)

You can delete these old Manus OAuth variables from Vercel.

---

## Troubleshooting

### "Build Failed" on Vercel

**Check:**
1. Verify `NODE_OPTIONS=--max-old-space-size=4096` is set
2. Check build logs for specific error
3. Ensure all dependencies are in `package.json`

**Solution:**
- Clear Vercel cache and redeploy
- Check for TypeScript errors in logs

---

### "Database Connection Failed"

**Check:**
1. Verify `DATABASE_URL` is correct
2. Check TiDB cluster is running
3. Verify IP allowlist includes Vercel IPs (`0.0.0.0/0`)

**Solution:**
- Test connection from local machine
- Check TiDB Cloud dashboard for cluster status

---

### "Email Not Sending"

**Check:**
1. Verify SMTP credentials are correct
2. Check SendGrid API key is active
3. Verify `SMTP_FROM_EMAIL` is verified in SendGrid

**Solution:**
- Test SMTP connection locally
- Check Vercel function logs for errors
- Verify SendGrid account is active

---

### "Profile Picture Upload Failed"

**Check:**
1. Verify S3 credentials are configured
2. Check browser console for errors
3. Verify file size is under 5MB

**Solution:**
- Check Vercel function logs
- Verify S3 bucket exists and is accessible
- Test with smaller image file

---

## Quick Commands Reference

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Push to GitHub
cd /home/ubuntu/emtelaak-platform
git push github main

# Run Database Migrations
export DATABASE_URL="your-tidb-connection-string"
pnpm db:push

# Test Locally
pnpm dev

# Build for Production
pnpm build
```

---

## Timeline

- **Step 1 (Push to GitHub):** 2 minutes
- **Step 2 (Update Vercel Env):** 5 minutes
- **Step 3 (Database Migration):** 3 minutes
- **Step 4 (Redeploy):** 1 minute
- **Verification:** 10 minutes

**Total Time:** ~20 minutes

---

## Support

If you encounter issues:

1. **Check Vercel Logs:**
   - Project → Deployments → Click deployment → Functions tab

2. **Check TiDB Logs:**
   - TiDB Cloud → Cluster → Monitoring

3. **Check Documentation:**
   - `DEPLOYMENT_GUIDE.md` - Full deployment guide
   - `EMAIL_SERVICE_SETUP.md` - Email configuration
   - `PASSWORD_RESET_FLOW.md` - Password reset details

---

## Summary

✅ **New Features Added:**
- Standard authentication (email/password)
- Password reset with email
- Profile picture upload
- Image cropping tool
- Email service integration

✅ **What You Need to Do:**
1. Push code to GitHub
2. Add new environment variables to Vercel
3. Run database migrations
4. Redeploy on Vercel
5. Test all features

✅ **Result:**
- Production-ready authentication system
- Secure password management
- Professional profile picture handling
- Beautiful email notifications

**Your updated platform will be live at:** `https://your-app.vercel.app`

🎉 **Ready to update!**
