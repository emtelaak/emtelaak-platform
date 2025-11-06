/**
 * Admin-only routes for managing KYC verifications, properties, and platform operations
 * These routes require admin role and are used by the admin dashboard
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getPendingKycVerifications,
  getUserKycDocuments,
  updateKycDocumentStatus,
  getVerificationStatus,
  updateVerificationStatus,
  getUserProfile,
} from "./db";
import * as notificationHelpers from "./notifications";

// Admin-only procedure that checks for admin role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // KYC Management
  kyc: router({
    // Get all pending KYC verifications
    getPending: adminProcedure.query(async () => {
      return await getPendingKycVerifications();
    }),

    // Approve or reject a KYC document
    updateDocumentStatus: adminProcedure
      .input(z.object({
        documentId: z.number(),
        userId: z.number(),
        status: z.enum(["pending", "approved", "rejected"]),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Update document status
        await updateKycDocumentStatus(input.documentId, input.status, undefined, input.rejectionReason);

        // Get user's documents to check verification status
        const userDocs = await getUserKycDocuments(input.userId);
        const doc = userDocs.find(d => d.id === input.documentId);
        
        if (!doc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }

        // Send appropriate notification
        if (input.status === "approved") {
          await notificationHelpers.notifyKYCDocumentApproved(input.userId, doc.documentType);
          
          // Check if user now has all required documents approved
          const hasIdDoc = userDocs.some(d => 
            (d.documentType === "id_card" || d.documentType === "passport") && 
            (d.status === "approved" || (d.id === input.documentId && input.status === "approved"))
          );
          const hasAddressDoc = userDocs.some(d => 
            d.documentType === "proof_of_address" && 
            (d.status === "approved" || (d.id === input.documentId && input.status === "approved"))
          );

          // Update verification status
          const documentsVerified = hasIdDoc && hasAddressDoc;
          await updateVerificationStatus(input.userId, {
            documentsVerified,
          });

          // Check if user is now fully verified
          const verificationStatus = await getVerificationStatus(input.userId);
          if (verificationStatus) {
            const oldLevel = verificationStatus.level;
            let newLevel: "level_0" | "level_1" | "level_2" = "level_0";
            
            if (documentsVerified && verificationStatus.questionnaireCompleted) {
              newLevel = "level_2";
            } else if (documentsVerified || verificationStatus.questionnaireCompleted) {
              newLevel = "level_1";
            }

            // Update verification level if changed
            if (newLevel !== oldLevel) {
              await updateVerificationStatus(input.userId, { level: newLevel });
              
              const canInvest = newLevel === "level_2";
              await notificationHelpers.notifyKYCVerificationLevelChanged(
                input.userId,
                newLevel,
                canInvest
              );

              // If fully verified, send special notification
              if (newLevel === "level_2") {
                await notificationHelpers.notifyKYCFullyVerified(input.userId);
              }
            }
          }
        } else if (input.status === "rejected") {
          await notificationHelpers.notifyKYCDocumentRejected(
            input.userId,
            doc.documentType,
            input.rejectionReason
          );
        }

        return { success: true };
      }),

    // Approve questionnaire
    approveQuestionnaire: adminProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Send approval notification
        await notificationHelpers.notifyKYCQuestionnaireApproved(input.userId);

        // Check verification status and update level if needed
        const verificationStatus = await getVerificationStatus(input.userId);
        if (verificationStatus) {
          const oldLevel = verificationStatus.level;
          let newLevel: "level_0" | "level_1" | "level_2" = "level_0";
          
          if (verificationStatus.documentsVerified && verificationStatus.questionnaireCompleted) {
            newLevel = "level_2";
          } else if (verificationStatus.documentsVerified || verificationStatus.questionnaireCompleted) {
            newLevel = "level_1";
          }

          if (newLevel !== oldLevel) {
            await updateVerificationStatus(input.userId, { level: newLevel });
            
            const canInvest = newLevel === "level_2";
            await notificationHelpers.notifyKYCVerificationLevelChanged(
              input.userId,
              newLevel,
              canInvest
            );

            if (newLevel === "level_2") {
              await notificationHelpers.notifyKYCFullyVerified(input.userId);
            }
          }
        }

        return { success: true };
      }),
  }),

  // User Management
  users: router({
    // Get user profile for admin review
    getProfile: adminProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getUserProfile(input.userId);
      }),

    // Update user verification status manually
    updateVerificationStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        level: z.enum(["level_0", "level_1", "level_2"]).optional(),
        emailVerified: z.boolean().optional(),
        phoneVerified: z.boolean().optional(),
        documentsVerified: z.boolean().optional(),
        questionnaireCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { userId, ...updates } = input;
        
        await updateVerificationStatus(userId, updates);

        // If level changed, send notification
        if (updates.level) {
          const canInvest = updates.level === "level_2";
          await notificationHelpers.notifyKYCVerificationLevelChanged(
            userId,
            updates.level,
            canInvest
          );
        }

        return { success: true };
      }),
  }),
});
