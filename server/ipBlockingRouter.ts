import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import {
  blockIP,
  unblockIP,
  getBlockedIPs,
  getBlockedIPByAddress,
  isIPBlocked,
  cleanupExpiredBlocks,
} from "./ipBlockingDb";
import { logSecurityEvent } from "./securityDb";

export const ipBlockingRouter = router({
  /**
   * Get all blocked IPs
   */
  getBlockedIPs: adminProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        blockType: z.enum(["manual", "automatic"]).optional(),
        limit: z.number().min(1).max(1000).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await getBlockedIPs(input);
    }),

  /**
   * Check if an IP is blocked
   */
  isIPBlocked: adminProcedure
    .input(z.object({ ipAddress: z.string() }))
    .query(async ({ input }) => {
      return await isIPBlocked(input.ipAddress);
    }),

  /**
   * Get blocked IP by address
   */
  getBlockedIP: adminProcedure
    .input(z.object({ ipAddress: z.string() }))
    .query(async ({ input }) => {
      return await getBlockedIPByAddress(input.ipAddress);
    }),

  /**
   * Block an IP address (manual)
   */
  blockIP: adminProcedure
    .input(
      z.object({
        ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/),
        reason: z.string().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await blockIP({
        ipAddress: input.ipAddress,
        reason: input.reason,
        blockedBy: ctx.user.id,
        expiresAt: input.expiresAt,
        blockType: "manual",
      });

      if (id) {
        // Log security event
        await logSecurityEvent({
          eventType: "ip_blocked",
          severity: "medium",
          ipAddress: input.ipAddress,
          email: ctx.user.email,
          details: {
            reason: input.reason,
            blockedBy: ctx.user.name,
            expiresAt: input.expiresAt,
          },
        });
      }

      return { success: !!id, id };
    }),

  /**
   * Unblock an IP address
   */
  unblockIP: adminProcedure
    .input(z.object({ ipAddress: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const success = await unblockIP(input.ipAddress);

      if (success) {
        // Log security event
        await logSecurityEvent({
          eventType: "ip_unblocked",
          severity: "low",
          ipAddress: input.ipAddress,
          email: ctx.user.email,
          details: {
            unblockedBy: ctx.user.name,
          },
        });
      }

      return { success };
    }),

  /**
   * Bulk unblock IPs
   */
  bulkUnblockIPs: adminProcedure
    .input(z.object({ ipAddresses: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const results = await Promise.all(
        input.ipAddresses.map(ip => unblockIP(ip))
      );

      const successCount = results.filter(Boolean).length;

      // Log security event
      await logSecurityEvent({
        eventType: "ip_bulk_unblock",
        severity: "low",
        email: ctx.user.email,
        details: {
          unblockedBy: ctx.user.name,
          totalIPs: input.ipAddresses.length,
          successCount,
        },
      });

      return { success: successCount > 0, successCount };
    }),

  /**
   * Cleanup expired blocks
   */
  cleanupExpired: adminProcedure.mutation(async () => {
    const count = await cleanupExpiredBlocks();
    return { count };
  }),
});
