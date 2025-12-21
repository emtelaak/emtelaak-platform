import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getFundraiserProperties,
  getFundraiserInvestmentStats,
  getFundraiserPropertyPerformance,
  getFundraiserRecentInvestors,
} from "../db/fundraiserDb";

/**
 * Fundraiser-only procedure
 * Ensures the user has fundraiser or admin role
 */
const fundraiserProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "fundraiser" && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Fundraiser role required.",
    });
  }
  return next({ ctx });
});

export const fundraiserRouter = router({
  /**
   * Get fundraiser dashboard overview stats
   */
  getDashboardStats: fundraiserProcedure.query(async ({ ctx }) => {
    const fundraiserId = ctx.user.id;
    
    const [properties, investmentStats] = await Promise.all([
      getFundraiserProperties(fundraiserId),
      getFundraiserInvestmentStats(fundraiserId),
    ]);

    return {
      totalProperties: properties.length,
      activeProperties: properties.filter((p) => p.status === "available").length,
      fundedProperties: properties.filter((p) => p.status === "funded").length,
      ...investmentStats,
    };
  }),

  /**
   * Get all properties managed by fundraiser
   */
  getProperties: fundraiserProcedure.query(async ({ ctx }) => {
    return await getFundraiserProperties(ctx.user.id);
  }),

  /**
   * Get detailed property performance
   */
  getPropertyPerformance: fundraiserProcedure.query(async ({ ctx }) => {
    return await getFundraiserPropertyPerformance(ctx.user.id);
  }),

  /**
   * Get recent investors
   */
  getRecentInvestors: fundraiserProcedure.query(async ({ ctx }) => {
    return await getFundraiserRecentInvestors(ctx.user.id, 10);
  }),
});
