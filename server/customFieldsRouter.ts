import { z } from "zod";
import { router, adminProcedure, protectedProcedure, publicProcedure } from "./_core/trpc";
import {
  getAllCustomFields,
  getCustomFieldsByModule,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  hardDeleteCustomField,
  getCustomFieldValues,
  getCustomFieldValuesWithDefinitions,
  saveCustomFieldValue,
  saveMultipleCustomFieldValues,
  deleteCustomFieldValue,
  deleteAllCustomFieldValues,
  getCustomFieldStats,
} from "./customFieldsDb";

/**
 * Custom Fields Router
 * Manages dynamic custom fields that can be added to any module
 */

// Validation schemas
const customFieldSchema = z.object({
  module: z.string().min(1).max(50),
  fieldKey: z.string().min(1).max(100),
  labelEn: z.string().min(1).max(255),
  labelAr: z.string().max(255).optional(),
  fieldType: z.enum([
    "text",
    "number",
    "date",
    "datetime",
    "dropdown",
    "multi_select",
    "country",
    "file",
    "boolean",
    "email",
    "phone",
    "url",
    "textarea",
  ]),
  config: z.string().optional(), // JSON string
  isRequired: z.boolean().default(false),
  showInAdmin: z.boolean().default(true),
  showInUserForm: z.boolean().default(true),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  helpTextEn: z.string().optional(),
  helpTextAr: z.string().optional(),
  placeholderEn: z.string().max(255).optional(),
  placeholderAr: z.string().max(255).optional(),
  dependencies: z.string().optional(), // JSON string for conditional visibility
  validationRules: z.string().optional(), // JSON string for validation rules
});

const customFieldValueSchema = z.object({
  fieldId: z.number(),
  recordId: z.number(),
  module: z.string(),
  value: z.string().optional(),
  fileUrl: z.string().max(500).optional(),
  fileName: z.string().max(255).optional(),
});

export const customFieldsRouter = router({
  // ============================================
  // CUSTOM FIELD DEFINITIONS (Admin Only)
  // ============================================

  /**
   * Get all custom fields (admin management view)
   */
  getAll: adminProcedure.query(async () => {
    return await getAllCustomFields();
  }),

  /**
   * Get custom fields by module
   */
  getByModule: publicProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      return await getCustomFieldsByModule(input.module);
    }),

  /**
   * Get a single custom field by ID
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getCustomFieldById(input.id);
    }),

  /**
   * Create a new custom field
   */
  create: adminProcedure
    .input(customFieldSchema.extend({
      createdBy: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await createCustomField({
        ...input,
        createdBy: ctx.user.id,
      });
      return { success: true, id: result };
    }),

  /**
   * Update a custom field
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        data: customFieldSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      await updateCustomField(input.id, input.data);
      return { success: true };
    }),

  /**
   * Soft delete a custom field
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCustomField(input.id);
      return { success: true };
    }),

  /**
   * Hard delete a custom field and all its values
   */
  hardDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await hardDeleteCustomField(input.id);
      return { success: true };
    }),

  // ============================================
  // CUSTOM FIELD VALUES
  // ============================================

  /**
   * Get custom field values for a record
   */
  getValues: protectedProcedure
    .input(
      z.object({
        module: z.string(),
        recordId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCustomFieldValues(input.module, input.recordId);
    }),

  /**
   * Get custom field values with field definitions
   */
  getValuesWithDefinitions: protectedProcedure
    .input(
      z.object({
        module: z.string(),
        recordId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCustomFieldValuesWithDefinitions(input.module, input.recordId);
    }),

  /**
   * Save a single custom field value
   */
  saveValue: protectedProcedure
    .input(customFieldValueSchema)
    .mutation(async ({ input }) => {
      const result = await saveCustomFieldValue(input);
      return { success: true, id: result };
    }),

  /**
   * Save multiple custom field values at once
   */
  saveMultipleValues: protectedProcedure
    .input(
      z.object({
        module: z.string(),
        recordId: z.number(),
        values: z.array(
          z.object({
            fieldId: z.number(),
            value: z.string(),
            fileUrl: z.string().optional(),
            fileName: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      await saveMultipleCustomFieldValues(input.module, input.recordId, input.values);
      return { success: true };
    }),

  /**
   * Delete a custom field value
   */
  deleteValue: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCustomFieldValue(input.id);
      return { success: true };
    }),

  /**
   * Delete all custom field values for a record
   */
  deleteAllValues: adminProcedure
    .input(
      z.object({
        module: z.string(),
        recordId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await deleteAllCustomFieldValues(input.module, input.recordId);
      return { success: true };
    }),

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get custom field statistics
   */
  getStats: adminProcedure.query(async () => {
    return await getCustomFieldStats();
  }),
});
