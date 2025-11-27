/**
 * Approval Workflow Router
 * 
 * Multi-stage approval system for offerings with:
 * - Sequential approval stages
 * - Reviewer assignment
 * - Approve/Reject/Request Changes actions
 * - Approval history tracking
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { offeringApprovals, offerings, offeringStatusHistory, users } from "../../drizzle/schema";
import { eq, and, desc, or } from "drizzle-orm";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const approvalStageEnum = z.enum([
  "initial_review",
  "financial_review",
  "legal_review",
  "compliance_review",
  "executive_approval",
]);

const approvalStatusEnum = z.enum([
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);

const submitForApprovalSchema = z.object({
  offeringId: z.number().int().positive(),
});

const reviewApprovalSchema = z.object({
  approvalId: z.number().int().positive(),
  action: z.enum(["approve", "reject", "request_changes"]),
  comments: z.string().optional(),
  changesRequested: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Handle approval approved - move to next stage or mark offering as approved
 */
async function handleApprovalApproved(ctx: any, approval: any) {
  if (!ctx.db) throw new Error("Database not available");
  
  const stageOrder = [
    "initial_review",
    "financial_review",
    "legal_review",
    "compliance_review",
    "executive_approval",
  ];

  const currentStageIndex = stageOrder.indexOf(approval.approvalStage);
  const isLastStage = currentStageIndex === stageOrder.length - 1;

  if (isLastStage) {
    // Last stage - mark offering as approved
    await ctx.db
      .update(offerings)
      .set({ status: "approved" })
      .where(eq(offerings.id, approval.offeringId));

    // Record status change
    await ctx.db.insert(offeringStatusHistory).values({
      offeringId: approval.offeringId,
      previousStatus: "pending_approval",
      newStatus: "approved",
      changedBy: ctx.user.id,
      reason: "Completed all approval stages",
    });
  } else {
    // Create next stage approval
    const nextStage = stageOrder[currentStageIndex + 1];
    await ctx.db.insert(offeringApprovals).values({
      offeringId: approval.offeringId,
      approvalStage: nextStage,
      status: "pending",
    });
  }
}

/**
 * Handle approval rejected - return offering to draft
 */
async function handleApprovalRejected(ctx: any, approval: any, rejectionReason?: string) {
  if (!ctx.db) throw new Error("Database not available");
  
  // Return offering to draft status
  await ctx.db
    .update(offerings)
    .set({ status: "draft" })
    .where(eq(offerings.id, approval.offeringId));

  // Record status change
  await ctx.db.insert(offeringStatusHistory).values({
    offeringId: approval.offeringId,
    previousStatus: "pending_approval",
    newStatus: "draft",
    changedBy: ctx.user.id,
    reason: rejectionReason || "Approval rejected",
  });
}

/**
 * Handle changes requested - return offering to draft
 */
async function handleChangesRequested(ctx: any, approval: any, changesRequested?: string) {
  if (!ctx.db) throw new Error("Database not available");
  
  // Return offering to draft status
  await ctx.db
    .update(offerings)
    .set({ status: "draft" })
    .where(eq(offerings.id, approval.offeringId));

  // Record status change
  await ctx.db.insert(offeringStatusHistory).values({
    offeringId: approval.offeringId,
    previousStatus: "pending_approval",
    newStatus: "draft",
    changedBy: ctx.user.id,
    reason: changesRequested || "Changes requested",
  });
}

// ============================================
// APPROVAL WORKFLOW ROUTER
// ============================================

export const approvalsRouter = router({
  /**
   * Submit offering for approval
   * Creates initial review approval record
   */
  submitForApproval: protectedProcedure
    .input(submitForApprovalSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) throw new Error("Database not available");
      
      // Verify offering exists and user owns it
      const [offering] = await ctx.db
        .select()
        .from(offerings)
        .where(eq(offerings.id, input.offeringId))
        .limit(1);

      if (!offering) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      if (offering.fundraiserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      if (offering.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only submit draft offerings for approval",
        });
      }

      // Create initial review approval
      const [approval] = await ctx.db
        .insert(offeringApprovals)
        .values({
          offeringId: input.offeringId,
          approvalStage: "initial_review",
          status: "pending",
          // TODO: Implement auto-assignment logic
          assignedTo: null,
        })
        .$returningId();

      // Update offering status
      await ctx.db
        .update(offerings)
        .set({
          status: "pending_approval",
          submittedAt: new Date(),
        })
        .where(eq(offerings.id, input.offeringId));

      // Record status change
      await ctx.db.insert(offeringStatusHistory).values({
        offeringId: input.offeringId,
        previousStatus: "draft",
        newStatus: "pending_approval",
        changedBy: ctx.user.id,
        reason: "Submitted for multi-stage approval",
      });

      return { approvalId: approval.id };
    }),

  /**
   * Review an approval (approve/reject/request changes)
   */
  reviewApproval: protectedProcedure
    .input(reviewApprovalSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) throw new Error("Database not available");
      
      // Get approval with offering details
      const [approval] = await ctx.db
        .select()
        .from(offeringApprovals)
        .where(eq(offeringApprovals.id, input.approvalId))
        .limit(1);

      if (!approval) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval not found" });
      }

      if (approval.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approval has already been reviewed",
        });
      }

      // Update approval record
      await ctx.db
        .update(offeringApprovals)
        .set({
          status: input.action === "approve" ? "approved" : 
                  input.action === "reject" ? "rejected" : "changes_requested",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          comments: input.comments,
          rejectionReason: input.rejectionReason,
          changesRequested: input.changesRequested,
        })
        .where(eq(offeringApprovals.id, input.approvalId));

      // Handle different actions
      if (input.action === "approve") {
        await handleApprovalApproved(ctx, approval);
      } else if (input.action === "reject") {
        await handleApprovalRejected(ctx, approval, input.rejectionReason);
      } else if (input.action === "request_changes") {
        await handleChangesRequested(ctx, approval, input.changesRequested);
      }

      return { success: true };
    }),

  /**
   * Get pending approvals for admin review
   */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.db) throw new Error("Database not available");
    
    const approvals = await ctx.db
      .select({
        approval: offeringApprovals,
        offering: offerings,
        fundraiser: users,
      })
      .from(offeringApprovals)
      .leftJoin(offerings, eq(offeringApprovals.offeringId, offerings.id))
      .leftJoin(users, eq(offerings.fundraiserId, users.id))
      .where(eq(offeringApprovals.status, "pending"))
      .orderBy(desc(offeringApprovals.createdAt));

    return approvals;
  }),

  /**
   * Get approval history for an offering
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ offeringId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) throw new Error("Database not available");
      
      const approvalHistory = await ctx.db
        .select({
          approval: offeringApprovals,
          reviewer: users,
        })
        .from(offeringApprovals)
        .leftJoin(users, eq(offeringApprovals.reviewedBy, users.id))
        .where(eq(offeringApprovals.offeringId, input.offeringId))
        .orderBy(desc(offeringApprovals.createdAt));

      return approvalHistory;
    }),

  /**
   * Get approval statistics
   */
  getApprovalStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.db) throw new Error("Database not available");
    
    const approvalCounts = await ctx.db
      .select({
        status: offeringApprovals.status,
      })
      .from(offeringApprovals);

    const pending = approvalCounts.filter(a => a.status === "pending").length;
    const approved = approvalCounts.filter(a => a.status === "approved").length;
    const rejected = approvalCounts.filter(a => a.status === "rejected").length;
    const changesRequested = approvalCounts.filter(a => a.status === "changes_requested").length;

    return {
      pending,
      approved,
      rejected,
      changesRequested,
      total: approvalCounts.length,
    };
  }),
});
