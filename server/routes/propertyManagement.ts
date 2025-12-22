import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  createProperty,
  updateProperty,
  updatePropertySharePrice,
  getPropertyForManagement,
  getAllPropertiesForManagement,
} from "../db/propertyManagementDb";
import { createAuditLog } from "../permissionsDb";

export const propertyManagementRouter = router({
  /**
   * Get all properties for management
   */
  list: adminProcedure.query(async () => {
    return await getAllPropertiesForManagement();
  }),

  /**
   * Get property by ID for management
   */
  getById: adminProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      return await getPropertyForManagement(input.propertyId);
    }),

  /**
   * Update property share price
   */
  updateSharePrice: adminProcedure
    .input(
      z.object({
        propertyId: z.number(),
        sharePrice: z.number().min(0, "Share price must be non-negative"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { propertyId, sharePrice } = input;

      // Get current property to log old value
      const property = await getPropertyForManagement(propertyId);
      const oldSharePrice = property?.sharePrice || 0;

      // Update share price
      const result = await updatePropertySharePrice(propertyId, sharePrice);

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_share_price",
        targetType: "property",
        targetId: propertyId,
        details: JSON.stringify({
          field: "sharePrice",
          oldValue: oldSharePrice,
          newValue: sharePrice,
        }),
      });

      return result;
    }),

  /**
   * Update property details
   */
  update: adminProcedure
    .input(
      z.object({
        propertyId: z.number(),
        updates: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          totalValue: z.number().optional(),
          sharePrice: z.number().optional(),
          totalShares: z.number().optional(),
          availableShares: z.number().optional(),
          status: z.enum(["coming_soon", "available", "funded", "exited"]).optional(),
          visibility: z.enum(["public", "authenticated"]).optional(),
          // Add other fields as needed
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { propertyId, updates } = input;

      // Update property
      const result = await updateProperty(propertyId, updates);

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_property",
        targetType: "property",
        targetId: propertyId,
        details: JSON.stringify(updates),
      });

      return result;
    }),

  /**
   * Toggle property visibility (public/authenticated)
   */
  toggleVisibility: adminProcedure
    .input(
      z.object({
        propertyId: z.number(),
        visibility: z.enum(["public", "authenticated"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { propertyId, visibility } = input;

      // Get current property to log old value
      const property = await getPropertyForManagement(propertyId);
      const oldVisibility = property?.visibility || "authenticated";

      // Update visibility
      const result = await updateProperty(propertyId, { visibility });

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_property_visibility",
        targetType: "property",
        targetId: propertyId,
        details: JSON.stringify({
          field: "visibility",
          oldValue: oldVisibility,
          newValue: visibility,
        }),
      });

      return result;
    }),
});
