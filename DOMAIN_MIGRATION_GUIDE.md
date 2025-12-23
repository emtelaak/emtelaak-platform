# Domain Migration Guide: emtelaak.co → emtelaak.com

This guide documents all the changes needed to migrate from emtelaak.co to emtelaak.com.

## Code Changes (Completed)

All code files have been updated to use emtelaak.com. The following files were modified:

| File | Changes |
|------|---------|
| `client/src/pages/AdminPlatformSettings.tsx` | Default invitation email changed to noreply@emtelaak.com |
| `server/routes/accessRequests.ts` | Default URLs changed to emtelaak.com |
| `server/routes/propertyInterests.ts` | Default URLs and emails changed to emtelaak.com |
| `server/_core/cookies.ts` | Cookie domain comments updated |
| `PRODUCTION_STATUS_REPORT.md` | Domain references updated |
| `AUTHENTICATION_TESTING_GUIDE.md` | URLs updated |
| `EMAIL_SERVICE_SETUP.md` | URLs updated |
| `PASSWORD_RESET_FLOW.md` | URLs updated |
| `todo.md` | References updated |

## Database Changes (Completed)

The following database records were updated:

| Table | Field | Old Value | New Value |
|-------|-------|-----------|-----------|
| platform_settings | invitation_email | noreply@emtelaak.co | noreply@emtelaak.com |

## Render Configuration (Manual Steps Required)

### 1. Add Custom Domain in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your web service (emtelaak-platform)
3. Navigate to **Settings** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter `emtelaak.com`
6. Also add `www.emtelaak.com` if needed
7. Render will provide DNS configuration instructions

### 2. Update Environment Variables in Render

Update the following environment variables:

| Variable | New Value |
|----------|-----------|
| `VITE_APP_URL` | `https://emtelaak.com` |
| `VITE_OAUTH_PORTAL_URL` | `https://emtelaak.com` |
| `APP_URL` | `https://emtelaak.com` |

### 3. Update CORS Settings (if applicable)

If you have CORS restrictions, update:

| Variable | New Value |
|----------|-----------|
| `CORS_ORIGIN` | `https://emtelaak.com` |

## DNS Configuration (Manual Steps Required)

Configure your DNS at your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

### Option A: Using CNAME (Recommended)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | emtelaak-platform.onrender.com | 3600 |
| CNAME | @ | emtelaak-platform.onrender.com | 3600 |

Note: Some registrars don't support CNAME for root domain (@). In that case, use Option B.

### Option B: Using A Record + CNAME

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | (Render's IP - check Render dashboard) | 3600 |
| CNAME | www | emtelaak-platform.onrender.com | 3600 |

## Email Configuration (Manual Steps Required)

### 1. Update SendGrid/Email Provider

If using SendGrid or another email provider:
1. Add and verify `emtelaak.com` domain
2. Update DNS records for email authentication (SPF, DKIM, DMARC)
3. Update sender email addresses to use @emtelaak.com

### 2. DNS Records for Email

Add these DNS records for email deliverability:

| Type | Name | Value |
|------|------|-------|
| TXT | @ | v=spf1 include:sendgrid.net ~all |
| CNAME | em1234 | u1234567.wl123.sendgrid.net (from SendGrid) |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:admin@emtelaak.com |

## SSL Certificate

Render automatically provisions SSL certificates for custom domains. After adding the domain:
1. Wait for DNS propagation (can take up to 48 hours)
2. Render will automatically issue an SSL certificate
3. Verify HTTPS works at https://emtelaak.com

## Post-Migration Checklist

- [ ] Add emtelaak.com to Render custom domains
- [ ] Update Render environment variables
- [ ] Configure DNS records at registrar
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate is active
- [ ] Test all authentication flows
- [ ] Test email sending/receiving
- [ ] Update OAuth provider redirect URIs (if using Google/Facebook login)
- [ ] Update any third-party integrations with new domain
- [ ] Set up 301 redirect from emtelaak.co to emtelaak.com (optional)

## Rollback Plan

If issues occur, you can rollback by:
1. Reverting the code changes: `git revert HEAD~1`
2. Updating database: `UPDATE platform_settings SET settingValue = 'noreply@emtelaak.co' WHERE settingKey = 'invitation_email';`
3. Removing the custom domain from Render
4. Pointing DNS back to original configuration
