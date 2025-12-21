import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@emtelaak.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("[SendGrid] API key not configured. Email notifications will be disabled.");
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("[SendGrid] Cannot send email: API key not configured");
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    };

    await sgMail.send(msg);
    console.log(`[SendGrid] Email sent successfully to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    return true;
  } catch (error) {
    console.error("[SendGrid] Failed to send email:", error);
    return false;
  }
}

/**
 * Send notification email to super admins about critical permission changes
 */
export async function notifySuperAdmins(params: {
  subject: string;
  action: string;
  performedBy: { name: string; email: string };
  targetUser?: { name: string; email: string };
  details: string;
  superAdminEmails: string[];
}): Promise<boolean> {
  const { subject, action, performedBy, targetUser, details, superAdminEmails } = params;

  if (superAdminEmails.length === 0) {
    console.warn("[SendGrid] No super admin emails to notify");
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #002B49 0%, #004d7a 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-top: none;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .alert-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-row {
          margin: 10px 0;
          padding: 10px;
          background: #f9fafb;
          border-radius: 4px;
        }
        .info-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          color: #111827;
          margin-top: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #D4FF00;
          color: #002B49;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔒 Security Alert: ${action}</h1>
      </div>
      <div class="content">
        <div class="alert-box">
          <strong>⚠️ Critical Permission Change Detected</strong>
          <p style="margin: 10px 0 0 0;">A critical permission change has been made to the Emtelaak platform. Please review the details below.</p>
        </div>

        <div class="info-row">
          <div class="info-label">Action Performed</div>
          <div class="info-value">${action}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Performed By</div>
          <div class="info-value">
            ${performedBy.name}<br>
            <span style="color: #6b7280; font-size: 14px;">${performedBy.email}</span>
          </div>
        </div>

        ${targetUser ? `
        <div class="info-row">
          <div class="info-label">Target User</div>
          <div class="info-value">
            ${targetUser.name}<br>
            <span style="color: #6b7280; font-size: 14px;">${targetUser.email}</span>
          </div>
        </div>
        ` : ''}

        <div class="info-row">
          <div class="info-label">Details</div>
          <div class="info-value">${details}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Timestamp</div>
          <div class="info-value">${new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'long' 
          })}</div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.VITE_APP_URL || 'https://emtelaak.com'}/super-admin" class="button">
            View Audit Logs
          </a>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          If you did not authorize this change or believe this is suspicious activity, please investigate immediately and contact your security team.
        </p>
      </div>
      <div class="footer">
        <p>This is an automated security notification from Emtelaak Platform.</p>
        <p>© ${new Date().getFullYear()} Emtelaak. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: superAdminEmails,
    subject: `[Emtelaak Security] ${subject}`,
    html,
  });
}
