import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./adminRouters";
import { adminPermissionsRouter } from "./adminPermissionsRouter";
import { crmRouter } from "./crm-router";
import { helpDeskRouter } from "./routes/helpDesk";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getUserProfile,
  createOrUpdateUserProfile,
  getUserRecentActivity,
  getVerificationStatus,
  updateVerificationStatus,
  createKycDocument,
  getUserKycDocuments,
  updateKycDocumentStatus,
  createKycQuestionnaire,
  getUserKycQuestionnaire,
  getPendingKycVerifications,
  saveKycProgress,
  getKycProgress,
  clearKycProgress,
  getAvailableProperties,
  getPropertyById,
  searchProperties,
  getPropertyDocuments,
  getPropertyMedia,
  joinPropertyWaitlist,
  isUserOnWaitlist,
  saveProperty,
  unsaveProperty,
  getSavedProperties,
  isPropertySaved,
  getUserInvestments,
  getUserPortfolioSummary,
  getUserIncomeHistory,
  getUserTransactions,
  createInvestment,
  createTransaction,
  getUserNotifications,
  markNotificationAsRead,
  createNotification,
  getAllUsers,
  updateUserById,
  deleteUserById,
  createUser,
  bulkCreateUsers,
  getAdminPermissions,
  upsertAdminPermissions,
  getAllAdminPermissions,
} from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from './storage';
import * as notificationHelpers from "./notifications";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
  adminPermissions: adminPermissionsRouter,
  crm: crmRouter,
  helpDesk: helpDeskRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User Profile Management
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProfile(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        firstNameEn: z.string().optional(),
        lastNameEn: z.string().optional(),
        firstNameAr: z.string().optional(),
        lastNameAr: z.string().optional(),
        dateOfBirth: z.date().optional(),
        nationality: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        employmentStatus: z.string().optional(),
        employmentInfo: z.string().optional(),
        annualIncomeRange: z.string().optional(),
        investorType: z.enum(["individual", "institutional"]).optional(),
        preferredLanguage: z.enum(["en", "ar"]).optional(),
        preferredCurrency: z.enum(["USD", "EGP", "EUR", "GBP", "SAR", "AED"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createOrUpdateUserProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    uploadProfilePicture: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        
        // Convert base64 to buffer
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const fileExtension = input.mimeType.split('/')[1];
        const fileName = `profile-${ctx.user.id}-${Date.now()}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileName, buffer, input.mimeType);
        
        // Update user profile with new picture URL
        await createOrUpdateUserProfile({
          userId: ctx.user.id,
          profilePicture: url,
        });
        
        return { url };
      }),
    
    getVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
      return await getVerificationStatus(ctx.user.id);
    }),
    
    getRecentActivity: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).optional().default(10),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserRecentActivity(ctx.user.id, input?.limit || 10);
      }),
  }),

  // KYC/AML Verification
  kyc: router({
    uploadDocument: protectedProcedure
      .input(z.object({
        documentType: z.enum(["id_card", "passport", "proof_of_address", "income_verification", "accreditation"]),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createKycDocument({
          userId: ctx.user.id,
          ...input,
        });
        
        // Send notification that document is under review
        await notificationHelpers.notifyKYCDocumentPending(ctx.user.id, input.documentType);
        
        // Update verification status
        const docs = await getUserKycDocuments(ctx.user.id);
        const hasIdDoc = docs.some(d => (d.documentType === "id_card" || d.documentType === "passport") && d.status === "approved");
        const hasAddressDoc = docs.some(d => d.documentType === "proof_of_address" && d.status === "approved");
        
        await updateVerificationStatus(ctx.user.id, {
          documentsVerified: hasIdDoc && hasAddressDoc,
        });
        
        return { success: true };
      }),
    
    getDocuments: protectedProcedure.query(async ({ ctx }) => {
      return await getUserKycDocuments(ctx.user.id);
    }),
    
    submitQuestionnaire: protectedProcedure
      .input(z.object({
        annualIncome: z.string(),
        netWorth: z.string(),
        liquidAssets: z.string(),
        employmentStatus: z.string(),
        occupation: z.string(),
        investmentExperience: z.string(),
        realEstateExperience: z.string(),
        previousInvestments: z.string(),
        riskTolerance: z.string(),
        isAccredited: z.boolean(),
        accreditationType: z.string(),
        investmentGoals: z.string(),
        investmentHorizon: z.string(),
        expectedReturnRate: z.string(),
        sourceOfFunds: z.string(),
        sourceOfFundsDetails: z.string(),
        politicallyExposed: z.boolean(),
        pepDetails: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createKycQuestionnaire({
          userId: ctx.user.id,
          ...input,
        });
        
        // Send notification that questionnaire was submitted
        await notificationHelpers.notifyKYCQuestionnaireSubmitted(ctx.user.id);
        
        await updateVerificationStatus(ctx.user.id, {
          questionnaireCompleted: true,
        });
        
        return { success: true };
      }),
    
    getQuestionnaire: protectedProcedure.query(async ({ ctx }) => {
      return await getUserKycQuestionnaire(ctx.user.id);
    }),

    // KYC Progress Management
    saveProgress: protectedProcedure
      .input(z.object({
        currentStep: z.number(),
        personalInfoData: z.string().optional(),
        documentUploadData: z.string().optional(),
        questionnaireData: z.string().optional(),
        completionPercentage: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveKycProgress({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    getProgress: protectedProcedure.query(async ({ ctx }) => {
      return await getKycProgress(ctx.user.id);
    }),

    clearProgress: protectedProcedure.mutation(async ({ ctx }) => {
      await clearKycProgress(ctx.user.id);
      return { success: true };
    }),
  }),

  // Properties
  properties: router({
    list: publicProcedure
      .input(z.object({
        propertyType: z.string().optional(),
        investmentType: z.string().optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input && Object.keys(input).length > 0) {
          return await searchProperties(input);
        }
        return await getAvailableProperties();
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await getPropertyById(input.id);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        }
        return property;
      }),
    
    getDocuments: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await getPropertyDocuments(input.propertyId);
      }),
    
    getMedia: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await getPropertyMedia(input.propertyId);
      }),
    
    joinWaitlist: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await joinPropertyWaitlist(input.propertyId, ctx.user.id);
        
        // Create notification
        await createNotification({
          userId: ctx.user.id,
          type: "property",
          title: "Joined Waitlist",
          message: "You have successfully joined the waitlist for this property. We'll notify you when it becomes available.",
        });
        
        return { success: true };
      }),
    
    checkWaitlistStatus: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isOnWaitlist = await isUserOnWaitlist(input.propertyId, ctx.user.id);
        return { isOnWaitlist };
      }),
    
    saveProperty: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await saveProperty(ctx.user.id, input.propertyId);
        return { success: true };
      }),
    
    unsaveProperty: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await unsaveProperty(ctx.user.id, input.propertyId);
        return { success: true };
      }),
    
    getSavedProperties: protectedProcedure.query(async ({ ctx }) => {
      return await getSavedProperties(ctx.user.id);
    }),
    
    checkSavedStatus: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isSaved = await isPropertySaved(ctx.user.id, input.propertyId);
        return { isSaved };
      }),
  }),

  // Investments
  investments: router({
    create: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        amount: z.number(),
        shares: z.number(),
        sharePrice: z.number(),
        distributionFrequency: z.enum(["monthly", "quarterly", "annual"]),
        paymentMethod: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check verification status
        const verificationStatus = await getVerificationStatus(ctx.user.id);
        if (!verificationStatus?.canInvest) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Please complete KYC verification before investing" 
          });
        }
        
        // Calculate ownership percentage
        const property = await getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        }
        
        const ownershipPercentage = Math.round((input.shares / property.totalShares) * 1000000);
        
        // Create investment
        const result = await createInvestment({
          userId: ctx.user.id,
          propertyId: input.propertyId,
          amount: input.amount,
          shares: input.shares,
          sharePrice: input.sharePrice,
          ownershipPercentage,
          distributionFrequency: input.distributionFrequency,
          paymentMethod: input.paymentMethod,
          status: "pending",
          paymentStatus: "pending",
        });
        
        // Create transaction record
        await createTransaction({
          userId: ctx.user.id,
          type: "investment",
          amount: input.amount,
          status: "pending",
          paymentMethod: input.paymentMethod,
        });
        
        // Create notification
        await createNotification({
          userId: ctx.user.id,
          type: "investment",
          title: "Investment Created",
          message: `Your investment of $${(input.amount / 100).toFixed(2)} is pending payment confirmation.`,
        });
        
        return { success: true };
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserInvestments(ctx.user.id);
    }),
  }),

  // Portfolio
  portfolio: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPortfolioSummary(ctx.user.id);
    }),
    
    incomeHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getUserIncomeHistory(ctx.user.id);
    }),
    
    transactions: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTransactions(ctx.user.id);
    }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserNotifications(ctx.user.id, input?.unreadOnly);
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.id);
        return { success: true };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        // Send notification to owner
        await notifyOwner({
          title: `New Contact Form Submission from ${input.name}`,
          content: `Subject: ${input.subject}\n\nFrom: ${input.name} (${input.email})\n\nMessage:\n${input.message}`,
        });
        
        return { success: true };
      }),
  }),

  // Super Admin User Management
  userManagement: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Super admin access required' });
      }
      return await getAllUsers();
    }),

    create: protectedProcedure
      .input(z.object({
        openId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(['user', 'admin', 'super_admin']).default('user'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Super admin access required' });
        }
        return await createUser(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(['user', 'admin', 'super_admin']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Super admin access required' });
        }
        const { id, ...updates } = input;
        await updateUserById(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Super admin access required' });
        }
        await deleteUserById(input.id);
        return { success: true };
      }),

    bulkImport: protectedProcedure
      .input(z.object({
        users: z.array(z.object({
          openId: z.string(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          role: z.enum(['user', 'admin', 'super_admin']).default('user'),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check permissions
        const permissions = await getAdminPermissions(ctx.user.id);
        if (ctx.user.role !== 'super_admin' && !permissions?.canBulkUploadUsers) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Bulk upload users permission required' });
        }
        return await bulkCreateUsers(input.users);
      }),
  }),

  // Admin routes moved to adminRouters.ts
});

export type AppRouter = typeof appRouter;
