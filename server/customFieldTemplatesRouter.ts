import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./customFieldTemplatesDb";

export const customFieldTemplatesRouter = router({
  /**
   * Get templates by module
   */
  getByModule: protectedProcedure
    .input(z.object({
      module: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.getTemplatesByModule(input.module);
    }),

  /**
   * Get all templates (admin only)
   */
  getAll: adminProcedure
    .query(async () => {
      return await db.getAllTemplates();
    }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getTemplateById(input.id);
    }),

  /**
   * Create new template (admin only)
   */
  create: adminProcedure
    .input(z.object({
      nameEn: z.string(),
      nameAr: z.string().optional(),
      descriptionEn: z.string().optional(),
      descriptionAr: z.string().optional(),
      module: z.string(),
      fields: z.string(), // JSON string of field definitions
      isSystem: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createTemplate(input);
    }),

  /**
   * Update template (admin only)
   */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      nameEn: z.string().optional(),
      nameAr: z.string().optional(),
      descriptionEn: z.string().optional(),
      descriptionAr: z.string().optional(),
      fields: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await db.updateTemplate(id, updates);
    }),

  /**
   * Delete template (admin only, non-system only)
   */
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await db.deleteTemplate(input.id);
    }),

  /**
   * Apply template to create custom fields (admin only)
   */
  applyTemplate: adminProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const template = await db.getTemplateById(input.templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Parse the fields from the template
      const fields = JSON.parse(template.fields);
      
      // Import customFieldsDb to create fields
      const customFieldsDb = await import("./customFieldsDb");
      
      const createdFields = [];
      for (const field of fields) {
        const result = await customFieldsDb.createCustomField({
          module: template.module,
          fieldKey: field.fieldKey,
          labelEn: field.labelEn,
          labelAr: field.labelAr || null,
          fieldType: field.fieldType,
          config: field.config || null,
          isRequired: field.isRequired || false,
          showInAdmin: field.showInAdmin !== false,
          showInUserForm: field.showInUserForm !== false,
          displayOrder: field.displayOrder || 0,
          helpTextEn: field.helpTextEn || null,
          helpTextAr: field.helpTextAr || null,
          placeholderEn: field.placeholderEn || null,
          placeholderAr: field.placeholderAr || null,
        });
        createdFields.push(result);
      }

      return {
        success: true,
        fieldsCreated: createdFields.length,
      };
    }),

  /**
   * Seed system templates (admin only, run once)
   */
  seedSystemTemplates: adminProcedure
    .mutation(async () => {
      await db.seedSystemTemplates();
      return { success: true };
    }),
});
