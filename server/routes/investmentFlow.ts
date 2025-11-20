import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import * as investmentFlowDb from "../db/investmentFlowDb";
import { TRPCError } from "@trpc/server";

/**
 * Investment Flow Router
 * Handles reservations, eligibility, payments, and escrow operations
 */

export const investmentFlowRouter = router({
  // ============================================
  // RESERVATIONS
  // ============================================

  /**
   * Create a new investment reservation
   */
  createReservation: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        shareQuantity: z.number().positive(),
        expirationMinutes: z.number().default(30), // Default 30 minutes
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { offeringId, shareQuantity, expirationMinutes } = input;

      // Check if user's email is verified
      if (!ctx.user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email address before making an investment. Check your inbox for the verification link.",
        });
      }

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

      const reservationId = await investmentFlowDb.createReservation({
        offeringId,
        userId: ctx.user.id,
        shareQuantity,
        expiresAt,
        status: "active",
      });

      return {
        success: true,
        reservationId,
        expiresAt,
      };
    }),

  /**
   * Get user's active reservations
   */
  getMyReservations: protectedProcedure.query(async ({ ctx }) => {
    return investmentFlowDb.getUserActiveReservations(ctx.user.id);
  }),

  /**
   * Get reservation by ID
   */
  getReservation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const reservation = await investmentFlowDb.getReservationById(input.id);

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Check ownership
      if (reservation.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this reservation",
        });
      }

      return reservation;
    }),

  /**
   * Cancel a reservation
   */
  cancelReservation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await investmentFlowDb.getReservationById(input.id);

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Check ownership
      if (reservation.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to cancel this reservation",
        });
      }

      await investmentFlowDb.updateReservationStatus(input.id, "cancelled");

      return { success: true };
    }),

  /**
   * Convert reservation to investment (admin/system)
   */
  convertReservation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can convert reservations",
        });
      }

      await investmentFlowDb.updateReservationStatus(input.id, "converted");

      return { success: true };
    }),

  /**
   * Get offering reservations (admin only)
   */
  getOfferingReservations: protectedProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "fundraiser") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view offering reservations",
        });
      }

      return investmentFlowDb.getOfferingReservations(input.offeringId);
    }),

  // ============================================
  // ELIGIBILITY
  // ============================================

  /**
   * Check or update investment eligibility
   */
  checkEligibility: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        isEligible: z.boolean().optional(),
        accreditationStatus: z
          .enum(["not_checked", "pending", "verified", "rejected", "expired"])
          .optional(),
        jurisdictionCheck: z
          .enum(["not_checked", "allowed", "restricted", "prohibited"])
          .optional(),
        investmentLimit: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { offeringId, ...eligibilityData } = input;

      const eligibilityId = await investmentFlowDb.upsertEligibility({
        userId: ctx.user.id,
        offeringId,
        ...eligibilityData,
        checkedAt: new Date(),
      });

      return {
        success: true,
        eligibilityId,
      };
    }),

  /**
   * Get user's eligibility for an offering
   */
  getMyEligibility: protectedProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ ctx, input }) => {
      return investmentFlowDb.getEligibility(ctx.user.id, input.offeringId);
    }),

  /**
   * Check if user is eligible (simple boolean check)
   */
  isEligible: protectedProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ ctx, input }) => {
      const isEligible = await investmentFlowDb.isUserEligible(
        ctx.user.id,
        input.offeringId
      );
      return { isEligible };
    }),

  /**
   * Get all eligibility checks for user
   */
  getMyEligibilityChecks: protectedProcedure.query(async ({ ctx }) => {
    return investmentFlowDb.getUserEligibilityChecks(ctx.user.id);
  }),

  /**
   * Admin: Update user eligibility
   */
  updateUserEligibility: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        offeringId: z.number(),
        isEligible: z.boolean(),
        accreditationStatus: z.enum([
          "not_checked",
          "pending",
          "verified",
          "rejected",
          "expired",
        ]),
        jurisdictionCheck: z.enum([
          "not_checked",
          "allowed",
          "restricted",
          "prohibited",
        ]),
        investmentLimit: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update user eligibility",
        });
      }

      const { userId, offeringId, ...eligibilityData } = input;

      const eligibilityId = await investmentFlowDb.upsertEligibility({
        userId,
        offeringId,
        ...eligibilityData,
        checkedAt: new Date(),
      });

      return {
        success: true,
        eligibilityId,
      };
    }),

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * Create a payment record
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        investmentId: z.number(),
        paymentMethod: z.enum([
          "bank_transfer",
          "wire_transfer",
          "credit_card",
          "debit_card",
          "ach",
          "check",
          "crypto",
          "other",
        ]),
        amountCents: z.number().positive(),
        paymentReference: z.string().optional(),
        paymentDate: z.date().optional(),
        receiptUrl: z.string().optional(),
        receiptKey: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const paymentId = await investmentFlowDb.createPayment({
        ...input,
        verificationStatus: "pending",
      });

      return {
        success: true,
        paymentId,
      };
    }),

  /**
   * Get payment by ID
   */
  getPayment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const payment = await investmentFlowDb.getPaymentById(input.id);

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      return payment;
    }),

  /**
   * Get payments for an investment
   */
  getInvestmentPayments: protectedProcedure
    .input(z.object({ investmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return investmentFlowDb.getInvestmentPayments(input.investmentId);
    }),

  /**
   * Get total verified payment amount for an investment
   */
  getInvestmentPaymentTotal: protectedProcedure
    .input(z.object({ investmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const total = await investmentFlowDb.getInvestmentVerifiedPaymentTotal(
        input.investmentId
      );
      return { totalCents: total };
    }),

  /**
   * Admin: Verify payment
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["verified", "failed", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can verify payments",
        });
      }

      await investmentFlowDb.updatePaymentVerification(
        input.id,
        input.status,
        ctx.user.id
      );

      return { success: true };
    }),

  /**
   * Admin: Get pending payments
   */
  getPendingPayments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view pending payments",
      });
    }

    return investmentFlowDb.getPendingPayments();
  }),

  // ============================================
  // ESCROW ACCOUNTS
  // ============================================

  /**
   * Create escrow account for offering
   */
  createEscrowAccount: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        accountNumber: z.string(),
        accountName: z.string().optional(),
        bankName: z.string().optional(),
        releaseConditions: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create escrow accounts",
        });
      }

      const escrowId = await investmentFlowDb.createEscrowAccount({
        ...input,
        status: "pending_setup",
        totalHeldCents: 0,
      });

      return {
        success: true,
        escrowId,
      };
    }),

  /**
   * Get escrow account by ID
   */
  getEscrowAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const escrow = await investmentFlowDb.getEscrowAccountById(input.id);

      if (!escrow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Escrow account not found",
        });
      }

      return escrow;
    }),

  /**
   * Get escrow account for offering
   */
  getOfferingEscrow: protectedProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ ctx, input }) => {
      return investmentFlowDb.getOfferingEscrowAccount(input.offeringId);
    }),

  /**
   * Admin: Update escrow status
   */
  updateEscrowStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "pending_setup",
          "active",
          "releasing",
          "released",
          "closed",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update escrow status",
        });
      }

      await investmentFlowDb.updateEscrowStatus(input.id, input.status);

      return { success: true };
    }),

  /**
   * Admin: Update escrow balance
   */
  updateEscrowBalance: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amountCents: z.number(), // Can be positive (deposit) or negative (withdrawal)
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update escrow balance",
        });
      }

      await investmentFlowDb.updateEscrowBalance(input.id, input.amountCents);

      return { success: true };
    }),

  /**
   * Admin: Get all active escrow accounts
   */
  getActiveEscrowAccounts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view escrow accounts",
      });
    }

    return investmentFlowDb.getActiveEscrowAccounts();
  }),
});
