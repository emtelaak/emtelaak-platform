import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const termsRouter = router({
  // Public: Get active terms content
  getActiveTerms: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute(sql`
      SELECT id, version, titleEn, titleAr, contentEn, contentAr, updatedAt
      FROM terms_content 
      WHERE isActive = true 
      ORDER BY createdAt DESC 
      LIMIT 1
    `);

    const terms = (result as any)[0]?.[0];
    
    if (!terms) {
      return null;
    }

    return {
      id: terms.id,
      version: terms.version,
      titleEn: terms.titleEn,
      titleAr: terms.titleAr,
      contentEn: terms.contentEn,
      contentAr: terms.contentAr,
      updatedAt: terms.updatedAt
    };
  }),

  // Protected: Check if user has accepted current terms
  checkAcceptance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get current active terms version
    const termsResult = await db.execute(sql`
      SELECT version FROM terms_content WHERE isActive = true LIMIT 1
    `);
    const activeTerms = (termsResult as any)[0]?.[0];

    if (!activeTerms) {
      // No active terms, user doesn't need to accept
      return { needsAcceptance: false };
    }

    // Check if user has accepted the current version
    const userResult = await db.execute(sql`
      SELECT termsAcceptedAt, termsVersion FROM users WHERE id = ${ctx.user.id}
    `);
    const user = (userResult as any)[0]?.[0];

    if (!user) {
      return { needsAcceptance: true, currentVersion: activeTerms.version };
    }

    // User needs to accept if they haven't accepted or accepted an older version
    const needsAcceptance = !user.termsAcceptedAt || user.termsVersion !== activeTerms.version;

    return {
      needsAcceptance,
      currentVersion: activeTerms.version,
      acceptedVersion: user.termsVersion || null,
      acceptedAt: user.termsAcceptedAt || null
    };
  }),

  // Protected: Accept terms
  acceptTerms: protectedProcedure
    .input(z.object({
      version: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the version exists and is active
      const termsResult = await db.execute(sql`
        SELECT id, version FROM terms_content WHERE version = ${input.version} AND isActive = true LIMIT 1
      `);
      const terms = (termsResult as any)[0]?.[0];

      if (!terms) {
        throw new Error("Invalid or inactive terms version");
      }

      // Update user's terms acceptance
      await db.execute(sql`
        UPDATE users 
        SET termsAcceptedAt = NOW(), termsVersion = ${input.version}
        WHERE id = ${ctx.user.id}
      `);

      return { success: true, version: input.version };
    }),

  // Admin: Get all terms versions
  getAllTerms: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute(sql`
      SELECT id, version, titleEn, titleAr, isActive, createdAt, updatedAt
      FROM terms_content 
      ORDER BY createdAt DESC
    `);

    return (result as any)[0] || [];
  }),

  // Admin: Get specific terms by ID
  getTermsById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(sql`
        SELECT * FROM terms_content WHERE id = ${input.id} LIMIT 1
      `);

      return (result as any)[0]?.[0] || null;
    }),

  // Admin: Create new terms version
  createTerms: adminProcedure
    .input(z.object({
      version: z.string().min(1),
      titleEn: z.string().min(1),
      titleAr: z.string().min(1),
      contentEn: z.string().min(1),
      contentAr: z.string().min(1),
      setActive: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if version already exists
      const existingResult = await db.execute(sql`
        SELECT id FROM terms_content WHERE version = ${input.version} LIMIT 1
      `);
      
      if ((existingResult as any)[0]?.length > 0) {
        throw new Error("Version already exists");
      }

      // If setting as active, deactivate all other versions
      if (input.setActive) {
        await db.execute(sql`UPDATE terms_content SET isActive = false`);
      }

      await db.execute(sql`
        INSERT INTO terms_content (version, titleEn, titleAr, contentEn, contentAr, isActive, createdBy)
        VALUES (${input.version}, ${input.titleEn}, ${input.titleAr}, ${input.contentEn}, ${input.contentAr}, ${input.setActive}, ${ctx.user.id})
      `);

      return { success: true };
    }),

  // Admin: Update terms
  updateTerms: adminProcedure
    .input(z.object({
      id: z.number(),
      titleEn: z.string().min(1),
      titleAr: z.string().min(1),
      contentEn: z.string().min(1),
      contentAr: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.execute(sql`
        UPDATE terms_content 
        SET titleEn = ${input.titleEn}, titleAr = ${input.titleAr}, 
            contentEn = ${input.contentEn}, contentAr = ${input.contentAr}
        WHERE id = ${input.id}
      `);

      return { success: true };
    }),

  // Admin: Set terms as active
  setActiveTerms: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Deactivate all versions
      await db.execute(sql`UPDATE terms_content SET isActive = false`);

      // Activate the selected version
      await db.execute(sql`UPDATE terms_content SET isActive = true WHERE id = ${input.id}`);

      return { success: true };
    }),

  // Admin: Delete terms (only if not active)
  deleteTerms: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if active
      const result = await db.execute(sql`
        SELECT isActive FROM terms_content WHERE id = ${input.id} LIMIT 1
      `);
      const terms = (result as any)[0]?.[0];

      if (terms?.isActive) {
        throw new Error("Cannot delete active terms. Please set another version as active first.");
      }

      await db.execute(sql`DELETE FROM terms_content WHERE id = ${input.id}`);

      return { success: true };
    })
});
