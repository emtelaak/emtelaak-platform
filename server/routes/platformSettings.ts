import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import {
  getAllPlatformSettings,
  getPlatformFeePercentage,
  getProcessingFeeCents,
  updatePlatformFeePercentage,
  updateProcessingFeeCents,
} from "../db/platformSettingsDb";
import { createAuditLog } from "../permissionsDb";

export const platformSettingsRouter = router({
  /**
   * Get all platform settings
   */
  getAll: adminProcedure.query(async () => {
    return await getAllPlatformSettings();
  }),

  /**
   * Get current fee settings
   */
  getFees: adminProcedure.query(async () => {
    const [platformFeePercentage, processingFeeCents] = await Promise.all([
      getPlatformFeePercentage(),
      getProcessingFeeCents(),
    ]);

    return {
      platformFeePercentage,
      processingFeeCents,
      processingFeeDollars: processingFeeCents / 100,
    };
  }),

  /**
   * Update platform fee percentage
   */
  updatePlatformFee: adminProcedure
    .input(
      z.object({
        percentage: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await updatePlatformFeePercentage(
        input.percentage,
        ctx.user.id
      );

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_platform_fee",
        targetType: "platform_settings",
        targetId: result?.id || 0,
        details: JSON.stringify({
          settingKey: "platform_fee_percentage",
          newValue: input.percentage,
        }),
        ipAddress: ctx.req.ip || "unknown",
      });

      return result;
    }),

  /**
   * Update processing fee amount
   */
  updateProcessingFee: adminProcedure
    .input(
      z.object({
        dollars: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const cents = Math.round(input.dollars * 100);
      const result = await updateProcessingFeeCents(cents, ctx.user.id);

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_processing_fee",
        targetType: "platform_settings",
        targetId: result?.id || 0,
        details: JSON.stringify({
          settingKey: "processing_fee_cents",
          newValue: cents,
          displayValue: `$${input.dollars}`,
        }),
        ipAddress: ctx.req.ip || "unknown",
      });

      return result;
    }),
});
