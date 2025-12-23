import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { sendEmail } from "../_core/sendgrid";

export const propertyInterestsRouter = router({
  // Register interest in a coming soon property
  registerInterest: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;

      // Check if property exists and is coming_soon
      const [property] = (await db.execute(sql`
        SELECT id, name, nameAr, status FROM properties WHERE id = ${input.propertyId}
      `) as any)[0];

      if (!property) {
        throw new Error("Property not found");
      }

      if (property.status !== "coming_soon") {
        throw new Error("This property is not in coming soon status");
      }

      // Check if user already registered interest
      const [existing] = (await db.execute(sql`
        SELECT id FROM property_interests WHERE propertyId = ${input.propertyId} AND userId = ${user.id}
      `) as any)[0];

      if (existing) {
        throw new Error("You have already registered your interest in this property");
      }

      // Get user details
      const [userDetails] = (await db.execute(sql`
        SELECT fullName, email, phone FROM users WHERE id = ${user.id}
      `) as any)[0];

      // Insert interest record
      await db.execute(sql`
        INSERT INTO property_interests (propertyId, userId, email, fullName, phone, message, createdAt)
        VALUES (${input.propertyId}, ${user.id}, ${userDetails.email}, ${userDetails.fullName}, ${userDetails.phone || null}, ${input.message || null}, NOW())
      `);

      // Send notification email to admin
      try {
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
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">New Property Interest</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">مستثمر مهتم بعقار / Investor Interested in Property</h2>
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">تفاصيل العقار / Property Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Property / العقار:</td>
                      <td style="padding: 8px 0; color: #333;">${property.name} / ${property.nameAr || property.name}</td>
                    </tr>
                  </table>
                </div>
                <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">تفاصيل المستثمر / Investor Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Name / الاسم:</td>
                      <td style="padding: 8px 0; color: #333;">${userDetails.fullName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Email / البريد:</td>
                      <td style="padding: 8px 0; color: #333;">${userDetails.email}</td>
                    </tr>
                    ${userDetails.phone ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone / الهاتف:</td>
                      <td style="padding: 8px 0; color: #333;">${userDetails.phone}</td>
                    </tr>
                    ` : ''}
                    ${input.message ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Message / الرسالة:</td>
                      <td style="padding: 8px 0; color: #333;">${input.message}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://emtelaak.com'}/admin/property-interests" 
                     style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #b8941f 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    View All Interests / عرض جميع المهتمين
                  </a>
                </div>
              </div>
              <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Emtelaak for Investment. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Get admin email from platform settings
        const [settings] = (await db.execute(sql`
          SELECT value FROM platform_settings WHERE \`key\` = 'invitationEmail'
        `) as any)[0];

        const adminEmail = settings?.value || 'noreply@emtelaak.com';

        await sendEmail({
          to: adminEmail,
          subject: `مستثمر مهتم بعقار | New Property Interest - ${property.name}`,
          html: adminHtml
        });
      } catch (e) {
        console.error("Failed to send admin notification:", e);
      }

      return { success: true, message: "Your interest has been registered successfully" };
    }),

  // Check if user has already registered interest
  checkInterest: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = (await db.execute(sql`
        SELECT id FROM property_interests WHERE propertyId = ${input.propertyId} AND userId = ${ctx.user.id}
      `) as any)[0];

      return { hasInterest: !!existing };
    }),

  // Admin: List all interests for a property
  listByProperty: adminProcedure
    .input(z.object({
      propertyId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const interests = (await db.execute(sql`
        SELECT pi.*, p.name as propertyName, p.nameAr as propertyNameAr
        FROM property_interests pi
        JOIN properties p ON pi.propertyId = p.id
        WHERE pi.propertyId = ${input.propertyId}
        ORDER BY pi.createdAt DESC
      `) as any)[0];

      return interests;
    }),

  // Admin: List all interests
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const interests = (await db.execute(sql`
      SELECT pi.*, p.name as propertyName, p.nameAr as propertyNameAr, p.status as propertyStatus
      FROM property_interests pi
      JOIN properties p ON pi.propertyId = p.id
      ORDER BY pi.createdAt DESC
    `) as any)[0];

    return interests;
  }),

  // Admin: Get interest counts by property
  getCountsByProperty: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const counts = (await db.execute(sql`
      SELECT p.id, p.name, p.nameAr, p.status, COUNT(pi.id) as interestCount
      FROM properties p
      LEFT JOIN property_interests pi ON p.id = pi.propertyId
      WHERE p.status = 'coming_soon'
      GROUP BY p.id, p.name, p.nameAr, p.status
      ORDER BY interestCount DESC
    `) as any)[0];

    return counts;
  }),

  // Admin: Delete interest
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.execute(sql`DELETE FROM property_interests WHERE id = ${input.id}`);

      return { success: true };
    }),
});
