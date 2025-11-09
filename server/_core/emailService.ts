/**
 * Email Service using Manus Notification API
 * Sends transactional emails for password resets, invoices, etc.
 */
import { notifyOwner } from "./notification";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the Manus notification system
 * @param params Email parameters (to, subject, html, text)
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, html, text } = params;
  
  try {
    // Use the owner notification system to send emails
    // The notification will be sent to the platform owner who can forward it
    const content = `
**Email Notification Request**

**To:** ${to}
**Subject:** ${subject}

**Content:**
${text || html.replace(/<[^>]*>/g, '')}

---
*This is an automated email notification from the Emtelaak platform.*
    `.trim();
    
    const success = await notifyOwner({
      title: `Email: ${subject}`,
      content,
    });
    
    if (success) {
      console.log(`[Email] Notification sent for: ${subject} to ${to}`);
    } else {
      console.warn(`[Email] Failed to send notification for: ${subject} to ${to}`);
    }
    
    return success;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

/**
 * Get email template from database or use default
 */
async function getTemplate(type: string): Promise<{ subject: string; htmlContent: string; isActive?: boolean } | null> {
  try {
    const { getEmailTemplateByType } = await import("../db");
    return await getEmailTemplateByType(type);
  } catch (error) {
    console.warn(`[Email] Could not load template for ${type}, using default`);
    return null;
  }
}

/**
 * Generate HTML email template for password reset
 */
export function generatePasswordResetEmail(params: {
  userName: string;
  resetLink: string;
}): { subject: string; html: string; text: string } {
  const { userName, resetLink } = params;
  
  const subject = "Reset Your Password - Emtelaak";
  
  const html = `
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
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  <div class="content">
    <p>Hello ${userName},</p>
    
    <p>We received a request to reset your password for your Emtelaak account. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3b82f6;">${resetLink}</p>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong>
      <ul>
        <li>This link will expire in 24 hours</li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Never share this link with anyone</li>
      </ul>
    </div>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <p>Best regards,<br>The Emtelaak Team</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Emtelaak. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
  
  const text = `
Hello ${userName},

We received a request to reset your password for your Emtelaak account.

Reset your password by visiting this link:
${resetLink}

Security Notice:
- This link will expire in 24 hours
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

If you have any questions, please contact our support team.

Best regards,
The Emtelaak Team

© ${new Date().getFullYear()} Emtelaak. All rights reserved.
This is an automated message, please do not reply to this email.
  `.trim();
  
  return { subject, html, text };
}

/**
 * Generate HTML email template for invoice notification
 */
export function generateInvoiceEmail(params: {
  userName: string;
  invoiceNumber: string;
  propertyName: string;
  amount: number;
  shares: number;
  dueDate: Date;
  invoiceUrl: string;
}): { subject: string; html: string; text: string } {
  const { userName, invoiceNumber, propertyName, amount, shares, dueDate, invoiceUrl } = params;
  
  const subject = `Proforma Invoice ${invoiceNumber} - Investment Confirmation`;
  
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const html = `
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
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .invoice-details {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border: 1px solid #e5e7eb;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .detail-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
      color: #059669;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .notice {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Investment Invoice</h1>
    <p style="margin: 0; opacity: 0.9;">Invoice #${invoiceNumber}</p>
  </div>
  <div class="content">
    <p>Dear ${userName},</p>
    
    <p>Thank you for your investment in <strong>${propertyName}</strong>. Please find your proforma invoice details below:</p>
    
    <div class="invoice-details">
      <div class="detail-row">
        <span>Invoice Number:</span>
        <strong>${invoiceNumber}</strong>
      </div>
      <div class="detail-row">
        <span>Property:</span>
        <strong>${propertyName}</strong>
      </div>
      <div class="detail-row">
        <span>Number of Shares:</span>
        <strong>${shares}</strong>
      </div>
      <div class="detail-row">
        <span>Due Date:</span>
        <strong>${formattedDueDate}</strong>
      </div>
      <div class="detail-row">
        <span>Total Amount:</span>
        <strong>${formattedAmount}</strong>
      </div>
    </div>
    
    <div style="text-align: center;">
      <a href="${invoiceUrl}" class="button">View Invoice</a>
    </div>
    
    <div class="notice">
      <strong>📋 Next Steps:</strong>
      <ol style="margin: 10px 0;">
        <li>Review your invoice details</li>
        <li>Complete payment within 7 days</li>
        <li>Your investment will be confirmed upon payment</li>
      </ol>
    </div>
    
    <p>If you have any questions about this invoice or your investment, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>The Emtelaak Team</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Emtelaak. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
  
  const text = `
Investment Invoice - Invoice #${invoiceNumber}

Dear ${userName},

Thank you for your investment in ${propertyName}. Please find your proforma invoice details below:

Invoice Number: ${invoiceNumber}
Property: ${propertyName}
Number of Shares: ${shares}
Due Date: ${formattedDueDate}
Total Amount: ${formattedAmount}

View your invoice at: ${invoiceUrl}

Next Steps:
1. Review your invoice details
2. Complete payment within 7 days
3. Your investment will be confirmed upon payment

If you have any questions about this invoice or your investment, please don't hesitate to contact our support team.

Best regards,
The Emtelaak Team

© ${new Date().getFullYear()} Emtelaak. All rights reserved.
This is an automated message, please do not reply to this email.
  `.trim();
  
  return { subject, html, text };
}

/**
 * Send password reset email (with custom template support)
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetLink: string;
}): Promise<boolean> {
  const { to, userName, resetLink } = params;
  
  // Try to get custom template from database
  const customTemplate = await getTemplate('password_reset');
  
  let subject: string;
  let html: string;
  let text: string;
  
  if (customTemplate && customTemplate.isActive) {
    // Use custom template with variable replacement
    subject = replaceVariables(customTemplate.subject, { userName, resetLink, expiryTime: '24 hours' });
    html = replaceVariables(customTemplate.htmlContent, { userName, resetLink, expiryTime: '24 hours' });
    text = html.replace(/<[^>]*>/g, ''); // Strip HTML for text version
  } else {
    // Use default template
    const emailContent = generatePasswordResetEmail({ userName, resetLink });
    subject = emailContent.subject;
    html = emailContent.html;
    text = emailContent.text;
  }
  
  return sendEmail({ to, subject, html, text });
}

/**
 * Send invoice notification email (with custom template support)
 */
export async function sendInvoiceEmail(params: {
  to: string;
  userName: string;
  invoiceNumber: string;
  propertyName: string;
  amount: number;
  shares: number;
  dueDate: Date;
  invoiceUrl: string;
}): Promise<boolean> {
  const { to, userName, invoiceNumber, propertyName, amount, shares, dueDate, invoiceUrl } = params;
  
  // Try to get custom template from database
  const customTemplate = await getTemplate('invoice');
  
  let subject: string;
  let html: string;
  let text: string;
  
  if (customTemplate && customTemplate.isActive) {
    // Format values for template
    const formattedAmount = (amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const formattedDueDate = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Use custom template with variable replacement
    subject = replaceVariables(customTemplate.subject, {
      userName,
      invoiceNumber,
      propertyName,
      amount: formattedAmount,
      shares: shares.toString(),
      dueDate: formattedDueDate,
      invoiceUrl,
    });
    html = replaceVariables(customTemplate.htmlContent, {
      userName,
      invoiceNumber,
      propertyName,
      amount: formattedAmount,
      shares: shares.toString(),
      dueDate: formattedDueDate,
      invoiceUrl,
    });
    text = html.replace(/<[^>]*>/g, ''); // Strip HTML for text version
  } else {
    // Use default template
    const emailContent = generateInvoiceEmail(params);
    subject = emailContent.subject;
    html = emailContent.html;
    text = emailContent.text;
  }
  
  return sendEmail({ to, subject, html, text });
}
