import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { emailTemplates } from "../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const emailTemplatesRouter = router({
  // List all email templates with optional search
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.enum(["password_reset", "invoice", "payment_confirmation", "kyc_approved", "kyc_rejected", "custom"]).optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const query = db.select().from(emailTemplates);

      // Apply filters
      const conditions = [];
      if (input?.search) {
        conditions.push(
          or(
            like(emailTemplates.name, `%${input.search}%`),
            like(emailTemplates.subject, `%${input.search}%`)
          )
        );
      }
      if (input?.category) {
        conditions.push(eq(emailTemplates.type, input.category));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(emailTemplates.isActive, input.isActive));
      }

      const templates = conditions.length > 0
        ? await query.where(or(...conditions) as any).orderBy(desc(emailTemplates.updatedAt))
        : await query.orderBy(desc(emailTemplates.updatedAt));
      
      return templates;
    }),

  // Get single template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!template[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return template[0];
    }),

  // Create new template (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["password_reset", "invoice", "payment_confirmation", "kyc_approved", "kyc_rejected", "custom"]),
        subject: z.string().min(1).max(255),
        htmlContent: z.string().min(1),
        textContent: z.string().optional(),
        variables: z.any().optional(), // JSON object
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(emailTemplates).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        id: (result as any).insertId,
      };
    }),

  // Update existing template (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        type: z.enum(["password_reset", "invoice", "payment_confirmation", "kyc_approved", "kyc_rejected", "custom"]).optional(),
        subject: z.string().min(1).max(255).optional(),
        htmlContent: z.string().min(1).optional(),
        textContent: z.string().optional(),
        variables: z.any().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updateData } = input;

      await db
        .update(emailTemplates)
        .set(updateData)
        .where(eq(emailTemplates.id, id));

      return { success: true };
    }),

  // Delete template (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.id, input.id));

      return { success: true };
    }),

  // Preview template with sample data
  preview: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        subject: z.string(),
        htmlContent: z.string(),
        sampleData: z.record(z.string(), z.string()).optional(), // Key-value pairs for variables
      })
    )
    .mutation(async ({ input }) => {
      let { subject, htmlContent } = input;
      const sampleData = input.sampleData || {};

      // Replace variables in subject and content
      Object.entries(sampleData).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replaceAll(placeholder, value);
        htmlContent = htmlContent.replaceAll(placeholder, value);
      });

      return {
        subject,
        htmlContent,
      };
    }),

  // Duplicate template (admin only)
  duplicate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!template[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      const original = template[0];
      const result = await db.insert(emailTemplates).values({
        name: `${original.name} (Copy)`,
        type: original.type,
        subject: original.subject,
        htmlContent: original.htmlContent,
        textContent: original.textContent,
        variables: original.variables,
        isActive: false, // Duplicates start as inactive
        isDefault: false,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        id: (result as any).insertId,
      };
    }),
});
