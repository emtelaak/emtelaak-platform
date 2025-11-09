import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getPlatformFeePercentage, getProcessingFeeCents } from "./db/platformSettingsDb";
import {
  createInvestmentTransaction,
  getInvestmentTransactionById,
  getUserInvestments,
  getPropertyInvestments,
  updateInvestmentStatus,
  reserveInvestment,
  cancelExpiredReservations,
  markInvestmentPaid,
  completeInvestment,
  addInvestmentDocument,
  getInvestmentDocuments,
  signInvestmentDocument,
  getUserEligibility,
  updateUserEligibility,
  checkInvestmentEligibility,
  updateUserInvestmentTotals,
  logInvestmentActivity,
  getInvestmentActivity,
  getInvestmentStats,
  getAvailableShares,
} from "./investmentTransactionDb";
import { TRPCError } from "@trpc/server";

export const investmentTransactionRouter = router({
  /**
   * Calculate investment details based on number of shares
   */
  calculateInvestment: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        numberOfShares: z.number().min(1), // User selects number of shares
      })
    )
    .query(async ({ input, ctx }) => {
      const { propertyId, numberOfShares } = input;

      // Get available shares
      const availability = await getAvailableShares(propertyId);
      if (!availability) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Property not found",
        });
      }

      if (numberOfShares > availability.availableShares) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${availability.availableShares} shares available`,
        });
      }

      // TODO: Get property details to get actual price per share
      // For now, assume $100 per share (10000 cents)
      const pricePerShare = 10000;
      const investmentAmount = numberOfShares * pricePerShare;

      // Get configurable fees from database
      const platformFeePercentage = await getPlatformFeePercentage();
      const processingFeeCents = await getProcessingFeeCents();
      
      // Calculate fees using database values
      const platformFee = Math.floor(investmentAmount * (platformFeePercentage / 100));
      const processingFee = processingFeeCents;
      const totalAmount = investmentAmount + platformFee + processingFee;

      return {
        numberOfShares,
        pricePerShare,
        investmentAmount,
        platformFee,
        processingFee,
        totalAmount,
        availableShares: availability.availableShares,
        percentageOfProperty: availability.totalShares > 0 
          ? (numberOfShares / availability.totalShares) * 100 
          : 0,
      };
    }),

  /**
   * Create new investment (initial step)
   */
  createInvestment: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        investmentAmount: z.number().min(1),
        numberOfShares: z.number().min(1),
        pricePerShare: z.number().min(1),
        platformFee: z.number().min(0),
        processingFee: z.number().min(0),
        totalAmount: z.number().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      // Check eligibility
      const eligibilityCheck = await checkInvestmentEligibility(
        userId,
        input.totalAmount
      );

      if (!eligibilityCheck.eligible) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: eligibilityCheck.reason || "Not eligible to invest",
        });
      }

      // Check available shares
      const availability = await getAvailableShares(input.propertyId);
      if (!availability || input.numberOfShares > availability.availableShares) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient shares available",
        });
      }

      // Create investment
      const investmentId = await createInvestmentTransaction({
        userId,
        propertyId: input.propertyId,
        investmentAmount: input.investmentAmount,
        numberOfShares: input.numberOfShares,
        pricePerShare: input.pricePerShare,
        platformFee: input.platformFee,
        processingFee: input.processingFee,
        totalAmount: input.totalAmount,
        status: "pending",
        ipAddress: ctx.req.ip || "",
        userAgent: ctx.req.get("user-agent") || "",
      });

      // Log activity
      await logInvestmentActivity({
        investmentId,
        activityType: "created",
        description: "Investment created",
        performedBy: userId,
      });

      return {
        investmentId,
        status: "pending",
      };
    }),

  /**
   * Reserve investment (hold shares temporarily)
   */
  reserveInvestment: protectedProcedure
    .input(
      z.object({
        investmentId: z.number(),
        expirationMinutes: z.number().min(5).max(30).default(15),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const investment = await getInvestmentTransactionById(input.investmentId);

      if (!investment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment not found",
        });
      }

      if (investment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      if (investment.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Investment cannot be reserved",
        });
      }

      // Check shares still available
      const availability = await getAvailableShares(investment.propertyId);
      if (!availability || investment.numberOfShares > availability.availableShares) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Shares no longer available",
        });
      }

      const expiresAt = await reserveInvestment(
        input.investmentId,
        input.expirationMinutes
      );

      await logInvestmentActivity({
        investmentId: input.investmentId,
        activityType: "reserved",
        description: `Shares reserved until ${expiresAt.toISOString()}`,
        performedBy: ctx.user.id,
      });

      return {
        status: "reserved",
        expiresAt,
      };
    }),

  /**
   * Get user's investments
   */
  getMyInvestments: protectedProcedure.query(async ({ ctx }) => {
    return await getUserInvestments(ctx.user.id);
  }),

  /**
   * Get investment details
   */
  getInvestment: protectedProcedure
    .input(z.object({ investmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const investment = await getInvestmentTransactionById(input.investmentId);

      if (!investment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment not found",
        });
      }

      if (investment.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      // Get documents and activity
      const documents = await getInvestmentDocuments(input.investmentId);
      const activity = await getInvestmentActivity(input.investmentId);

      return {
        investment,
        documents,
        activity,
      };
    }),

  /**
   * Get user eligibility
   */
  getMyEligibility: protectedProcedure.query(async ({ ctx }) => {
    return await getUserEligibility(ctx.user.id);
  }),

  /**
   * Get available shares for a property
   */
  getPropertyAvailability: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      return await getAvailableShares(input.propertyId);
    }),

  /**
   * Cancel expired reservations (cron job)
   */
  cancelExpiredReservations: protectedProcedure.mutation(async () => {
    const count = await cancelExpiredReservations();
    return { cancelledCount: count };
  }),

  /**
   * Get investment statistics (admin only)
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    return await getInvestmentStats();
  }),

  /**
   * Get property investments (admin only)
   */
  getPropertyInvestments: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      return await getPropertyInvestments(input.propertyId);
    }),
});
