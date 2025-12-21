import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import {
  getSecurityEvents,
  getSecurityStats,
  getFailedLoginAttempts,
  resolveSecurityEvent,
  getTopOffendingIPs,
} from "./securityDb";

export const securityRouter = router({
  // Get security events with filters
  getEvents: adminProcedure
    .input(
      z.object({
        eventType: z.enum([
          "failed_login",
          "account_lockout",
          "rate_limit_hit",
          "suspicious_activity",
          "password_reset_request",
          "unauthorized_access_attempt",
          "2fa_failed",
        ]).optional(),
        userId: z.number().optional(),
        ipAddress: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        resolved: z.boolean().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const events = await getSecurityEvents(input);
      return events;
    }),

  // Get security statistics
  getStats: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const stats = await getSecurityStats(input);
      return stats;
    }),

  // Get failed login attempts
  getFailedLogins: adminProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        email: z.string().optional(),
        ipAddress: z.string().optional(),
        since: z.date().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const attempts = await getFailedLoginAttempts(input || {});
      return attempts;
    }),

  // Resolve a security event
  resolveEvent: adminProcedure
    .input(
      z.object({
        eventId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await resolveSecurityEvent(input.eventId, ctx.user.id);
      return { success };
    }),

  // Get top offending IPs
  getTopIPs: adminProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const ips = await getTopOffendingIPs(input?.limit);
      return ips;
    }),
});
