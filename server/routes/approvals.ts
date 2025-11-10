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
      // Only admins can review
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can review approvals" });
      }

      // Get approval record
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
          message: "This approval has already been reviewed",
        });
      }

      // Update approval record
      const updateData: any = {
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        comments: input.comments,
      };

      if (input.action === "approve") {
        updateData.status = "approved";
        updateData.approvalNotes = input.comments;
      } else if (input.action === "reject") {
        updateData.status = "rejected";
        updateData.rejectionReason = input.rejectionReason || input.comments;
      } else if (input.action === "request_changes") {
        updateData.status = "changes_requested";
        updateData.changesRequested = input.changesRequested || input.comments;
      }

      await ctx.db
        .update(offeringApprovals)
        .set(updateData)
        .where(eq(offeringApprovals.id, input.approvalId));

      // Handle next steps based on action
      if (input.action === "approve") {
        await this._handleApprovalApproved(ctx, approval);
      } else if (input.action === "reject") {
        await this._handleApprovalRejected(ctx, approval, input.rejectionReason);
      } else if (input.action === "request_changes") {
        await this._handleChangesRequested(ctx, approval, input.changesRequested);
      }

      return { success: true };
    }),

  /**
   * Get pending approvals (for admin dashboard)
   */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

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
      .orderBy(offeringApprovals.createdAt);

    return approvals;
  }),

  /**
   * Get approval history for an offering
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ offeringId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const approvals = await ctx.db
        .select({
          approval: offeringApprovals,
          reviewer: users,
        })
        .from(offeringApprovals)
        .leftJoin(users, eq(offeringApprovals.reviewedBy, users.id))
        .where(eq(offeringApprovals.offeringId, input.offeringId))
        .orderBy(offeringApprovals.createdAt);

      return approvals;
    }),

  /**
   * Get approval by ID
   */
  getApprovalById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          approval: offeringApprovals,
          offering: offerings,
          fundraiser: users,
        })
        .from(offeringApprovals)
        .leftJoin(offerings, eq(offeringApprovals.offeringId, offerings.id))
        .leftJoin(users, eq(offerings.fundraiserId, users.id))
        .where(eq(offeringApprovals.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval not found" });
      }

      return result;
    }),

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Handle approval approved - move to next stage or mark offering as approved
   */
  async _handleApprovalApproved(ctx: any, approval: any) {
    const stageOrder = [
      "initial_review",
      "financial_review",
      "legal_review",
      "compliance_review",
      "executive_approval",
    ];

    const currentStageIndex = stageOrder.indexOf(approval.approvalStage);
    const nextStage = stageOrder[currentStageIndex + 1];

    if (nextStage) {
      // Create next stage approval
      await ctx.db.insert(offeringApprovals).values({
        offeringId: approval.offeringId,
        approvalStage: nextStage,
        status: "pending",
        assignedTo: null, // TODO: Implement auto-assignment
      });
    } else {
      // All stages approved - mark offering as approved
      await ctx.db
        .update(offerings)
        .set({
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
        })
        .where(eq(offerings.id, approval.offeringId));

      // Record status change
      await ctx.db.insert(offeringStatusHistory).values({
        offeringId: approval.offeringId,
        previousStatus: "pending_approval",
        newStatus: "approved",
        changedBy: ctx.user.id,
        reason: "All approval stages completed successfully",
      });
    }
  },

  /**
   * Handle approval rejected - mark offering as rejected
   */
  async _handleApprovalRejected(ctx: any, approval: any, rejectionReason?: string) {
    await ctx.db
      .update(offerings)
      .set({
        status: "rejected",
        rejectionReason: rejectionReason || "Rejected during approval process",
      })
      .where(eq(offerings.id, approval.offeringId));

    // Record status change
    await ctx.db.insert(offeringStatusHistory).values({
      offeringId: approval.offeringId,
      previousStatus: "pending_approval",
      newStatus: "rejected",
      changedBy: ctx.user.id,
      reason: rejectionReason || "Rejected during approval process",
      reviewerComments: rejectionReason,
    });
  },

  /**
   * Handle changes requested - mark offering as needing changes
   */
  async _handleChangesRequested(ctx: any, approval: any, changesRequested?: string) {
    await ctx.db
      .update(offerings)
      .set({
        status: "draft", // Return to draft for edits
      })
      .where(eq(offerings.id, approval.offeringId));

    // Record status change
    await ctx.db.insert(offeringStatusHistory).values({
      offeringId: approval.offeringId,
      previousStatus: "pending_approval",
      newStatus: "draft",
      changedBy: ctx.user.id,
      reason: "Changes requested by reviewer",
      reviewerComments: changesRequested,
    });
  },
});
