import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as offeringsDb from "../db/offeringsDb";
import * as financialCalc from "../utils/financialCalculations";
import { storagePut } from "../storage";

/**
 * OFFERINGS TRPC ROUTER
 * Phase 1: Core Offering Management
 */

// ============================================
// INPUT VALIDATION SCHEMAS
// ============================================

const offeringTypeEnum = z.enum([
  "regulation_d_506b",
  "regulation_d_506c",
  "regulation_a_tier1",
  "regulation_a_tier2",
  "regulation_cf",
  "private_placement",
  "other",
]);

const ownershipStructureEnum = z.enum([
  "llc_membership",
  "corporation_stock",
  "limited_partnership",
  "reit_shares",
  "tokenized_ownership",
  "other",
]);

const exitStrategyEnum = z.enum([
  "property_sale",
  "refinance",
  "buyback",
  "secondary_market",
  "ipo",
  "other",
]);

const offeringStatusEnum = z.enum([
  "draft",
  "under_review",
  "approved",
  "active",
  "funding",
  "fully_funded",
  "closed",
  "cancelled",
]);

const distributionFrequencyEnum = z.enum([
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
]);

const createOfferingSchema = z.object({
  propertyId: z.number(),
  offeringType: offeringTypeEnum,
  totalOfferingAmount: z.number().positive(),
  minimumOfferingAmount: z.number().positive().optional(),
  maximumOfferingAmount: z.number().positive().optional(),
  shareType: z.string().optional(),
  totalShares: z.number().positive(),
  pricePerShare: z.number().positive(),
  minimumSharePurchase: z.number().positive().default(1),
  maximumSharePurchase: z.number().positive().optional(),
  ownershipStructure: ownershipStructureEnum,
  ownershipStructureDetails: z.string().optional(),
  holdingPeriodMonths: z.number().positive().optional(),
  lockupPeriodMonths: z.number().positive().optional(),
  exitStrategy: exitStrategyEnum.optional(),
  exitStrategyDetails: z.string().optional(),
  expectedExitDate: z.date().optional(),
  fundingStartDate: z.date().optional(),
  fundingEndDate: z.date().optional(),
  expectedClosingDate: z.date().optional(),
  maximumInvestors: z.number().positive().optional(),
});

const financialProjectionSchema = z.object({
  offeringId: z.number(),
  projectedIRR: z.number().optional(),
  projectedROI: z.number().optional(),
  projectedCashOnCash: z.number().optional(),
  projectedEquityMultiple: z.number().optional(),
  year1RentalYield: z.number().optional(),
  year2RentalYield: z.number().optional(),
  year3RentalYield: z.number().optional(),
  year4RentalYield: z.number().optional(),
  year5RentalYield: z.number().optional(),
  annualYieldGrowthRate: z.number().optional(),
  year1Appreciation: z.number().optional(),
  year2Appreciation: z.number().optional(),
  year3Appreciation: z.number().optional(),
  year4Appreciation: z.number().optional(),
  year5Appreciation: z.number().optional(),
  annualAppreciationRate: z.number().optional(),
  year1CashFlow: z.number().optional(),
  year2CashFlow: z.number().optional(),
  year3CashFlow: z.number().optional(),
  year4CashFlow: z.number().optional(),
  year5CashFlow: z.number().optional(),
  distributionFrequency: distributionFrequencyEnum.optional(),
  firstDistributionDate: z.date().optional(),
  estimatedAnnualDistribution: z.number().optional(),
  assumptionsNotes: z.string().optional(),
  bestCaseIRR: z.number().optional(),
  baseCaseIRR: z.number().optional(),
  worstCaseIRR: z.number().optional(),
});

const feeStructureSchema = z.object({
  offeringId: z.number(),
  platformFeePercentage: z.number().default(0),
  platformFeeFixed: z.number().default(0),
  platformFeeDescription: z.string().optional(),
  managementFeePercentage: z.number().default(0),
  managementFeeFixed: z.number().default(0),
  managementFeeDescription: z.string().optional(),
  performanceFeePercentage: z.number().default(0),
  performanceFeeHurdleRate: z.number().optional(),
  performanceFeeDescription: z.string().optional(),
  maintenanceFeePercentage: z.number().default(0),
  maintenanceFeeFixed: z.number().default(0),
  maintenanceFeeDescription: z.string().optional(),
  acquisitionFeePercentage: z.number().default(0),
  acquisitionFeeFixed: z.number().default(0),
  acquisitionFeeDescription: z.string().optional(),
  dispositionFeePercentage: z.number().default(0),
  dispositionFeeFixed: z.number().default(0),
  dispositionFeeDescription: z.string().optional(),
  otherFeesDescription: z.string().optional(),
  otherFeesAmount: z.number().default(0),
});

// ============================================
// OFFERINGS ROUTER
// ============================================

export const offeringsRouter = router({
  // ============================================
  // OFFERING CRUD
  // ============================================

  create: protectedProcedure
    .input(createOfferingSchema)
    .mutation(async ({ ctx, input }) => {
      const offering = await offeringsDb.createOffering({
        ...input,
        fundraiserId: ctx.user.id,
        availableShares: input.totalShares,
        currentFundedAmount: 0,
        currentInvestorCount: 0,
        status: "draft",
      });

      return offering;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const offering = await offeringsDb.getOfferingById(input.id);
      if (!offering) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }
      return offering;
    }),

  getComplete: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const data = await offeringsDb.getCompleteOfferingData(input.id);
      if (!data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }
      return data;
    }),

  getMyOfferings: protectedProcedure.query(async ({ ctx }) => {
    return await offeringsDb.getOfferingsByFundraiserId(ctx.user.id);
  }),

  getByStatus: protectedProcedure
    .input(z.object({ status: offeringStatusEnum }))
    .query(async ({ input }) => {
      return await offeringsDb.getOfferingsByStatus(input.status);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: createOfferingSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const offering = await offeringsDb.getOfferingById(input.id);
      if (!offering) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }
      if (offering.fundraiserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      return await offeringsDb.updateOffering(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const offering = await offeringsDb.getOfferingById(input.id);
      if (!offering) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }
      if (offering.fundraiserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await offeringsDb.deleteOffering(input.id);
      return { success: true };
    }),

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  updateStatus: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        newStatus: offeringStatusEnum,
        reason: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await offeringsDb.updateOfferingStatus(
        input.offeringId,
        input.newStatus,
        ctx.user.id,
        input.reason,
        input.notes
      );
    }),

  getStatusHistory: publicProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ input }) => {
      return await offeringsDb.getOfferingStatusHistory(input.offeringId);
    }),

  // ============================================
  // FINANCIAL PROJECTIONS
  // ============================================

  createFinancialProjection: protectedProcedure
    .input(financialProjectionSchema)
    .mutation(async ({ input }) => {
      return await offeringsDb.createFinancialProjection(input);
    }),

  getFinancialProjection: publicProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ input }) => {
      return await offeringsDb.getFinancialProjection(input.offeringId);
    }),

  updateFinancialProjection: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        data: financialProjectionSchema.partial().omit({ offeringId: true }),
      })
    )
    .mutation(async ({ input }) => {
      return await offeringsDb.updateFinancialProjection(input.offeringId, input.data);
    }),

  // Financial Calculation Helpers
  calculateIRR: publicProcedure
    .input(
      z.object({
        initialInvestment: z.number(),
        annualCashFlows: z.array(z.number()),
        exitValue: z.number(),
      })
    )
    .query(({ input }) => {
      return financialCalc.calculatePropertyIRR(
        input.initialInvestment,
        input.annualCashFlows,
        input.exitValue
      );
    }),

  calculateROI: publicProcedure
    .input(
      z.object({
        initialInvestment: z.number(),
        finalValue: z.number(),
      })
    )
    .query(({ input }) => {
      return financialCalc.calculateROI(input.initialInvestment, input.finalValue);
    }),

  projectRentalYields: publicProcedure
    .input(
      z.object({
        initialYield: z.number(),
        annualGrowthRate: z.number(),
        years: z.number(),
      })
    )
    .query(({ input }) => {
      return financialCalc.projectRentalYields(
        input.initialYield,
        input.annualGrowthRate,
        input.years
      );
    }),

  performSensitivityAnalysis: publicProcedure
    .input(
      z.object({
        initialInvestment: z.number(),
        annualCashFlows: z.array(z.number()),
        exitValue: z.number(),
        variationPercentage: z.number().default(20),
      })
    )
    .query(({ input }) => {
      return financialCalc.performSensitivityAnalysis(
        input.initialInvestment,
        input.annualCashFlows,
        input.exitValue,
        input.variationPercentage
      );
    }),

  // ============================================
  // FEE STRUCTURE
  // ============================================

  createFeeStructure: protectedProcedure
    .input(feeStructureSchema)
    .mutation(async ({ input }) => {
      return await offeringsDb.createOfferingFees(input);
    }),

  getFeeStructure: publicProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ input }) => {
      return await offeringsDb.getOfferingFees(input.offeringId);
    }),

  updateFeeStructure: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        data: feeStructureSchema.partial().omit({ offeringId: true }),
      })
    )
    .mutation(async ({ input }) => {
      return await offeringsDb.updateOfferingFees(input.offeringId, input.data);
    }),

  calculateFeeImpact: publicProcedure
    .input(
      z.object({
        grossReturn: z.number(),
        fees: z.object({
          platformFeePercentage: z.number(),
          managementFeePercentage: z.number(),
          performanceFeePercentage: z.number(),
          maintenanceFeePercentage: z.number(),
        }),
      })
    )
    .query(({ input }) => {
      return financialCalc.calculateFeeImpact(input.grossReturn, input.fees);
    }),

  // ============================================
  // DOCUMENTS
  // ============================================

  uploadDocument: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        documentCategory: z.enum(["legal", "financial", "compliance", "marketing", "other"]),
        documentType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        fileData: z.string(), // Base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
        isPublic: z.boolean().default(false),
        requiresAccreditedInvestor: z.boolean().default(false),
        previousVersionId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upload file to S3
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const fileKey = `offerings/${input.offeringId}/documents/${Date.now()}-${input.fileName}`;
      
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Create document record
      const document = await offeringsDb.createOfferingDocument({
        offeringId: input.offeringId,
        documentCategory: input.documentCategory as any,
        documentType: input.documentType as any,
        title: input.title,
        description: input.description,
        fileUrl: url,
        fileKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: fileBuffer.length,
        isPublic: input.isPublic,
        requiresAccreditedInvestor: input.requiresAccreditedInvestor,
        uploadedBy: ctx.user.id,
        previousVersionId: input.previousVersionId,
        version: input.previousVersionId ? undefined : 1,
      });

      return document;
    }),

  getDocuments: publicProcedure
    .input(
      z.object({
        offeringId: z.number(),
        latestOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      return await offeringsDb.getOfferingDocuments(input.offeringId, input.latestOnly);
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const document = await offeringsDb.getOfferingDocumentById(input.id);
      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Verify authorization
      const offering = await offeringsDb.getOfferingById(document.offeringId);
      if (
        offering &&
        offering.fundraiserId !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await offeringsDb.deleteOfferingDocument(input.id);
      return { success: true };
    }),

  // ============================================
  // TIMELINE
  // ============================================

  createMilestone: protectedProcedure
    .input(
      z.object({
        offeringId: z.number(),
        milestoneType: z.string(),
        milestoneName: z.string(),
        milestoneDescription: z.string().optional(),
        targetDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await offeringsDb.createTimelineMilestone(input as any);
    }),

  getTimeline: publicProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ input }) => {
      return await offeringsDb.getOfferingTimeline(input.offeringId);
    }),

  completeMilestone: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await offeringsDb.completeTimelineMilestone(input.id, ctx.user.id);
      return { success: true };
    }),

  updateMilestone: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        milestoneType: z.enum(["custom", "approved", "fully_funded", "first_distribution", "offering_created", "submitted_for_review", "funding_started", "25_percent_funded", "50_percent_funded", "75_percent_funded", "100_percent_funded", "funding_ended", "property_acquired", "offering_closed"]).optional(),
        milestoneDate: z.date().optional(),
        milestoneTitle: z.string().optional(),
        milestoneDescription: z.string().optional(),
        status: z.enum(["upcoming", "in_progress", "completed", "delayed", "cancelled"]).optional(),
        notifyInvestors: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await offeringsDb.updateTimelineMilestone(id, data as any);
    }),

  deleteMilestone: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await offeringsDb.deleteTimelineMilestone(input.id);
      return { success: true };
    }),

  // ============================================
  // APPROVAL WORKFLOW
  // ============================================

  submitForReview: protectedProcedure
    .input(z.object({ offeringId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Update status to under_review
      await offeringsDb.updateOfferingStatus(
        input.offeringId,
        "under_review",
        ctx.user.id,
        "Submitted for review"
      );

      // Create approval request for admin
      await offeringsDb.createApprovalRequest({
        offeringId: input.offeringId,
        reviewerId: ctx.user.id, // TODO: Assign to actual reviewer
        reviewerRole: "admin",
        decision: "pending",
      });

      return { success: true };
    }),

  getApprovals: publicProcedure
    .input(z.object({ offeringId: z.number() }))
    .query(async ({ input }) => {
      return await offeringsDb.getOfferingApprovals(input.offeringId);
    }),

  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return await offeringsDb.getPendingApprovals();
  }),

  updateApproval: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        decision: z.enum(["approved", "rejected", "changes_requested"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      await offeringsDb.updateApprovalDecision(
        input.id,
        input.decision,
        input.comments
      );

      return { success: true };
    }),
});
