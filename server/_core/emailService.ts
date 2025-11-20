/**
 * Email Service using Nodemailer with SMTP
 * Sends transactional emails for password resets, invoices, welcome emails, etc.
 */
import nodemailer from "nodemailer";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
};

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@emtelaak.com";
const FROM_NAME = process.env.SMTP_FROM_NAME || "Emtelaak Platform";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, "")
    .replace(/<script[^>]*>.*<\/script>/gm, "")
    .replace(/<[^>]+>/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Send an email using Nodemailer
 * @param params Email parameters (to, subject, html, text)
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, html, text } = params;
  
  try {
    // Check if email is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn("[Email] SMTP credentials not configured. Email not sent.");
      console.log("[Email] Would have sent:", {
        to,
        subject,
      });
      return false;
    }

    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text: text || stripHtml(html),
      html,
    });

    console.log("[Email] Message sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #003366 0%, #004080 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Emtelaak</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">Property Fractions</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Password Reset Request</h2>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Hello ${userName},
              </p>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your Emtelaak account. Click the button below to create a new password:
              </p>
              
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #003366;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 20px 0; color: #003366; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Security Notice:</strong><br>
                  • This link will expire in 1 hour<br>
                  • If you didn't request a password reset, please ignore this email<br>
                  • Never share this link with anyone
                </p>
              </div>
              
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Best regards,<br>
                The Emtelaak Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Emtelaak. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  const text = `
Hello ${userName},

We received a request to reset your password for your Emtelaak account.

Reset your password by visiting this link:
${resetLink}

Security Notice:
- This link will expire in 1 hour
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
 * Generate HTML email template for welcome email
 */
export function generateWelcomeEmail(params: {
  userName: string;
}): { subject: string; html: string; text: string } {
  const { userName } = params;
  const loginUrl = `${FRONTEND_URL}/login`;
  
  const subject = "Welcome to Emtelaak - Start Investing Today!";
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Emtelaak</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #003366 0%, #004080 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Emtelaak!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">Start Your Investment Journey</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hello ${userName}!</h2>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Thank you for joining Emtelaak, the leading platform for fractional real estate investment. We're excited to have you on board!
              </p>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                With Emtelaak, you can:
              </p>
              
              <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                <li>Invest in premium properties starting from just $100</li>
                <li>Earn regular rental income from your investments</li>
                <li>Build a diversified real estate portfolio</li>
                <li>Track your investments in real-time</li>
              </ul>
              
              <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">Next Steps:</h3>
              
              <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                <li>Complete your profile information</li>
                <li>Complete KYC verification to unlock investment access</li>
                <li>Browse available properties</li>
                <li>Make your first investment!</li>
              </ol>
              
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #003366;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                If you have any questions, our support team is here to help at support@emtelaak.com
              </p>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Best regards,<br>
                The Emtelaak Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Emtelaak. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  const text = `
Hello ${userName}!

Thank you for joining Emtelaak, the leading platform for fractional real estate investment. We're excited to have you on board!

With Emtelaak, you can:
- Invest in premium properties starting from just $100
- Earn regular rental income from your investments
- Build a diversified real estate portfolio
- Track your investments in real-time

Next Steps:
1. Complete your profile information
2. Complete KYC verification to unlock investment access
3. Browse available properties
4. Make your first investment!

Get started at: ${loginUrl}

If you have any questions, our support team is here to help at support@emtelaak.com

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
    subject = replaceVariables(customTemplate.subject, { userName, resetLink, expiryTime: '1 hour' });
    html = replaceVariables(customTemplate.htmlContent, { userName, resetLink, expiryTime: '1 hour' });
    text = stripHtml(html);
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
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}): Promise<boolean> {
  const { to, userName } = params;
  
  // Try to get custom template from database
  const customTemplate = await getTemplate('welcome');
  
  let subject: string;
  let html: string;
  let text: string;
  
  if (customTemplate && customTemplate.isActive) {
    // Use custom template with variable replacement
    const loginUrl = `${FRONTEND_URL}/login`;
    subject = replaceVariables(customTemplate.subject, { userName, loginUrl });
    html = replaceVariables(customTemplate.htmlContent, { userName, loginUrl });
    text = stripHtml(html);
  } else {
    // Use default template
    const emailContent = generateWelcomeEmail({ userName });
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
    text = stripHtml(html);
  } else {
    // Use default template
    const emailContent = generateInvoiceEmail(params);
    subject = emailContent.subject;
    html = emailContent.html;
    text = emailContent.text;
  }
  
  return sendEmail({ to, subject, html, text });
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.log("[Email] SMTP credentials not configured");
      return false;
    }

    const transport = getTransporter();
    await transport.verify();
    console.log("[Email] SMTP configuration is valid");
    return true;
  } catch (error) {
    console.error("[Email] SMTP configuration error:", error);
    return false;
  }
}


/**
 * Generate HTML email template for email verification
 */
export function generateEmailVerificationEmail(params: {
  userName: string;
  verificationLink: string;
}): { subject: string; html: string; text: string } {
  const { userName, verificationLink } = params;
  
  const subject = "Verify Your Email - Emtelaak";
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #003366 0%, #004080 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Emtelaak</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">Property Fractions</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verify Your Email Address</h2>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Hello ${userName},
              </p>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Thank you for registering with Emtelaak! To complete your registration and start investing, please verify your email address by clicking the button below:
              </p>
              
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #003366;">
                    <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 20px 0; color: #003366; font-size: 14px; word-break: break-all;">
                ${verificationLink}
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.5;">
                  <strong>ℹ️ Important:</strong><br>
                  • This verification link will expire in 24 hours<br>
                  • You must verify your email to access all platform features<br>
                  • If you didn't create an account, please ignore this email
                </p>
              </div>
              
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Best regards,<br>
                The Emtelaak Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Emtelaak. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  const text = `
Hello ${userName},

Thank you for registering with Emtelaak! To complete your registration and start investing, please verify your email address.

Verify your email by visiting this link:
${verificationLink}

Important:
- This verification link will expire in 24 hours
- You must verify your email to access all platform features
- If you didn't create an account, please ignore this email

If you have any questions, please contact our support team.

Best regards,
The Emtelaak Team

© ${new Date().getFullYear()} Emtelaak. All rights reserved.
This is an automated message, please do not reply to this email.
  `.trim();
  
  return { subject, html, text };
}
