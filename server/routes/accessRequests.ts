import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { sendEmail } from "../_core/sendgrid";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";
import { getInvitationEmail } from "../db/platformSettingsDb";
import { hashPassword, validatePasswordStrength, generateVerificationToken } from "../utils/password";
import { users } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

// Generate random invitation code
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'EMT-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Send invitation email
async function sendInvitationEmail(email: string, name: string, code: string): Promise<boolean> {
  const activateUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'https://emtelaak.co'}/activate-account?code=${code}`;
  
  const html = `
    <!DOCTYPE html>
    <html dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #c9a227; margin: 0; font-size: 28px;">Emtelaak</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Premium Real Estate Investment</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">Welcome to Emtelaak!</h2>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${name},</p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            We are pleased to inform you that your request to join Emtelaak has been approved. 
            You are now invited to become part of our exclusive community of real estate investors.
          </p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Click the button below to set your password and activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activateUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #b8941f 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Activate Your Account</a>
          </div>
          <div style="background-color: #f8f9fa; border: 2px dashed #c9a227; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">Your Invitation Code (for reference)</p>
            <p style="color: #1e3a5f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px; font-family: monospace;">${code}</p>
          </div>
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${activateUrl}" style="color: #c9a227;">${activateUrl}</a>
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Emtelaak. All rights reserved.<br>
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({ to: email, subject: "Your Emtelaak Invitation Code", html });
    return true;
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return false;
  }
}

// Send rejection email
async function sendRejectionEmail(email: string, name: string, reason?: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #c9a227; margin: 0; font-size: 28px;">Emtelaak</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Premium Real Estate Investment</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">Application Status Update</h2>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${name},</p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your interest in joining Emtelaak. After careful review of your application, 
            we regret to inform you that we are unable to approve your request at this time.
          </p>
          ${reason ? `
          <div style="background-color: #f8f9fa; border-left: 4px solid #1e3a5f; padding: 15px 20px; margin: 20px 0;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 5px 0; font-weight: bold;">Reason:</p>
            <p style="color: #333333; font-size: 14px; margin: 0;">${reason}</p>
          </div>
          ` : ''}
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
            If you believe this decision was made in error or if your circumstances have changed, 
            please feel free to submit a new application in the future.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Emtelaak. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({ to: email, subject: "Emtelaak Application Status", html });
    return true;
  } catch (error) {
    console.error("Failed to send rejection email:", error);
    return false;
  }
}

export const accessRequestsRouter = router({
  // Public: Submit access request
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      country: z.string().optional(),
      investmentInterest: z.string().optional(),

      message: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.execute(sql`
        SELECT id, status FROM access_requests 
        WHERE email = ${input.email} AND status = 'pending'
        LIMIT 1
      `);

      if ((existing as any)[0]?.length > 0) {
        throw new Error("You already have a pending request. Please wait for review.");
      }

      await db.execute(sql`
        INSERT INTO access_requests (fullName, email, phone, country, investmentInterest, message, status, createdAt)
        VALUES (${input.fullName}, ${input.email}, ${input.phone || null}, ${input.country || null}, 
                ${input.investmentInterest || null}, ${input.message || null}, 
                'pending', NOW())
      `);

      // Send notification to configured invitation email
      try {
        const invitationEmail = await getInvitationEmail();
        
        // Send email notification to admin
        const adminHtml = `
          <!DOCTYPE html>
          <html dir="ltr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #c9a227; margin: 0; font-size: 28px;">Emtelaak</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">New Registration Request</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">طلب تسجيل جديد / New Registration Request</h2>
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Name / الاسم:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${input.fullName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Email / البريد:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${input.email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Phone / الهاتف:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${input.phone || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Country / البلد:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${input.country || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Interest / الاهتمام:</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${input.investmentInterest || 'Not specified'}</td>
                    </tr>

                    ${input.message ? `
                    <tr>
                      <td style="padding: 10px 0; font-weight: bold; color: #666;">Message / الرسالة:</td>
                      <td style="padding: 10px 0; color: #333;">${input.message}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://emtelaak.co'}/admin/access-requests" 
                     style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #b8941f 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    Review Request / مراجعة الطلب
                  </a>
                </div>
              </div>
              <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Emtelaak. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: invitationEmail,
          subject: `طلب تسجيل جديد من ${input.fullName} | New Registration Request`,
          html: adminHtml
        });

        await notifyOwner({
          title: "New Access Request",
          content: `New access request from ${input.fullName} (${input.email}). Investment interest: ${input.investmentInterest || 'Not specified'}.`
        });
      } catch (e) {
        console.error("Failed to notify owner:", e);
      }

      // Send confirmation email to the user
      try {
        const userConfirmationHtml = `
          <!DOCTYPE html>
          <html dir="ltr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #c9a227; margin: 0; font-size: 28px;">Emtelaak</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Premium Real Estate Investment</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">تم استلام طلبك / Request Received</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">عزيزي/عزيزتي ${input.fullName},</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  شكراً لاهتمامك بالانضمام إلى إمتلاك. لقد تم استلام طلبك بنجاح وسيتم مراجعته من قبل فريقنا.
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for your interest in joining Emtelaak. Your request has been received and will be reviewed by our team.
                </p>
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">ملخص الطلب / Request Summary</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">الاسم / Name:</td>
                      <td style="padding: 8px 0; color: #333;">${input.fullName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">البريد / Email:</td>
                      <td style="padding: 8px 0; color: #333;">${input.email}</td>
                    </tr>
                    ${input.phone ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">الهاتف / Phone:</td>
                      <td style="padding: 8px 0; color: #333;">${input.phone}</td>
                    </tr>
                    ` : ''}
                    ${input.country ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">البلد / Country:</td>
                      <td style="padding: 8px 0; color: #333;">${input.country}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                <div style="background-color: #fff8e1; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #856404; font-size: 14px; margin: 0;">
                    <strong>⏳ الخطوات التالية / Next Steps:</strong><br><br>
                    سنرسل لك رابط الدعوة خلال أسبوع. يرجى مراجعة بريدك الإلكتروني.<br><br>
                    Your invitation link will be sent within one week. Please keep an eye on your inbox.
                  </p>
                </div>
              </div>
              <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Emtelaak for Investment. All rights reserved.<br>
                  هذه رسالة آلية، يرجى عدم الرد عليها مباشرة.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: input.email,
          subject: "تم استلام طلبك | Your Request Has Been Received - Emtelaak",
          html: userConfirmationHtml
        });
      } catch (e) {
        console.error("Failed to send user confirmation email:", e);
      }

      return { success: true };
    }),

  // Public: Check request status by email
  checkStatus: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(sql`
        SELECT id, fullName, email, status, invitationCode, createdAt, updatedAt
        FROM access_requests 
        WHERE email = ${input.email}
        ORDER BY createdAt DESC
        LIMIT 1
      `);

      const rows = (result as any)[0];
      if (!rows || rows.length === 0) {
        return null;
      }

      return rows[0];
    }),

  // Admin: List all requests
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute(sql`
      SELECT * FROM access_requests 
      ORDER BY createdAt DESC
    `);

    return (result as any)[0] || [];
  }),

  // Admin: Approve request and send invitation code
  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(sql`
        SELECT * FROM access_requests WHERE id = ${input.id}
      `);
      const request = (result as any)[0]?.[0];
      
      if (!request) {
        throw new Error("Request not found");
      }

      if (request.status !== 'pending') {
        throw new Error("Request has already been processed");
      }

      const code = generateInvitationCode();

      await db.execute(sql`
        INSERT INTO platform_invitations (code, email, maxUses, usedCount, isActive, createdAt)
        VALUES (${code}, ${request.email}, 1, 0, true, NOW())
      `);

      await db.execute(sql`
        UPDATE access_requests 
        SET status = 'approved', invitationCode = ${code}, updatedAt = NOW()
        WHERE id = ${input.id}
      `);

      await sendInvitationEmail(request.email, request.fullName, code);

      return { success: true, code };
    }),

  // Admin: Reject request
  reject: adminProcedure
    .input(z.object({ 
      id: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(sql`
        SELECT * FROM access_requests WHERE id = ${input.id}
      `);
      const request = (result as any)[0]?.[0];
      
      if (!request) {
        throw new Error("Request not found");
      }

      await db.execute(sql`
        UPDATE access_requests 
        SET status = 'rejected', rejectionReason = ${input.reason || null}, updatedAt = NOW()
        WHERE id = ${input.id}
      `);

      if (input.reason) {
        await sendRejectionEmail(request.email, request.fullName, input.reason);
      }

      return { success: true };
    }),

  // Admin: Resend invitation email
  resendInvitation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(sql`
        SELECT * FROM access_requests WHERE id = ${input.id}
      `);
      const request = (result as any)[0]?.[0];
      
      if (!request) {
        throw new Error("Request not found");
      }

      if (request.status !== 'approved' || !request.invitationCode) {
        throw new Error("No invitation code to resend");
      }

      await sendInvitationEmail(request.email, request.fullName, request.invitationCode);

      return { success: true };
    }),

  // Admin: Delete request
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.execute(sql`
        DELETE FROM access_requests WHERE id = ${input.id}
      `);

      return { success: true };
    }),

  // Public: Validate invitation code and get user info
  validateInvitation: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if invitation code is valid
      const invitationResult = await db.execute(sql`
        SELECT * FROM platform_invitations 
        WHERE code = ${input.code} 
        AND isActive = true 
        AND (maxUses = 0 OR usedCount < maxUses)
        AND (expiresAt IS NULL OR expiresAt > NOW())
        LIMIT 1
      `);

      const invitation = (invitationResult as any)[0]?.[0];
      
      if (!invitation) {
        return { valid: false, error: "Invalid or expired invitation code" };
      }

      // Get the access request data for this invitation
      const requestResult = await db.execute(sql`
        SELECT * FROM access_requests 
        WHERE invitationCode = ${input.code}
        LIMIT 1
      `);

      const accessRequest = (requestResult as any)[0]?.[0];

      if (!accessRequest) {
        return { valid: false, error: "Access request not found" };
      }

      // Check if user already exists with this email
      const existingUserResult = await db.execute(sql`
        SELECT id FROM users WHERE email = ${accessRequest.email} LIMIT 1
      `);

      if ((existingUserResult as any)[0]?.length > 0) {
        return { valid: false, error: "Account already exists. Please login instead.", alreadyRegistered: true };
      }

      return {
        valid: true,
        email: accessRequest.email,
        fullName: accessRequest.fullName,
        phone: accessRequest.phone,
        country: accessRequest.country
      };
    }),

  // Public: Activate account with invitation code (set password)
  activateAccount: publicProcedure
    .input(z.object({
      code: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters")
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Validate invitation code
      const invitationResult = await db.execute(sql`
        SELECT * FROM platform_invitations 
        WHERE code = ${input.code} 
        AND isActive = true 
        AND (maxUses = 0 OR usedCount < maxUses)
        AND (expiresAt IS NULL OR expiresAt > NOW())
        LIMIT 1
      `);

      const invitation = (invitationResult as any)[0]?.[0];
      
      if (!invitation) {
        throw new Error("Invalid or expired invitation code");
      }

      // Get access request data
      const requestResult = await db.execute(sql`
        SELECT * FROM access_requests 
        WHERE invitationCode = ${input.code}
        LIMIT 1
      `);

      const accessRequest = (requestResult as any)[0]?.[0];

      if (!accessRequest) {
        throw new Error("Access request not found");
      }

      // Check if user already exists
      const existingUserResult = await db.execute(sql`
        SELECT id FROM users WHERE email = ${accessRequest.email} LIMIT 1
      `);

      if ((existingUserResult as any)[0]?.length > 0) {
        throw new Error("Account already exists. Please login instead.");
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(input.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error || "Invalid password");
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with data from access request
      const openId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await db.insert(users).values({
        openId,
        email: accessRequest.email,
        name: accessRequest.fullName,
        phone: accessRequest.phone || null,
        password: passwordHash,
        loginMethod: "email_password",
        role: "user",
        status: "pending_verification",
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        lastSignedIn: new Date(),
      });

      // Get the created user
      const newUserResult = await db.execute(sql`
        SELECT * FROM users WHERE email = ${accessRequest.email} LIMIT 1
      `);
      const newUser = (newUserResult as any)[0]?.[0];

      // Update invitation code usage
      await db.execute(sql`
        UPDATE platform_invitations 
        SET usedCount = usedCount + 1, 
            usedAt = NOW(),
            usedBy = ${newUser.id}
        WHERE code = ${input.code}
      `);

      // Send verification email
      const verificationUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'https://emtelaak.co'}/verify-email?token=${verificationToken}`;
      
      const verificationHtml = `
        <!DOCTYPE html>
        <html dir="ltr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #c9a227; margin: 0; font-size: 28px;">Emtelaak</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Premium Real Estate Investment</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${accessRequest.fullName},</p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for creating your Emtelaak account. Please verify your email address to complete your registration.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #b8941f 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Verify Email</a>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                This link will expire in 24 hours. If you didn't create an account, please ignore this email.
              </p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Emtelaak. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: accessRequest.email,
        subject: "Verify Your Emtelaak Account",
        html: verificationHtml
      });

      // Create JWT token for auto-login
      const token = jwt.sign(
        { openId: newUser.openId, userId: newUser.id, role: newUser.role },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      // Set session cookie
      if (ctx.res && ctx.req) {
        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
      }

      return {
        success: true,
        message: "Account created successfully. Please check your email to verify your account.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status
        }
      };
    })
});
