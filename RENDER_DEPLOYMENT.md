# Deploy Emtelaak Platform to Render

This guide will help you deploy your Emtelaak platform to Render.com with full Node.js server support.

## Why Render?

✅ **Native Node.js support** - Runs your Express server without modifications  
✅ **Free tier available** - Perfect for testing and development  
✅ **Auto-deploys from GitHub** - Push code and it deploys automatically  
✅ **Built-in SSL** - Free HTTPS certificates  
✅ **Easy environment variables** - Simple dashboard configuration  

---

## Step 1: Create Render Account

1. Go to https://render.com
2. Click "Get Started" or "Sign Up"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## Step 2: Create New Web Service

1. **Click "New +"** in the top right
2. **Select "Web Service"**
3. **Connect your GitHub repository:**
   - Click "Connect account" if not connected
   - Find and select `emtelaak/emtelaak-platform-test`
   - Click "Connect"

---

## Step 3: Configure Service

Fill in the following settings:

### Basic Settings
- **Name:** `emtelaak-platform`
- **Region:** Oregon (US West) or closest to you
- **Branch:** `main`
- **Runtime:** Node
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`

### Plan
- **Instance Type:** Free (or Starter if you need more resources)

---

## Step 4: Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

### Required Variables

```
DATABASE_URL
mysql://3mz38cEUyZ5ARDW.root:1dNEsUY91YAHQ0tT@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/emtelaak

JWT_SECRET
2784084526279ded1844e9be2a654dc1cae20a78e2be3678bb1c86cac9f656d8

SMTP_HOST
smtp.sendgrid.net

SMTP_PORT
587

SMTP_SECURE
false

SMTP_USER
apikey

SMTP_PASSWORD
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

SMTP_FROM_EMAIL
noreply@emtelaak.com

SMTP_FROM_NAME
Emtelaak Platform

NODE_ENV
production

VITE_APP_TITLE
Emtelaak - Fractional Real Estate

VITE_APP_LOGO
/logo.png
```

### Auto-Generated Variable

After creating the service, Render will give you a URL like:
```
https://emtelaak-platform.onrender.com
```

Add this as:
```
FRONTEND_URL
https://emtelaak-platform.onrender.com
```

---

## Step 5: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (first deploy takes 5-10 minutes)
3. **Monitor the logs** in the dashboard
4. **Look for:** "Server running on http://localhost:3000/"

---

## Step 6: Update FRONTEND_URL

1. Once deployed, copy your Render URL (e.g., `https://emtelaak-platform.onrender.com`)
2. Go to **Environment** tab in Render dashboard
3. Find `FRONTEND_URL` variable
4. Update it with your actual Render URL
5. Click "Save Changes"
6. Service will automatically redeploy

---

## Step 7: Test Your Deployment

Visit your Render URL and test:

✅ Homepage loads  
✅ Register a new account  
✅ Check email for welcome message  
✅ Login with credentials  
✅ Upload profile picture  
✅ Test password reset  

---

## Step 8: Connect Custom Domain (Optional)

1. Go to **Settings** tab in Render
2. Scroll to "Custom Domain"
3. Click "Add Custom Domain"
4. Enter: `emtelaak.co` or `www.emtelaak.co`
5. Follow DNS configuration instructions
6. Update `FRONTEND_URL` to your custom domain

---

## Troubleshooting

### Build Fails

**Check logs** in Render dashboard for errors. Common issues:
- Missing dependencies: Run `pnpm install` locally first
- Build timeout: Upgrade to paid plan for more resources

### Database Connection Fails

- Verify `DATABASE_URL` is correct
- Check TiDB Cloud IP allowlist (add `0.0.0.0/0` for Render)

### Environment Variables Not Working

- Make sure all variables are added
- Check for typos in variable names
- Redeploy after adding variables

### Email Not Sending

- Verify SendGrid API key is correct
- Check SendGrid account is verified
- Test with a simple registration

---

## Continuous Deployment

Once set up, Render automatically deploys when you push to GitHub:

```bash
git add -A
git commit -m "Update feature"
git push origin main
```

Render detects the push and deploys automatically!

---

## Monitoring & Logs

- **Logs:** Click "Logs" tab to see real-time server logs
- **Metrics:** View CPU, memory, and request metrics
- **Events:** See deployment history and status

---

## Cost

- **Free Tier:** 750 hours/month, sleeps after 15min inactivity
- **Starter:** $7/month, always on, more resources
- **Pro:** $25/month, high performance

Free tier is perfect for testing!

---

## Next Steps

After successful deployment:

1. ✅ Run the SQL script to create your admin account in TiDB
2. ✅ Test all authentication features
3. ✅ Configure custom domain if desired
4. ✅ Set up monitoring and alerts
5. ✅ Consider upgrading to paid plan for production

---

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Emtelaak Support: Contact your development team

---

**Ready to deploy? Follow the steps above and your platform will be live in 10 minutes!** 🚀
