import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import {
  getAllPlatformSettings,
  getPlatformFeePercentage,
  getProcessingFeeCents,
  updatePlatformFeePercentage,
  updateProcessingFeeCents,
  getPlatformAccessMode,
  updatePlatformAccessMode,
  getInvitationEmail,
  updateInvitationEmail,
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

  /**
   * Get platform access mode settings (public endpoint for registration flow)
   */
  getAccessMode: publicProcedure.query(async () => {
    const [accessMode, invitationEmail] = await Promise.all([
      getPlatformAccessMode(),
      getInvitationEmail(),
    ]);

    return {
      accessMode,
      invitationEmail,
      isPrivate: accessMode === "private",
    };
  }),

  /**
   * Update platform access mode (admin only)
   */
  updateAccessMode: adminProcedure
    .input(
      z.object({
        mode: z.enum(["public", "private"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await updatePlatformAccessMode(input.mode, ctx.user.id);

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_access_mode",
        targetType: "platform_settings",
        targetId: result?.id || 0,
        details: JSON.stringify({
          settingKey: "platform_access_mode",
          newValue: input.mode,
        }),
        ipAddress: ctx.req.ip || "unknown",
      });

      return result;
    }),

  /**
   * Update invitation email address (admin only)
   */
  updateInvitationEmail: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await updateInvitationEmail(input.email, ctx.user.id);

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_invitation_email",
        targetType: "platform_settings",
        targetId: result?.id || 0,
        details: JSON.stringify({
          settingKey: "invitation_email",
          newValue: input.email,
        }),
        ipAddress: ctx.req.ip || "unknown",
      });

      return result;
    }),
});
