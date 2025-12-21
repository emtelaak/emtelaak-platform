# Fix "Invalid URL" Error - Vercel Deployment

## Error Details

**Error:** `TypeError: Invalid URL`  
**Location:** Admin bundle (admin-B30WTgK4.js)  
**Cause:** Missing or incorrectly formatted environment variable(s)

---

## Root Cause

The "Invalid URL" error typically occurs when:
1. **Missing `FRONTEND_URL`** environment variable
2. **Missing `VITE_FRONTEND_FORGE_API_URL`** environment variable
3. **Incorrectly formatted URL** (missing `https://` or `http://`)
4. **Empty string** instead of actual URL

---

## Quick Fix - Add Missing Environment Variables

### Step 1: Go to Vercel

1. Visit https://vercel.com
2. Select your `emtelaak-platform-test` project
3. Go to **Settings** → **Environment Variables**

### Step 2: Check and Add These Variables

#### Required Frontend Variables

**FRONTEND_URL**
```
Name: FRONTEND_URL
Value: https://emtelaak-platform-test-8agbi1bhl-waleeds-projects-d2462a75.vercel.app
Environment: Production, Preview, Development
```

**VITE_FRONTEND_FORGE_API_URL**
```
Name: VITE_FRONTEND_FORGE_API_URL
Value: https://api.manus.im
Environment: Production, Preview, Development
```

**VITE_FRONTEND_FORGE_API_KEY**
```
Name: VITE_FRONTEND_FORGE_API_KEY
Value: [Your Manus API Key - if you have one, otherwise leave empty]
Environment: Production, Preview, Development
```

**VITE_APP_TITLE**
```
Name: VITE_APP_TITLE
Value: Emtelaak - Fractional Real Estate
Environment: Production, Preview, Development
```

**VITE_APP_LOGO**
```
Name: VITE_APP_LOGO
Value: /logo.png
Environment: Production, Preview, Development
```

### Step 3: Verify All Required Variables

Make sure you have **ALL** these environment variables set:

#### Backend Variables
- [x] `DATABASE_URL` - Your TiDB connection string
- [x] `JWT_SECRET` - The generated secret (2784084526279ded1844e9be2a654dc1...)
- [x] `SMTP_HOST` - smtp.sendgrid.net
- [x] `SMTP_PORT` - 587
- [x] `SMTP_SECURE` - false
- [x] `SMTP_USER` - apikey
- [x] `SMTP_PASSWORD` - Your SendGrid API key
- [x] `SMTP_FROM_EMAIL` - noreply@emtelaak.com
- [x] `SMTP_FROM_NAME` - Emtelaak Platform

#### Frontend Variables (CRITICAL - These are likely missing!)
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `VITE_FRONTEND_FORGE_API_URL` - https://api.manus.im
- [ ] `VITE_APP_TITLE` - Emtelaak - Fractional Real Estate
- [ ] `VITE_APP_LOGO` - /logo.png

### Step 4: Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click **⋯** on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes
5. Test the site again

---

## Alternative Fix - Remove Manus Dependencies

If you don't need Manus API integration, you can remove those dependencies:

### Option A: Set Empty Values

```
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=
```

### Option B: Update Code to Handle Missing Variables

I can update the code to gracefully handle missing Manus variables if needed.

---

## Complete Environment Variables List

Here's the **complete list** of all environment variables you should have in Vercel:

```env
# Database
DATABASE_URL=mysql://7NZrqx5zGHHnoBb.root:MXzWNm6wesrPeBFP@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/emtelaak

# Authentication
JWT_SECRET=2784084526279ded1844e9be2a654dc1cae20a78e2be3678bb1c86cac9f656d8

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=[Your SendGrid API Key]
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform

# Frontend URLs
FRONTEND_URL=https://emtelaak-platform-test-8agbi1bhl-waleeds-projects-d2462a75.vercel.app
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=

# App Configuration
VITE_APP_TITLE=Emtelaak - Fractional Real Estate
VITE_APP_LOGO=/logo.png

# Build Configuration
NODE_OPTIONS=--max-old-space-size=4096
```

---

## Verification Steps

After redeploying:

1. **Check Vercel Logs:**
   - Go to Deployments → Click deployment → Functions tab
   - Look for any errors

2. **Test the Site:**
   - Visit your Vercel URL
   - Should load without errors
   - Try registering a new account

3. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Should see no "Invalid URL" errors

---

## If Error Persists

If you still see the error after adding all variables:

1. **Clear Vercel Cache:**
   - Go to Settings → General
   - Scroll to "Clear Cache"
   - Click "Clear Cache"
   - Redeploy

2. **Check for Typos:**
   - Verify all URLs start with `https://`
   - No trailing slashes
   - No spaces in values

3. **Contact Me:**
   - Share the exact error message
   - Share screenshot of your Vercel environment variables (hide sensitive values)
   - I'll help debug further

---

## Summary

**Most Likely Fix:**
Add `FRONTEND_URL` environment variable with your Vercel deployment URL.

**Steps:**
1. Add missing environment variables (especially `FRONTEND_URL`)
2. Redeploy on Vercel
3. Test the site

**Expected Result:**
Site loads without "Invalid URL" error and all features work correctly.
