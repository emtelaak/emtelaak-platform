/**
 * Admin-only routes for managing KYC verifications, properties, and platform operations
 * These routes require admin role and are used by the admin dashboard
 */

import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { storagePut } from './storage';
import { saveFile, UPLOAD_CATEGORIES } from './localStorageService';
import {
  getPendingKycVerifications,
  getUserKycDocuments,
  updateKycDocumentStatus,
  getVerificationStatus,
  updateVerificationStatus,
  getUserProfile,
  getPlatformSetting,
  setPlatformSetting,
} from "./db";import * as notificationHelpers from "./notifications";

export const adminRouter = router({
  // KYC Management
  kyc: router({
    // Get pending questionnaires
    getPendingQuestionnaires: adminProcedure.query(async () => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) return [];
      const { kycQuestionnaires } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return await db.select().from(kycQuestionnaires).where(eq(kycQuestionnaires.status, "pending"));
    }),

    // Get pending documents
    getPendingDocuments: adminProcedure.query(async () => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) return [];
      const { kycDocuments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return await db.select().from(kycDocuments).where(eq(kycDocuments.status, "pending"));
    }),

    // Approve questionnaire
    approveQuestionnaire: adminProcedure
      .input(z.object({
        questionnaireId: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { kycQuestionnaires } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get questionnaire to find userId
        const [questionnaire] = await db.select().from(kycQuestionnaires).where(eq(kycQuestionnaires.id, input.questionnaireId));
        if (!questionnaire) throw new TRPCError({ code: "NOT_FOUND" });
        
        // Update status
        await db.update(kycQuestionnaires)
          .set({ 
            status: "approved",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          })
          .where(eq(kycQuestionnaires.id, input.questionnaireId));
        
        // Update verification status
        await updateVerificationStatus(questionnaire.userId, {
          questionnaireCompleted: true,
        });
        
        // Send notification
        await notificationHelpers.notifyKYCQuestionnaireApproved(questionnaire.userId);
        
        // Send email notification
        try {
          const { getUserById } = await import("./db");
          const { generateKYCApprovalEmail, sendEmail } = await import("./_core/emailService");
          const user = await getUserById(questionnaire.userId);
          
          if (user && user.email) {
            const verificationStatus = await getVerificationStatus(questionnaire.userId);
            const verificationLevel = verificationStatus?.level === "level_2" ? 2 : 1;
            
            const emailContent = generateKYCApprovalEmail({
              userName: user.name || "Investor",
              verificationLevel,
            });
            
            await sendEmail({
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        } catch (emailError) {
          console.error("Failed to send KYC approval email:", emailError);
        }
        
        return { success: true };
      }),

    // Reject questionnaire
    rejectQuestionnaire: adminProcedure
      .input(z.object({
        questionnaireId: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { kycQuestionnaires } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get questionnaire to find userId
        const [questionnaire] = await db.select().from(kycQuestionnaires).where(eq(kycQuestionnaires.id, input.questionnaireId));
        if (!questionnaire) throw new TRPCError({ code: "NOT_FOUND" });
        
        // Update status
        await db.update(kycQuestionnaires)
          .set({ 
            status: "rejected",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          })
          .where(eq(kycQuestionnaires.id, input.questionnaireId));
        
        // Send notification
        await notificationHelpers.notifyKYCQuestionnaireRejected(questionnaire.userId);
        
        // Send email notification
        try {
          const { getUserById } = await import("./db");
          const { generateKYCRejectionEmail, sendEmail } = await import("./_core/emailService");
          const user = await getUserById(questionnaire.userId);
          
          if (user && user.email) {
            const emailContent = generateKYCRejectionEmail({
              userName: user.name || "Investor",
              reason: input.reviewNotes || "Please review and update your KYC information.",
            });
            
            await sendEmail({
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        } catch (emailError) {
          console.error("Failed to send KYC rejection email:", emailError);
        }
        
        return { success: true };
      }),

    // Approve document
    approveDocument: adminProcedure
      .input(z.object({
        documentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { kycDocuments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get document to find userId
        const [document] = await db.select().from(kycDocuments).where(eq(kycDocuments.id, input.documentId));
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        
        // Update status
        await updateKycDocumentStatus(input.documentId, "approved", ctx.user.id);
        
        // Send notification
        await notificationHelpers.notifyKYCDocumentApproved(document.userId, document.documentType);
        
        return { success: true };
      }),

    // Reject document
    rejectDocument: adminProcedure
      .input(z.object({
        documentId: z.number(),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { kycDocuments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get document to find userId
        const [document] = await db.select().from(kycDocuments).where(eq(kycDocuments.id, input.documentId));
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        
        // Update status
        await updateKycDocumentStatus(input.documentId, "rejected", ctx.user.id, input.rejectionReason);
        
        // Send notification
        await notificationHelpers.notifyKYCDocumentRejected(document.userId, document.documentType, input.rejectionReason);
        
        return { success: true };
      }),
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

  // Property Management
  properties: router({
    // Analytics
    getAnalytics: adminProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        const { getPropertyAnalytics } = await import("./db");
        return await getPropertyAnalytics(input.propertyId);
      }),
    
    getAllAnalytics: adminProcedure.query(async () => {
      const { getAllPropertiesAnalytics } = await import("./db");
      return await getAllPropertiesAnalytics();
    }),
    
    create: adminProcedure
      .input(z.object({
        // Basic Info
        name: z.string().min(1),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        propertyType: z.enum(["residential", "commercial", "administrative", "hospitality", "education", "logistics", "medical"]),
        investmentType: z.enum(["buy_to_let", "buy_to_sell"]),
        status: z.enum(["draft", "coming_soon", "available", "funded", "exited", "cancelled"]).default("draft"),
        
        // Location
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        gpsLatitude: z.string().optional(),
        gpsLongitude: z.string().optional(),
        
        // Property Details
        propertySize: z.number().optional(),
        numberOfUnits: z.number().optional(),
        constructionYear: z.number().optional(),
        propertyCondition: z.string().optional(),
        amenities: z.string().optional(), // JSON string
        
        // Financial Details
        totalValue: z.number().min(1), // in cents
        sharePrice: z.number().min(1), // in cents
        totalShares: z.number().min(1),
        minimumInvestment: z.number().default(10000), // $100 in cents
        
        // Buy to Let specific
        rentalYield: z.number().optional(), // percentage * 100
        annualYieldIncrease: z.number().optional(),
        managementFee: z.number().optional(),
        otherCosts: z.number().optional(),
        projectedNetYield: z.number().optional(),
        
        // Buy to Sell specific
        fundTermMonths: z.number().optional(),
        projectedSalePrice: z.number().optional(),
        expectedAppreciation: z.number().optional(),
        
        // Distribution
        distributionFrequency: z.enum(["monthly", "quarterly", "annual"]).optional(),
        firstDistributionDate: z.string().optional(), // ISO date string
        
        // Timeline
        fundingDeadline: z.string().optional(),
        acquisitionDate: z.string().optional(),
        completionDate: z.string().optional(),
        expectedExitDate: z.string().optional(),
        
        // Additional
        vrTourUrl: z.string().optional(),
        videoTourUrl: z.string().optional(),
        waitlistEnabled: z.boolean().default(false),
        
        // Images
        images: z.array(z.object({
          imageData: z.string(), // base64
          mimeType: z.string(),
          caption: z.string().optional(),
          captionAr: z.string().optional(),
          isPrimary: z.boolean().default(false),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const { properties, propertyMedia } = await import("../drizzle/schema");
        
        // Extract images and date fields from input
        const { images, firstDistributionDate, fundingDeadline, acquisitionDate, completionDate, expectedExitDate, ...propertyData } = input;
        
        // Convert date strings to Date objects
        const dates: Record<string, Date | undefined> = {};
        if (firstDistributionDate) dates.firstDistributionDate = new Date(firstDistributionDate);
        if (fundingDeadline) dates.fundingDeadline = new Date(fundingDeadline);
        if (acquisitionDate) dates.acquisitionDate = new Date(acquisitionDate);
        if (completionDate) dates.completionDate = new Date(completionDate);
        if (expectedExitDate) dates.expectedExitDate = new Date(expectedExitDate);
        
        // Calculate available values
        const availableValue = propertyData.totalValue;
        const availableShares = propertyData.totalShares;
        
        // Create property
        const [result] = await db.insert(properties).values({
          ...propertyData,
          ...dates,
          availableValue,
          availableShares,
          fundraiserId: ctx.user.id,
        });
        
        const propertyId = Number(result.insertId);
        
        // Upload and save images if provided
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const image = images[i];
            
            // Convert base64 to buffer
            const base64Data = image.imageData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Generate unique filename
            const fileExtension = image.mimeType.split('/')[1];
            const fileName = `property-${propertyId}-${Date.now()}-${i}.${fileExtension}`;
            
            // Upload to S3
            const { url, key } = await storagePut(fileName, buffer, image.mimeType);
            
            // Save media record
            await db.insert(propertyMedia).values({
              propertyId,
              mediaType: 'image' as const,
              fileUrl: url,
              fileKey: key,
              caption: image.caption || null,
              isFeatured: image.isPrimary || false,
              displayOrder: i,
            });
          }
        }
        
        return { propertyId, success: true };
      }),
  }),

  // Invoice Management
  invoices: router({
    list: adminProcedure.query(async () => {
      const { getAllInvoices } = await import("./db");
      return await getAllInvoices();
    }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "paid", "cancelled", "expired"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getInvoiceById, updateInvoiceStatus, updateInvestmentStatus, createNotification } = await import("./db");
        
        const invoice = await getInvoiceById(input.id);
        if (!invoice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        
        // Update invoice status
        const paidAt = input.status === "paid" ? new Date() : undefined;
        await updateInvoiceStatus(input.id, input.status, paidAt);
        
        // Update related investment status
        if (invoice.investmentId) {
          if (input.status === "paid") {
            await updateInvestmentStatus(invoice.investmentId, "confirmed");
          } else if (input.status === "cancelled") {
            await updateInvestmentStatus(invoice.investmentId, "cancelled");
          }
        }
        
        // Create notification for user
        const notificationMessages: Record<string, { title: string; message: string }> = {
          paid: {
            title: "Payment Confirmed",
            message: `Your payment for invoice ${invoice.invoiceNumber} has been confirmed by admin.`,
          },
          cancelled: {
            title: "Invoice Cancelled",
            message: `Invoice ${invoice.invoiceNumber} has been cancelled. ${input.notes || ''}`
          },
          expired: {
            title: "Invoice Expired",
            message: `Invoice ${invoice.invoiceNumber} has expired.`,
          },
        };
        
        if (notificationMessages[input.status]) {
          await createNotification({
            userId: invoice.userId,
            type: "system",
            ...notificationMessages[input.status],
          });
        }
        
        // Create audit log
        const { createAuditLog } = await import("./permissionsDb");
        await createAuditLog({
          userId: invoice.userId, // The user affected
          performedBy: ctx.user.id, // The admin who performed the action
          action: "invoice.status_updated",
          targetType: "invoice",
          targetId: input.id,
          details: JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            oldStatus: invoice.status,
            newStatus: input.status,
            notes: input.notes || '',
            adminName: ctx.user.name,
            adminEmail: ctx.user.email,
          }),
        });
        
        return { success: true };
      }),
    getAuditLogs: adminProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input }) => {
        const { getInvoiceAuditLogs } = await import("./permissionsDb");
        return await getInvoiceAuditLogs(input.invoiceId);
      }),
    deleteInvoice: adminProcedure
      .input(z.object({ 
        id: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check permission
        const { getAdminPermissions } = await import("./db");
        const permissions = await getAdminPermissions(ctx.user.id);
        
        if (!permissions?.canDeleteInvoices && ctx.user.role !== "super_admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete invoices",
          });
        }

        const { getInvoiceById, getDb } = await import("./db");
        const { invoices } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const invoice = await getInvoiceById(input.id);
        
        if (!invoice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found",
          });
        }

        // Delete invoice
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db.delete(invoices).where(eq(invoices.id, input.id));

        // Create audit log
        const { createAuditLog } = await import("./permissionsDb");
        await createAuditLog({
          userId: invoice.userId,
          performedBy: ctx.user.id,
          action: "invoice.deleted",
          targetType: "invoice",
          targetId: input.id,
          details: JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            reason: input.reason || '',
            adminName: ctx.user.name,
            adminEmail: ctx.user.email,
          }),
        });

        return { success: true };
      }),
  }),

  // Email Templates Management
  emailTemplates: router({
    list: adminProcedure.query(async () => {
      const { getAllEmailTemplates } = await import("./db");
      return await getAllEmailTemplates();
    }),
    
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getEmailTemplateById } = await import("./db");
        return await getEmailTemplateById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["password_reset", "invoice", "payment_confirmation", "kyc_approved", "kyc_rejected", "custom"]),
        subject: z.string().min(1),
        htmlContent: z.string().min(1),
        textContent: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createEmailTemplate } = await import("./db");
        const templateId = await createEmailTemplate({
          ...input,
          variables: input.variables ? JSON.stringify(input.variables) : null,
          createdBy: ctx.user.id,
        });
        return { id: templateId, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        subject: z.string().min(1).optional(),
        htmlContent: z.string().min(1).optional(),
        textContent: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateEmailTemplate } = await import("./db");
        const { id, variables, ...updates } = input;
        const template = await updateEmailTemplate(id, {
          ...updates,
          ...(variables ? { variables: JSON.stringify(variables) } : {}),
        });
        return template;
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteEmailTemplate } = await import("./db");
        return await deleteEmailTemplate(input.id);
      }),
  }),

  // Platform Settings Management
  settings: router({
    uploadLogo: adminProcedure
      .input(z.object({
        imageData: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const fileExtension = input.mimeType.split('/')[1];
        const fileName = `platform-logo-${Date.now()}.${fileExtension}`;
        
        // Upload to S3 storage
        const fileKey = `logos/${fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Save to platform settings
        await setPlatformSetting('platform_logo', url, ctx.user.id);
        
        return { url };
      }),
    
    getLogo: adminProcedure.query(async () => {
      const setting = await getPlatformSetting('platform_logo');
      return setting?.settingValue || null;
    }),
  }),

  // User Management
  getAllUsers: adminProcedure.query(async () => {
    const db = await import("./db").then(m => m.getDb());
    if (!db) return [];
    const { users } = await import("../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }),

  // Analytics Dashboard
  getAnalyticsOverview: adminProcedure.query(async () => {
    const db = await import("./db").then(m => m.getDb());
    if (!db) return null;
    
    const { investments, users, properties, walletTransactions } = await import("../drizzle/schema");
    const { eq, and, gte, sql, desc } = await import("drizzle-orm");
    const { subMonths, startOfMonth } = await import("date-fns");
    
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);
    
    // Total investments (current month)
    const [currentInvestments] = await db
      .select({ total: sql<number>`COALESCE(SUM(${investments.amount}), 0)` })
      .from(investments)
      .where(and(
        eq(investments.status, "confirmed"),
        gte(investments.createdAt, startOfMonth(now))
      ));
    
    // Previous month investments
    const [previousInvestments] = await db
      .select({ total: sql<number>`COALESCE(SUM(${investments.amount}), 0)` })
      .from(investments)
      .where(and(
        eq(investments.status, "confirmed"),
        gte(investments.createdAt, startOfMonth(lastMonth)),
        sql`${investments.createdAt} < ${startOfMonth(now)}`
      ));
    
    const investmentChange = previousInvestments.total > 0
      ? ((currentInvestments.total - previousInvestments.total) / previousInvestments.total) * 100
      : 0;
    
    // Active investors (users with confirmed investments)
    const [currentInvestors] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${investments.userId})` })
      .from(investments)
      .where(eq(investments.status, "confirmed"));
    
    const [previousInvestors] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${investments.userId})` })
      .from(investments)
      .where(and(
        eq(investments.status, "confirmed"),
        sql`${investments.createdAt} < ${startOfMonth(now)}`
      ));
    
    const investorChange = previousInvestors.count > 0
      ? ((currentInvestors.count - previousInvestors.count) / previousInvestors.count) * 100
      : 0;
    
    // Active properties
    const [activeProperties] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properties)
      .where(eq(properties.status, "available"));
    
    const [fundedProperties] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properties)
      .where(eq(properties.status, "funded"));
    
    // Platform revenue (2% of total investments as platform fee)
    const [currentRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${investments.amount}) * 0.02, 0)` })
      .from(investments)
      .where(and(
        eq(investments.status, "confirmed"),
        gte(investments.createdAt, startOfMonth(now))
      ));
    
    const [previousRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${investments.amount}) * 0.02, 0)` })
      .from(investments)
      .where(and(
        eq(investments.status, "confirmed"),
        gte(investments.createdAt, startOfMonth(lastMonth)),
        sql`${investments.createdAt} < ${startOfMonth(now)}`
      ));
    
    const revenueChange = previousRevenue.total > 0
      ? ((currentRevenue.total - previousRevenue.total) / previousRevenue.total) * 100
      : 0;
    
    return {
      totalInvestments: currentInvestments.total,
      investmentChange,
      activeInvestors: currentInvestors.count,
      investorChange,
      activeProperties: activeProperties.count,
      fundedProperties: fundedProperties.count,
      platformRevenue: currentRevenue.total,
      revenueChange,
    };
  }),

  getInvestmentTrends: adminProcedure
    .input(z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]),
    }))
    .query(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) return [];
      
      const { investments } = await import("../drizzle/schema");
      const { eq, gte, sql, and } = await import("drizzle-orm");
      const { subDays, format } = await import("date-fns");
      
      const days = input.timeRange === "7d" ? 7 : input.timeRange === "30d" ? 30 : input.timeRange === "90d" ? 90 : 365;
      const startDate = subDays(new Date(), days);
      
      const trends = await db
        .select({
          date: sql<string>`DATE(${investments.createdAt})`,
          amount: sql<number>`SUM(${investments.amount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(investments)
        .where(and(
          eq(investments.status, "confirmed"),
          gte(investments.createdAt, startDate)
        ))
        .groupBy(sql`DATE(${investments.createdAt})`)
        .orderBy(sql`DATE(${investments.createdAt})`);
      
      return trends.map(t => ({
        date: format(new Date(t.date), "MMM dd"),
        amount: t.amount,
        count: t.count,
      }));
    }),

  getPropertyPerformance: adminProcedure.query(async () => {
    const db = await import("./db").then(m => m.getDb());
    if (!db) return [];
    
    const { investments, properties } = await import("../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const performance = await db
      .select({
        propertyId: investments.propertyId,
        name: properties.name,
        totalInvested: sql<number>`SUM(${investments.amount})`,
        investorCount: sql<number>`COUNT(DISTINCT ${investments.userId})`,
      })
      .from(investments)
      .innerJoin(properties, eq(investments.propertyId, properties.id))
      .where(eq(investments.status, "confirmed"))
      .groupBy(investments.propertyId, properties.name)
      .orderBy(sql`SUM(${investments.amount}) DESC`)
      .limit(10);
    
    return performance;
  }),

  getInvestorGrowth: adminProcedure
    .input(z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]),
    }))
    .query(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) return [];
      
      const { users } = await import("../drizzle/schema");
      const { gte, sql } = await import("drizzle-orm");
      const { subDays, format } = await import("date-fns");
      
      const days = input.timeRange === "7d" ? 7 : input.timeRange === "30d" ? 30 : input.timeRange === "90d" ? 90 : 365;
      const startDate = subDays(new Date(), days);
      
      const growth = await db
        .select({
          date: sql<string>`DATE(${users.createdAt})`,
          newInvestors: sql<number>`COUNT(*)`,
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`);
      
      let totalInvestors = 0;
      return growth.map(g => {
        totalInvestors += g.newInvestors;
        return {
          date: format(new Date(g.date), "MMM dd"),
          newInvestors: g.newInvestors,
          totalInvestors,
        };
      });
    }),

  getRevenueBreakdown: adminProcedure.query(async () => {
    const db = await import("./db").then(m => m.getDb());
    if (!db) return [];
    
    const { investments, properties } = await import("../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const breakdown = await db
      .select({
        name: properties.propertyType,
        value: sql<number>`SUM(${investments.amount}) * 0.02`, // 2% platform fee
      })
      .from(investments)
      .innerJoin(properties, eq(investments.propertyId, properties.id))
      .where(eq(investments.status, "confirmed"))
      .groupBy(properties.propertyType);
    
    return breakdown.map(b => ({
      name: b.name.charAt(0).toUpperCase() + b.name.slice(1),
      value: b.value,
    }));
  }),

  getKYCMetrics: adminProcedure.query(async () => {
    const db = await import("./db").then(m => m.getDb());
    if (!db) return null;
    
    const { kycQuestionnaires } = await import("../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const [pending] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(kycQuestionnaires)
      .where(eq(kycQuestionnaires.status, "pending"));
    
    const [approved] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(kycQuestionnaires)
      .where(eq(kycQuestionnaires.status, "approved"));
    
    const [rejected] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(kycQuestionnaires)
      .where(eq(kycQuestionnaires.status, "rejected"));
    
    const total = pending.count + approved.count + rejected.count;
    
    return {
      pending: pending.count,
      approved: approved.count,
      rejected: rejected.count,
      total,
    };
  }),

  getRecentActivity: adminProcedure
    .input(z.object({
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) return [];
      
      const { investments, users, properties } = await import("../drizzle/schema");
      const { eq, desc, sql } = await import("drizzle-orm");
      
      const activities = await db
        .select({
          id: investments.id,
          description: sql<string>`CONCAT(${users.name}, ' invested in ', ${properties.name})`,
          createdAt: investments.createdAt,
        })
        .from(investments)
        .innerJoin(users, eq(investments.userId, users.id))
        .innerJoin(properties, eq(investments.propertyId, properties.id))
        .where(eq(investments.status, "confirmed"))
        .orderBy(desc(investments.createdAt))
        .limit(input.limit);
      
      return activities;
    }),

  // Data Export
  exportUsers: adminProcedure
    .input(z.object({
      format: z.enum(["csv", "json"]),
    }))
    .mutation(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const { users } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const userData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          loginMethod: users.loginMethod,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      
      if (input.format === "csv") {
        const { Parser } = await import("json2csv");
        const parser = new Parser();
        const csv = parser.parse(userData);
        return { data: csv, filename: `users-export-${Date.now()}.csv`, mimeType: "text/csv" };
      } else {
        return { data: JSON.stringify(userData, null, 2), filename: `users-export-${Date.now()}.json`, mimeType: "application/json" };
      }
    }),

  exportInvestments: adminProcedure
    .input(z.object({
      format: z.enum(["csv", "json"]),
      propertyId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const { investments, users, properties } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      let query = db
        .select({
          id: investments.id,
          userName: users.name,
          userEmail: users.email,
          propertyName: properties.name,
          amount: investments.amount,
          shares: investments.shares,
          status: investments.status,
          createdAt: investments.createdAt,
        })
        .from(investments)
        .innerJoin(users, eq(investments.userId, users.id))
        .innerJoin(properties, eq(investments.propertyId, properties.id))
        .orderBy(desc(investments.createdAt));
      
      if (input.propertyId) {
        query = query.where(eq(investments.propertyId, input.propertyId)) as any;
      }
      
      const investmentData = await query;
      
      if (input.format === "csv") {
        const { Parser } = await import("json2csv");
        const parser = new Parser();
        const csv = parser.parse(investmentData);
        return { data: csv, filename: `investments-export-${Date.now()}.csv`, mimeType: "text/csv" };
      } else {
        return { data: JSON.stringify(investmentData, null, 2), filename: `investments-export-${Date.now()}.json`, mimeType: "application/json" };
      }
    }),

  exportTransactions: adminProcedure
    .input(z.object({
      format: z.enum(["csv", "json"]),
    }))
    .mutation(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const { walletTransactions, users } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      const transactionData = await db
        .select({
          id: walletTransactions.id,
          userName: users.name,
          userEmail: users.email,
          type: walletTransactions.type,
          amount: walletTransactions.amount,
          status: walletTransactions.status,
          paymentMethod: walletTransactions.paymentMethod,
          reference: walletTransactions.reference,
          description: walletTransactions.description,
          createdAt: walletTransactions.createdAt,
        })
        .from(walletTransactions)
        .innerJoin(users, eq(walletTransactions.userId, users.id))
        .orderBy(desc(walletTransactions.createdAt));
      
      if (input.format === "csv") {
        const { Parser } = await import("json2csv");
        const parser = new Parser();
        const csv = parser.parse(transactionData);
        return { data: csv, filename: `transactions-export-${Date.now()}.csv`, mimeType: "text/csv" };
      } else {
        return { data: JSON.stringify(transactionData, null, 2), filename: `transactions-export-${Date.now()}.json`, mimeType: "application/json" };
      }
    }),

  // ============================================
  // PROPERTY IMAGE MANAGEMENT
  // ============================================

  uploadPropertyImage: adminProcedure
    .input(z.object({
      propertyId: z.number(),
      imageData: z.string(), // Base64 encoded image
      fileName: z.string(),
      isPrimary: z.boolean().optional(),
      caption: z.string().optional(),
      captionAr: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { propertyId, imageData, fileName, isPrimary, caption, captionAr } = input;

      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = fileName.split(".").pop() || "jpg";
      const fileKey = `properties/${propertyId}/images/${timestamp}-${randomSuffix}.${fileExtension}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, `image/${fileExtension}`);

      // Save to database
      const { createPropertyImage } = await import("./db/propertyImageDb.js");
      const imageId = await createPropertyImage({
        propertyId,
        imageUrl: url,
        imageKey: fileKey,
        isPrimary: isPrimary || false,
        caption,
        captionAr,
        uploadedBy: ctx.user.id,
      });

      // If this is set as primary, update others
      if (isPrimary) {
        const { setPrimaryImage } = await import("./db/propertyImageDb.js");
        await setPrimaryImage(imageId, propertyId);
      }

      return { success: true, imageId, imageUrl: url };
    }),

  getPropertyImages: adminProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ input }) => {
      const { getPropertyImages } = await import("./db/propertyImageDb.js");
      return await getPropertyImages(input.propertyId);
    }),

  setPrimaryImage: adminProcedure
    .input(z.object({
      imageId: z.number(),
      propertyId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { setPrimaryImage } = await import("./db/propertyImageDb.js");
      await setPrimaryImage(input.imageId, input.propertyId);
      return { success: true };
    }),

  updateImageOrder: adminProcedure
    .input(z.object({
      imageId: z.number(),
      displayOrder: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { updateImageOrder } = await import("./db/propertyImageDb.js");
      await updateImageOrder(input.imageId, input.displayOrder);
      return { success: true };
    }),

  deletePropertyImage: adminProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ input }) => {
      const { deletePropertyImage } = await import("./db/propertyImageDb.js");
      const deletedImage = await deletePropertyImage(input.imageId);

      // Note: S3 deletion not implemented in storage helper
      // Images remain in S3 but are removed from database
      // TODO: Implement S3 cleanup or use lifecycle policies

      return { success: true };
    }),
});
