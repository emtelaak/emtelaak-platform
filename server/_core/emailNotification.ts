/**
 * Email notification helper for sending alerts to super admins
 * Uses SendGrid API for email delivery
 */

interface NotificationParams {
  subject: string;
  action: string;
  performedBy: {
    name: string;
    email: string;
  };
  targetUser: {
    name: string;
    email: string;
  };
  details: string;
  superAdminEmails: string[];
}

/**
 * Send email notification to super admins about critical permission changes
 * @param params Notification parameters including subject, action details, and recipient emails
 * @returns Promise<boolean> - true if email sent successfully, false otherwise
 */
export async function notifySuperAdmins(params: NotificationParams): Promise<boolean> {
  const { subject, action, performedBy, targetUser, details, superAdminEmails } = params;

  // Skip if no super admin emails are available
  if (!superAdminEmails || superAdminEmails.length === 0) {
    console.warn("[Email Notification] No super admin emails available");
    return false;
  }

  // Check if SendGrid API key is configured
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) {
    console.warn("[Email Notification] SendGrid API key not configured. Email notifications disabled.");
    return false;
  }

  try {
    // Prepare email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #1e3a8a;
      color: white;
      padding: 20px;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .info-box {
      background-color: white;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #84cc16;
      border-radius: 4px;
    }
    .info-label {
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">🔐 Emtelaak Security Alert</h2>
    <p style="margin: 5px 0 0 0;">${action}</p>
  </div>
  
  <div class="content">
    <p>A critical permission change has been made in the Emtelaak platform:</p>
    
    <div class="info-box">
      <div class="info-label">Action Performed:</div>
      <div>${action}</div>
    </div>
    
    <div class="info-box">
      <div class="info-label">Performed By:</div>
      <div>${performedBy.name} (${performedBy.email})</div>
    </div>
    
    <div class="info-box">
      <div class="info-label">Target User:</div>
      <div>${targetUser.name} (${targetUser.email})</div>
    </div>
    
    <div class="info-box">
      <div class="info-label">Details:</div>
      <div>${details}</div>
    </div>
    
    <p style="margin-top: 20px;">
      <strong>Why am I receiving this?</strong><br>
      You are receiving this notification because you are a super administrator of the Emtelaak platform. 
      All critical permission changes are automatically logged and reported for security purposes.
    </p>
    
    <p>
      <strong>Action Required:</strong><br>
      Please review this change in the Super Admin Dashboard. If this action was not authorized, 
      please investigate immediately and take appropriate action.
    </p>
  </div>
  
  <div class="footer">
    <p>This is an automated security notification from Emtelaak Platform.</p>
    <p>© ${new Date().getFullYear()} Emtelaak. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();

    const textContent = `
EMTELAAK SECURITY ALERT: ${action}

A critical permission change has been made in the Emtelaak platform:

Action Performed: ${action}
Performed By: ${performedBy.name} (${performedBy.email})
Target User: ${targetUser.name} (${targetUser.email})
Details: ${details}

Why am I receiving this?
You are receiving this notification because you are a super administrator of the Emtelaak platform. 
All critical permission changes are automatically logged and reported for security purposes.

Action Required:
Please review this change in the Super Admin Dashboard. If this action was not authorized, 
please investigate immediately and take appropriate action.

---
This is an automated security notification from Emtelaak Platform.
© ${new Date().getFullYear()} Emtelaak. All rights reserved.
    `.trim();

    // Send email via SendGrid API
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: superAdminEmails.map(email => ({
          to: [{ email }],
        })),
        from: {
          email: "security@emtelaak.com",
          name: "Emtelaak Security",
        },
        subject: `[Emtelaak Security] ${subject}`,
        content: [
          {
            type: "text/plain",
            value: textContent,
          },
          {
            type: "text/html",
            value: htmlContent,
          },
        ],
      }),
    });

    if (response.ok) {
      console.log(`[Email Notification] Successfully sent to ${superAdminEmails.length} super admin(s)`);
      return true;
    } else {
      const errorText = await response.text();
      console.error("[Email Notification] SendGrid API error:", response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error("[Email Notification] Failed to send email:", error);
    return false;
  }
}

/**
 * Test email notification system
 * Sends a test email to verify SendGrid configuration
 */
export async function sendTestNotification(testEmail: string): Promise<boolean> {
  return notifySuperAdmins({
    subject: "Test Notification",
    action: "Email System Test",
    performedBy: {
      name: "System",
      email: "system@emtelaak.com",
    },
    targetUser: {
      name: "Test User",
      email: "test@emtelaak.com",
    },
    details: "This is a test notification to verify the email system is working correctly.",
    superAdminEmails: [testEmail],
  });
}
