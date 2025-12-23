# Email Service Setup Guide

## Overview

The Emtelaak platform uses **Nodemailer** with SMTP to send transactional emails including password resets, welcome emails, and invoices. This guide explains how to configure the email service for different providers.

## Implementation Date

January 10, 2025

---

## Features

The email service supports:

✅ **Password Reset Emails** - Secure reset links with 1-hour expiry  
✅ **Welcome Emails** - Sent automatically on registration  
✅ **Invoice Emails** - Investment confirmation and payment details  
✅ **Custom Email Templates** - Database-driven templates with variable replacement  
✅ **Multiple SMTP Providers** - Gmail, SendGrid, AWS SES, Mailgun, etc.  
✅ **Graceful Fallback** - Logs to console if SMTP not configured  
✅ **HTML + Plain Text** - Responsive HTML with automatic plain text generation  

---

## Quick Start

### 1. Choose an Email Provider

**Recommended for Production:**
- **SendGrid** - 100 free emails/day, easy setup
- **AWS SES** - $0.10 per 1,000 emails, high deliverability
- **Mailgun** - 5,000 free emails/month

**For Development/Testing:**
- **Gmail** - Free, easy to test (with app password)
- **Mailtrap** - Email testing sandbox

### 2. Set Environment Variables

Add these variables to your `.env` file or Vercel environment variables:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform

# Frontend URL for email links
FRONTEND_URL=https://emtelaak.com
```

### 3. Test Configuration

The email service will automatically log warnings if SMTP is not configured. Check your server logs after deployment.

---

## Provider-Specific Setup

### Gmail (Development/Testing)

**Step 1: Enable 2-Factor Authentication**
1. Go to Google Account settings
2. Security → 2-Step Verification
3. Enable 2FA

**Step 2: Generate App Password**
1. Go to Security → App passwords
2. Select "Mail" and your device
3. Copy the 16-character password

**Step 3: Configure Environment Variables**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App password from step 2
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Emtelaak Platform
FRONTEND_URL=http://localhost:3000
```

**Limitations:**
- 500 emails per day limit
- May be flagged as spam
- Not recommended for production

---

### SendGrid (Recommended for Production)

**Step 1: Create SendGrid Account**
1. Sign up at https://sendgrid.com
2. Verify your email address
3. Complete sender verification

**Step 2: Create API Key**
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Select "Full Access"
4. Copy the API key

**Step 3: Configure Environment Variables**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey  # Literally the word "apikey"
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx  # Your API key from step 2
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform
FRONTEND_URL=https://emtelaak.com
```

**Step 4: Verify Sender Domain (Optional but Recommended)**
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender" or "Authenticate Your Domain"
3. Follow the verification steps
4. Use verified email in `SMTP_FROM_EMAIL`

**Benefits:**
- 100 emails/day free tier
- High deliverability
- Email analytics
- Easy setup

---

### AWS SES (Best for High Volume)

**Step 1: Set Up AWS SES**
1. Go to AWS SES Console
2. Verify your domain or email address
3. Request production access (starts in sandbox mode)

**Step 2: Create SMTP Credentials**
1. Go to SMTP Settings
2. Click "Create My SMTP Credentials"
3. Download credentials

**Step 3: Configure Environment Variables**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Your region
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAXXXXXXXXXXXXXXXX  # From SMTP credentials
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # From SMTP credentials
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform
FRONTEND_URL=https://emtelaak.com
```

**Benefits:**
- $0.10 per 1,000 emails
- Highest deliverability
- Scales to millions of emails
- Detailed analytics

**Note:** You must verify your domain and request production access to send to any email address.

---

### Mailgun

**Step 1: Create Mailgun Account**
1. Sign up at https://www.mailgun.com
2. Verify your email
3. Add and verify your domain

**Step 2: Get SMTP Credentials**
1. Go to Sending → Domain Settings
2. Click on your domain
3. Find SMTP credentials section

**Step 3: Configure Environment Variables**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.com  # From Mailgun dashboard
SMTP_PASSWORD=xxxxxxxxxxxxxxxx  # From Mailgun dashboard
SMTP_FROM_EMAIL=noreply@your-domain.com
SMTP_FROM_NAME=Emtelaak Platform
FRONTEND_URL=https://emtelaak.com
```

**Benefits:**
- 5,000 free emails/month
- Good deliverability
- Email validation API
- Detailed analytics

---

### Mailtrap (Testing Only)

**Perfect for development - catches all emails without sending them.**

**Step 1: Create Mailtrap Account**
1. Sign up at https://mailtrap.io
2. Create an inbox

**Step 2: Get SMTP Credentials**
1. Go to your inbox
2. Click "Show Credentials"
3. Copy SMTP settings

**Step 3: Configure Environment Variables**
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=xxxxxxxxxxxxxxxx  # From Mailtrap
SMTP_PASSWORD=xxxxxxxxxxxxxxxx  # From Mailtrap
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform
FRONTEND_URL=http://localhost:3000
```

**Benefits:**
- Free for development
- View all sent emails in web interface
- Test spam score
- No emails actually sent

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | Yes | `587` | SMTP server port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | No | `false` | Use SSL (true for port 465, false for 587) |
| `SMTP_USER` | Yes | - | SMTP username or API key |
| `SMTP_PASSWORD` | Yes | - | SMTP password or API secret |
| `SMTP_FROM_EMAIL` | No | Value of `SMTP_USER` | Sender email address |
| `SMTP_FROM_NAME` | No | `Emtelaak Platform` | Sender display name |
| `FRONTEND_URL` | No | `http://localhost:3000` | Base URL for email links |

---

## Email Types

### 1. Password Reset Email

**Triggered:** When user requests password reset  
**Template:** `server/_core/emailService.ts` → `generatePasswordResetEmail()`  
**Variables:**
- `userName` - User's name
- `resetLink` - Password reset URL with token

**Features:**
- Secure reset link with 1-hour expiry
- Clear security warnings
- Responsive design
- Emtelaak branding

**Example:**
```typescript
await sendPasswordResetEmail({
  to: "user@example.com",
  userName: "John Doe",
  resetLink: "https://emtelaak.com/reset-password?token=xxx"
});
```

### 2. Welcome Email

**Triggered:** Automatically on user registration  
**Template:** `server/_core/emailService.ts` → `generateWelcomeEmail()`  
**Variables:**
- `userName` - User's name
- `loginUrl` - Login page URL

**Features:**
- Platform introduction
- Key features highlight
- Next steps guide
- Call-to-action button

**Example:**
```typescript
await sendWelcomeEmail({
  to: "user@example.com",
  userName: "John Doe"
});
```

### 3. Invoice Email

**Triggered:** When investment invoice is generated  
**Template:** `server/_core/emailService.ts` → `generateInvoiceEmail()`  
**Variables:**
- `userName` - User's name
- `invoiceNumber` - Invoice ID
- `propertyName` - Property name
- `amount` - Amount in cents
- `shares` - Number of shares
- `dueDate` - Payment due date
- `invoiceUrl` - Invoice view URL

**Features:**
- Invoice details table
- Payment instructions
- Due date reminder
- View invoice button

**Example:**
```typescript
await sendInvoiceEmail({
  to: "user@example.com",
  userName: "John Doe",
  invoiceNumber: "INV-001",
  propertyName: "Luxury Apartment Cairo",
  amount: 10000, // $100.00
  shares: 10,
  dueDate: new Date("2025-01-20"),
  invoiceUrl: "https://emtelaak.com/invoices/001"
});
```

---

## Custom Email Templates

The platform supports database-driven custom email templates with variable replacement.

### Template Types

- `password_reset` - Password reset emails
- `welcome` - Welcome emails for new users
- `invoice` - Investment invoice emails

### How It Works

1. System checks database for custom template by type
2. If custom template exists and is active, uses it
3. Otherwise, falls back to default template
4. Variables are replaced using `{{variableName}}` syntax

### Template Variables

**Password Reset:**
- `{{userName}}` - User's name
- `{{resetLink}}` - Password reset URL
- `{{expiryTime}}` - Token expiry time (e.g., "1 hour")

**Welcome:**
- `{{userName}}` - User's name
- `{{loginUrl}}` - Login page URL

**Invoice:**
- `{{userName}}` - User's name
- `{{invoiceNumber}}` - Invoice ID
- `{{propertyName}}` - Property name
- `{{amount}}` - Formatted amount (e.g., "$100.00")
- `{{shares}}` - Number of shares
- `{{dueDate}}` - Formatted due date
- `{{invoiceUrl}}` - Invoice view URL

### Managing Templates

Custom templates are managed through the Admin Email Templates page at `/admin/email-templates`.

---

## Testing

### Test Email Configuration

The email service includes a test function to verify SMTP settings:

```typescript
import { testEmailConfiguration } from "./server/_core/emailService";

const isValid = await testEmailConfiguration();
if (isValid) {
  console.log("Email configuration is valid");
} else {
  console.log("Email configuration failed");
}
```

### Manual Testing Checklist

- [ ] **Registration Email**
  1. Register a new user
  2. Check email inbox for welcome email
  3. Verify all links work
  4. Check email formatting on mobile

- [ ] **Password Reset Email**
  1. Request password reset
  2. Check email inbox for reset email
  3. Click reset link
  4. Verify token works
  5. Check link expires after 1 hour

- [ ] **Invoice Email**
  1. Create an investment
  2. Check email inbox for invoice email
  3. Verify invoice details are correct
  4. Click view invoice button
  5. Check email formatting

### Development Without SMTP

If SMTP is not configured, the email service will:
1. Log a warning to console
2. Log email details (to, subject)
3. Return `false` (email not sent)
4. For password reset, log the token to console

This allows development and testing without email configuration.

---

## Troubleshooting

### Emails Not Sending

**Check 1: Verify Environment Variables**
```bash
echo $SMTP_HOST
echo $SMTP_USER
echo $SMTP_PASSWORD
```

**Check 2: Check Server Logs**
Look for `[Email]` prefixed messages:
- `[Email] Message sent: <message-id>` - Success
- `[Email] SMTP credentials not configured` - Missing config
- `[Email] Failed to send email: <error>` - SMTP error

**Check 3: Test SMTP Connection**
```typescript
import { testEmailConfiguration } from "./server/_core/emailService";
await testEmailConfiguration();
```

### Emails Going to Spam

**Solutions:**
1. Verify sender domain with SPF, DKIM, DMARC records
2. Use a dedicated sending domain (not Gmail)
3. Warm up your sending domain gradually
4. Use a reputable ESP (SendGrid, AWS SES)
5. Include unsubscribe link
6. Avoid spam trigger words

### Gmail "Less Secure Apps" Error

**Solution:** Use App Password instead of account password
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use App Password in `SMTP_PASSWORD`

### Connection Timeout

**Possible Causes:**
- Firewall blocking SMTP ports
- Wrong SMTP host or port
- ISP blocking SMTP

**Solutions:**
- Try different ports (587, 465, 2525)
- Check firewall settings
- Use different SMTP provider

### "Invalid Login" Error

**Solutions:**
- Verify SMTP_USER and SMTP_PASSWORD are correct
- For SendGrid, ensure SMTP_USER is literally "apikey"
- For Gmail, use App Password not account password
- Check if account is locked or suspended

---

## Production Deployment

### Vercel Configuration

**Step 1: Add Environment Variables**

In Vercel dashboard → Settings → Environment Variables:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform
FRONTEND_URL=https://emtelaak.com
```

**Step 2: Deploy**

```bash
git push origin main
```

Vercel will automatically deploy with new environment variables.

**Step 3: Test**

1. Register a new user on production
2. Check email inbox for welcome email
3. Test password reset flow
4. Monitor Vercel logs for email errors

### Security Best Practices

✅ **Never commit SMTP credentials to git**  
✅ **Use environment variables for all secrets**  
✅ **Use app passwords, not account passwords**  
✅ **Enable 2FA on email provider account**  
✅ **Rotate SMTP passwords regularly**  
✅ **Monitor email sending logs**  
✅ **Set up SPF, DKIM, DMARC records**  
✅ **Use dedicated sending domain**  

---

## Monitoring

### Email Metrics to Track

1. **Delivery Rate** - % of emails successfully delivered
2. **Open Rate** - % of emails opened
3. **Click Rate** - % of links clicked
4. **Bounce Rate** - % of emails bounced
5. **Spam Rate** - % of emails marked as spam

### Provider Dashboards

- **SendGrid**: https://app.sendgrid.com/statistics
- **AWS SES**: CloudWatch metrics
- **Mailgun**: https://app.mailgun.com/analytics

### Server Logs

Monitor for:
- `[Email] Message sent` - Successful sends
- `[Email] Failed to send email` - Errors
- `[Email] SMTP credentials not configured` - Missing config

---

## Cost Estimation

### Free Tiers

| Provider | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| Gmail | 500/day | Not for production |
| SendGrid | 100/day | $15/month for 40k |
| Mailgun | 5,000/month | $35/month for 50k |
| AWS SES | 62,000/month (if on EC2) | $0.10 per 1,000 |
| Mailtrap | Unlimited (testing only) | - |

### Monthly Cost Examples

**1,000 users, 5 emails each = 5,000 emails/month:**
- SendGrid: Free
- Mailgun: Free
- AWS SES: $0.50

**10,000 users, 5 emails each = 50,000 emails/month:**
- SendGrid: $15/month
- Mailgun: $35/month
- AWS SES: $5/month

**100,000 users, 5 emails each = 500,000 emails/month:**
- SendGrid: $90/month
- Mailgun: $90/month
- AWS SES: $50/month

---

## Support

### Email Service Issues

For email service configuration issues:
1. Check this documentation
2. Review server logs
3. Test SMTP credentials manually
4. Contact your ESP support

### Provider Support

- **SendGrid**: https://support.sendgrid.com
- **AWS SES**: AWS Support Console
- **Mailgun**: https://help.mailgun.com
- **Gmail**: Google Account Help

---

## Summary

The email service is production-ready with:

✅ **Nodemailer Integration** - Industry-standard SMTP library  
✅ **Multiple Provider Support** - Works with any SMTP provider  
✅ **Beautiful HTML Templates** - Responsive, branded emails  
✅ **Automatic Sending** - Welcome emails on registration, reset emails on request  
✅ **Graceful Fallback** - Works without SMTP (logs to console)  
✅ **Custom Templates** - Database-driven template system  
✅ **Security** - 1-hour token expiry, email enumeration prevention  
✅ **Production Ready** - Tested with SendGrid, AWS SES, Gmail  

**Next Steps:**
1. Choose an email provider (SendGrid recommended)
2. Set environment variables
3. Test email sending
4. Deploy to production
5. Monitor delivery rates
