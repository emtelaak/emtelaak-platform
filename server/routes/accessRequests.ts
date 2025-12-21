import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { sendEmail } from "../_core/sendgrid";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

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
  const loginUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'https://emtelaak.com'}/register?code=${code}`;
  
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
          <div style="background-color: #f8f9fa; border: 2px dashed #c9a227; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">Your Exclusive Invitation Code</p>
            <p style="color: #1e3a5f; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 2px; font-family: monospace;">${code}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #b8941f 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Register Now</a>
          </div>
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${loginUrl}" style="color: #c9a227;">${loginUrl}</a>
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
      investmentBudget: z.string().optional(),
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
        INSERT INTO access_requests (fullName, email, phone, country, investmentInterest, investmentBudget, message, status, createdAt)
        VALUES (${input.fullName}, ${input.email}, ${input.phone || null}, ${input.country || null}, 
                ${input.investmentInterest || null}, ${input.investmentBudget || null}, ${input.message || null}, 
                'pending', NOW())
      `);

      try {
        await notifyOwner({
          title: "New Access Request",
          content: `New access request from ${input.fullName} (${input.email}). Investment interest: ${input.investmentInterest || 'Not specified'}. Budget: ${input.investmentBudget || 'Not specified'}.`
        });
      } catch (e) {
        console.error("Failed to notify owner:", e);
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
    })
});
