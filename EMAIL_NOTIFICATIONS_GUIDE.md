# Email Notification System - Setup Guide

## Overview

The Emtelaak platform now includes an **automated email notification system** that alerts super administrators about critical security and permission changes. This ensures proper oversight and maintains platform security.

## Features

### What Gets Notified?

The system automatically sends email notifications for:

1. **User Role Changes**
   - When a user's role is changed to `admin` or `super_admin`
   - Includes details about who made the change and the target user

2. **Bulk Permission Changes**
   - When role templates are applied to users
   - Shows which template was applied and how many permissions were granted

3. **Critical Security Events**
   - All admin actions are logged in the audit log
   - Super admins receive email alerts for the most critical changes

### Who Receives Notifications?

- All users with the **super_admin** role automatically receive email notifications
- The system queries the database for all super admin emails when sending notifications
- No manual configuration of recipient lists required

## Setup Instructions

### Step 1: Create SendGrid Account

1. Visit [sendgrid.com](https://sendgrid.com) and create a free account
2. Verify your email address
3. Complete the SendGrid onboarding process

### Step 2: Generate API Key

1. Log in to your SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name your key (e.g., "Emtelaak Production")
5. Select **Full Access** or at minimum **Mail Send** permissions
6. Click **Create & View**
7. **Important:** Copy the API key immediately - you'll only see it once!

### Step 3: Configure Platform

1. Open the **Management UI** (click the settings icon in the top-right corner)
2. Navigate to **Settings** → **Secrets**
3. Click **Add New Secret**
4. Enter the following details:
   - **Key:** `SENDGRID_API_KEY`
   - **Value:** Paste your SendGrid API key
5. Click **Save**

### Step 4: Restart Development Server

For the changes to take effect:

1. If running locally: Stop and restart your development server
2. If deployed: The platform will automatically pick up the new environment variable

### Step 5: Test the System

1. Log in as a super admin
2. Navigate to `/admin/email-settings`
3. Enter your email address in the test field
4. Click **Send Test**
5. Check your inbox (and spam folder) for the test email

## Email Template

Super admins will receive professionally formatted emails with:

- **Subject Line:** `[Emtelaak Security] <Action Description>`
- **Header:** Emtelaak branding with security alert icon
- **Content Sections:**
  - Action performed
  - Who performed the action
  - Target user affected
  - Detailed description
  - Why they're receiving the notification
  - Required action/next steps
- **Footer:** Emtelaak branding and copyright

### Example Email

```
Subject: [Emtelaak Security] User Role Changed to super_admin

🔐 Emtelaak Security Alert
User Role Changed

A critical permission change has been made in the Emtelaak platform:

Action Performed: User Role Changed
Performed By: Admin User (admin@emtelaak.com)
Target User: John Doe (john@example.com)
Details: User role was changed to super_admin

Why am I receiving this?
You are receiving this notification because you are a super administrator 
of the Emtelaak platform. All critical permission changes are automatically 
logged and reported for security purposes.

Action Required:
Please review this change in the Super Admin Dashboard. If this action was 
not authorized, please investigate immediately and take appropriate action.
```

## Technical Implementation

### Backend Components

1. **Email Helper** (`server/_core/emailNotification.ts`)
   - `notifySuperAdmins()` - Main function for sending notifications
   - `sendTestNotification()` - Test function for verification
   - Handles SendGrid API integration
   - Includes HTML and plain text email templates

2. **Admin Permissions Router** (`server/adminPermissionsRouter.ts`)
   - Integrated into `updateRole` mutation
   - Integrated into `applyRoleTemplate` mutation
   - Automatically calls `notifySuperAdmins()` for critical changes

3. **Helper Functions**
   - `getSuperAdminEmails()` - Queries database for all super admin emails
   - Automatically filters out null/undefined email addresses

### Frontend Components

1. **Email Settings Page** (`client/src/pages/EmailSettings.tsx`)
   - Accessible at `/admin/email-settings`
   - Super admin only access
   - Setup instructions and documentation
   - Test email functionality
   - Email template preview

2. **Super Admin Dashboard** (`client/src/pages/SuperAdminDashboard.tsx`)
   - Added "Email Notifications" card
   - Links to email settings page
   - Bilingual support (English/Arabic)

### Security Features

- **API Key Protection:** SendGrid API key stored as environment variable
- **Role-Based Access:** Only super admins can access email settings
- **Graceful Degradation:** If API key not configured, system logs warning but doesn't crash
- **Error Handling:** Failed email sends are logged but don't block admin operations
- **Audit Trail:** All admin actions logged regardless of email success/failure

## Troubleshooting

### Emails Not Sending

1. **Check API Key Configuration**
   - Verify `SENDGRID_API_KEY` is set in Management UI → Settings → Secrets
   - Ensure there are no extra spaces or characters in the key
   - Confirm the API key has "Mail Send" permissions

2. **Check Server Logs**
   - Look for `[Email Notification]` log messages
   - Common errors:
     - "SendGrid API key not configured" - Add the API key
     - "No super admin emails available" - Ensure super admins have email addresses
     - "SendGrid API error: 401" - Invalid API key
     - "SendGrid API error: 403" - Insufficient permissions

3. **Check Email Addresses**
   - Verify super admin users have valid email addresses in the database
   - Check spam/junk folders
   - Ensure SendGrid account is verified and active

### Emails Going to Spam

1. **Verify Sender Domain** (Advanced)
   - SendGrid free tier uses shared sending domains
   - For production, consider setting up domain authentication
   - Navigate to SendGrid → Settings → Sender Authentication

2. **Check Email Content**
   - The template is designed to avoid spam triggers
   - Professional formatting and clear sender identity
   - Proper unsubscribe handling (for production)

### Testing Issues

1. **Test Email Not Received**
   - Check spam folder
   - Verify email address is correct
   - Check server logs for error messages
   - Ensure SendGrid account is active

2. **"SendGrid API key not configured" Message**
   - Add the API key to Management UI → Settings → Secrets
   - Restart the development server
   - Wait a few seconds for environment variables to reload

## Production Considerations

### Before Going Live

1. **Verify SendGrid Account**
   - Complete SendGrid account verification
   - Set up domain authentication for better deliverability
   - Configure sender identity

2. **Test Thoroughly**
   - Send test emails to multiple email providers (Gmail, Outlook, etc.)
   - Verify emails arrive in inbox (not spam)
   - Test all notification triggers

3. **Monitor Usage**
   - SendGrid free tier: 100 emails/day
   - Monitor SendGrid dashboard for delivery statistics
   - Upgrade plan if needed for production volume

### Recommended Enhancements

1. **Email Preferences**
   - Allow super admins to opt-in/opt-out of specific notification types
   - Add notification frequency settings (immediate, daily digest, weekly summary)

2. **Additional Notifications**
   - Failed login attempts
   - Bulk user imports
   - System health alerts
   - Property approval workflows

3. **Email Templates**
   - Create different templates for different notification types
   - Add company logo to email header
   - Customize branding colors

## Support

For issues or questions:

1. Check this documentation first
2. Review server logs for error messages
3. Test with SendGrid's email testing tools
4. Contact Emtelaak technical support at support@emtelaak.com

## Changelog

### Version 1.0 (Current)
- Initial implementation
- Support for role change notifications
- Support for bulk permission change notifications
- SendGrid integration
- Email settings page
- Test email functionality
- Bilingual support (English/Arabic)
