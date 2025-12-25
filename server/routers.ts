import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./adminRouters";
import { adminPermissionsRouter } from "./adminPermissionsRouter";
import { adminRolesRouter } from "./adminRolesRouter";
import { crmRouter } from "./crm-router";
import { helpDeskRouter } from "./routes/helpDesk";
import { contentRouter } from "./contentRouter";
import { mediaLibraryRouter } from "./mediaLibraryRouter";
import { securityRouter } from "./securityRouter";
import { ipBlockingRouter } from "./ipBlockingRouter";
import { securitySettingsRouter } from "./securitySettingsRouter";
import { twoFactorRouter } from "./twoFactorRouter";
import { trustedDevicesRouter } from "./trustedDevicesRouter";
import { emailTemplatesRouter } from "./emailTemplatesRouter";
import { legalDocumentsRouter } from "./legalDocumentsRouter";
import { customFieldsRouter } from "./customFieldsRouter";
import { customFieldTemplatesRouter } from "./customFieldTemplatesRouter";
import { investmentTransactionRouter } from "./investmentTransactionRouter";
import { platformSettingsRouter } from "./routes/platformSettings";
import { propertyManagementRouter } from "./routes/propertyManagement";
import { fundraiserRouter } from "./routes/fundraiser";
import { incomeDistributionRouter } from "./routes/incomeDistribution";
import { offeringsRouter } from "./routes/offerings";
import { approvalsRouter } from "./routes/approvals";
import { investmentFlowRouter } from "./routes/investmentFlow";
import { standardAuthRouter } from "./routes/standardAuth";
import { localAuthRouter } from "./routes/localAuth";
import { monitoringRouter } from "./routes/monitoring";
import { sessionManagementRouter } from "./routes/sessionManagement";
import { accessRequestsRouter } from "./routes/accessRequests";
import { termsRouter } from "./routes/terms";
import { propertyInterestsRouter } from "./routes/propertyInterests";
import { rbacMenuRouter } from "./routes/rbacMenu";
// import { getUnifiedPortfolioSummary } from "./db/unifiedInvestmentsDb";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
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
  getOrCreateUserWallet,
  getWalletBalance,
  addBankAccount,
  getUserBankAccounts,
  setDefaultBankAccount,
  deleteBankAccount,
  createWalletTransaction,
  getWalletTransactions,
  completeDepositTransaction,
  completeWithdrawalTransaction,
  upsertAdminPermissions,
  getAllAdminPermissions,
  getPendingWalletTransactions,
  getAllWalletTransactions,
  approveWalletTransaction,
  rejectWalletTransaction,
  getUserInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoiceWithDetails,
} from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from './storage';
import * as notificationHelpers from "./notifications";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
  accessRequests: accessRequestsRouter,
  adminPermissions: adminPermissionsRouter,
  adminRoles: adminRolesRouter,
  crm: crmRouter,
  helpDesk: helpDeskRouter,
  content: contentRouter,
  mediaLibrary: mediaLibraryRouter,
  security: securityRouter,
  ipBlocking: ipBlockingRouter,
  securitySettings: securitySettingsRouter,
  twoFactor: twoFactorRouter,
  trustedDevices: trustedDevicesRouter,
  emailTemplates: emailTemplatesRouter,
  legalDocuments: legalDocumentsRouter,
  customFields: customFieldsRouter,
  customFieldTemplates: customFieldTemplatesRouter,
  investmentTransactions: investmentTransactionRouter,
  platformSettings: platformSettingsRouter,
  propertyManagement: propertyManagementRouter,
  fundraiser: fundraiserRouter,
  incomeDistribution: incomeDistributionRouter,
  offerings: offeringsRouter,
  approvals: approvalsRouter,
  investmentFlow: investmentFlowRouter,
  monitoring: monitoringRouter,
  sessionManagement: sessionManagementRouter,
  terms: termsRouter,
  propertyInterests: propertyInterestsRouter,
  rbacMenu: rbacMenuRouter,
  
  // Standard email/password authentication
  standardAuth: standardAuthRouter,
  
  // Local password management
  localAuth: localAuthRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      console.log('[Logout] Cookie name:', COOKIE_NAME);
      console.log('[Logout] Cookie options:', JSON.stringify(cookieOptions, null, 2));
      
      // Set cookie to invalid value instead of trying to clear it
      // This ensures the token will be rejected by the backend
      ctx.res.cookie(COOKIE_NAME, "LOGGED_OUT", {
        ...cookieOptions,
        maxAge: 1000, // 1 second expiry
      });
      
      console.log('[Logout] Cookie set to invalid value');
      return {
        success: true,
      } as const;
    }),
    
    // Password Reset
    validateResetToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const { passwordResetTokens } = await import("../drizzle/schema");
        const { eq, and, gt } = await import("drizzle-orm");
        
        const tokens = await db.select()
          .from(passwordResetTokens)
          .where(
            and(
              eq(passwordResetTokens.token, input.token),
              eq(passwordResetTokens.used, false),
              gt(passwordResetTokens.expiresAt, new Date())
            )
          )
          .limit(1);
        
        if (tokens.length === 0) {
          return { valid: false, message: "Token is invalid or expired" };
        }
        
        return { valid: true };
      }),
    
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        // Validate password strength
        const { validatePasswordStrength } = await import("./_core/security");
        const passwordValidation = validatePasswordStrength(input.newPassword);
        if (!passwordValidation.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: passwordValidation.message });
        }
        
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const { passwordResetTokens, users } = await import("../drizzle/schema");
        const { eq, and, gt } = await import("drizzle-orm");
        const bcrypt = await import("bcrypt");
        
        // Validate token
        const tokens = await db.select()
          .from(passwordResetTokens)
          .where(
            and(
              eq(passwordResetTokens.token, input.token),
              eq(passwordResetTokens.used, false),
              gt(passwordResetTokens.expiresAt, new Date())
            )
          )
          .limit(1);
        
        if (tokens.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token is invalid or expired" });
        }
        
        const tokenRecord = tokens[0];
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        
        // Update user password
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, tokenRecord.userId));
        
        // Mark token as used
        await db.update(passwordResetTokens)
          .set({ used: true })
          .where(eq(passwordResetTokens.id, tokenRecord.id));
        
        // Create audit log
        const { createAuditLog } = await import("./permissionsDb");
        await createAuditLog({
          userId: tokenRecord.userId,
          action: "password_reset_completed",
          targetType: "user",
          targetId: tokenRecord.userId,
          details: "User completed password reset",
        });
        
        return { success: true };
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
        
        // Upload to S3 storage
        const fileKey = `profiles/${fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
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
      .query(async ({ input, ctx }) => {
        const isAuthenticated = !!ctx.user;
        if (input && Object.keys(input).length > 0) {
          return await searchProperties({ ...input, isAuthenticated });
        }
        return await getAvailableProperties(isAuthenticated);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const isAuthenticated = !!ctx.user;
        const property = await getPropertyById(input.id, isAuthenticated);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Property not found or requires authentication" });
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
        // Check if user's email is verified
        if (!ctx.user.emailVerified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Please verify your email address before joining the waitlist. Check your inbox for the verification link.",
          });
        }

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
        
        // Get the inserted investment ID
        const investmentId = (result as any).insertId as number;
        
        // Create transaction record
        const transactionResult = await createTransaction({
          userId: ctx.user.id,
          type: "investment",
          amount: input.amount,
          status: "pending",
          paymentMethod: input.paymentMethod,
          relatedInvestmentId: investmentId,
        });
        
        // Generate proforma invoice
        const { createInvoice } = await import("./db");
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay
        
        const invoiceResult = await createInvoice({
          userId: ctx.user.id,
          investmentId: investmentId,
          propertyId: input.propertyId,
          amount: input.amount,
          shares: input.shares,
          sharePrice: input.sharePrice,
          currency: "USD",
          status: "pending",
          dueDate,
          invoiceNumber: "", // Will be auto-generated
        });
        
        // Send invoice notification email
        try {
          const { sendInvoiceEmail } = await import("./_core/emailService");
          const { getInvoiceById } = await import("./db");
          
          // Get the created invoice by ID
          const createdInvoice = await getInvoiceById((invoiceResult as any).insertId);
          
          if (createdInvoice && ctx.user.email) {
            const invoiceUrl = `${process.env.VITE_APP_URL || "https://emtelaak.com"}/invoices`;
            
            await sendInvoiceEmail({
              to: ctx.user.email,
              userName: ctx.user.name || "Investor",
              invoiceNumber: createdInvoice.invoiceNumber,
              propertyName: property.name,
              amount: input.amount,
              shares: input.shares,
              dueDate,
              invoiceUrl,
            });
          }
        } catch (emailError) {
          console.error("Failed to send invoice email:", emailError);
          // Don't fail the investment creation if email fails
        }
        
        // Create notification
        await createNotification({
          userId: ctx.user.id,
          type: "investment",
          title: "Investment Created",
          message: `Your investment of $${(input.amount / 100).toFixed(2)} is pending payment confirmation.`,
        });
        
        return { success: true };
      }), // End of create mutation
    
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserInvestments(ctx.user.id);
    }),
  }), // End of investments router

  // Portfolio
  portfolio: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      // Use unified query to show investments from BOTH old and new systems
      const { getUnifiedPortfolioSummary } = await import("./db/unifiedInvestmentsDb");
      return await getUnifiedPortfolioSummary(ctx.user.id);
    }),
    
    incomeHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getUserIncomeHistory } = await import("./db/incomeDistributionDb");
      return await getUserIncomeHistory(ctx.user.id);
    }),
    
    transactions: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTransactions(ctx.user.id);
    }),
  }),

  // Invoices
  invoices: router({  
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserInvoices(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        return await getInvoiceWithDetails(input.id);
      }),
    
    markAsPaid: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        transactionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        
        await updateInvoiceStatus(input.id, "paid", new Date(), input.transactionId);
        
        // Update related investment status
        if (invoice.investmentId) {
          const { updateInvestmentStatus } = await import("./db");
          await updateInvestmentStatus(invoice.investmentId, "confirmed");
        }
        
        // Create notification
        await createNotification({
          userId: ctx.user.id,
          type: "system",
          title: "Payment Confirmed",
          message: `Your payment for invoice ${invoice.invoiceNumber} has been confirmed.`,
        });
        
        // Send investment confirmation email
        if (invoice.investmentId) {
          try {
            const { generateInvestmentConfirmationEmail, sendEmail } = await import("./_core/emailService");
            const property = await getPropertyById(invoice.propertyId);
            
            if (ctx.user.email && property) {
              const emailContent = generateInvestmentConfirmationEmail({
                userName: ctx.user.name || "Investor",
                propertyName: property.name,
                shares: invoice.shares,
                amount: invoice.amount,
                investmentDate: new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                }),
                invoiceUrl: `${process.env.VITE_APP_URL || "https://emtelaak.com"}/invoices`,
              });
              
              await sendEmail({
                to: ctx.user.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              });
            }
          } catch (emailError) {
            console.error("Failed to send investment confirmation email:", emailError);
          }
        }
        
        return { success: true };
      }),
    
    downloadPdf: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        
        const invoiceDetails = await getInvoiceWithDetails(input.id);
        if (!invoiceDetails) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice details not found" });
        }
        
        const { generateInvoiceHTML } = await import("./invoicePdf");
        const html = generateInvoiceHTML(invoiceDetails);
        
        return { html, invoiceNumber: invoice.invoiceNumber };
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

  // Wallet Management
  wallet: router({
    // Get wallet balance
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const wallet = await getOrCreateUserWallet(ctx.user.id);
      return {
        balance: wallet?.balance || 0,
        currency: wallet?.currency || "EGP",
        balanceEGP: (wallet?.balance || 0) / 100, // Convert cents to EGP
      };
    }),

    // Get transaction history
    getTransactions: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        return await getWalletTransactions(ctx.user.id, input.limit);
      }),

    // Bank Account Management
    addBankAccount: protectedProcedure
      .input(z.object({
        bankName: z.string().min(1),
        accountNumber: z.string().min(1),
        iban: z.string().optional(),
        accountHolderName: z.string().min(1),
        isDefault: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await addBankAccount({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    getBankAccounts: protectedProcedure.query(async ({ ctx }) => {
      return await getUserBankAccounts(ctx.user.id);
    }),

    setDefaultBankAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await setDefaultBankAccount(ctx.user.id, input.accountId);
        return { success: true };
      }),

    deleteBankAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteBankAccount(ctx.user.id, input.accountId);
        return { success: true };
      }),

    // Deposit Operations
    depositBankTransfer: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        receiptUrl: z.string().url(),
        reference: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const amountCents = Math.round(input.amount * 100);
        await createWalletTransaction({
          userId: ctx.user.id,
          type: "deposit",
          amount: amountCents,
          status: "pending",
          paymentMethod: "bank_transfer",
          receiptUrl: input.receiptUrl,
          reference: input.reference,
          description: `Bank transfer deposit of EGP ${input.amount}`,
        });
        return { success: true, message: "Deposit request submitted. Pending admin approval." };
      }),

    depositFawry: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        reference: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const amountCents = Math.round(input.amount * 100);
        await createWalletTransaction({
          userId: ctx.user.id,
          type: "deposit",
          amount: amountCents,
          status: "pending",
          paymentMethod: "fawry",
          reference: input.reference,
          description: `Fawry deposit of EGP ${input.amount}`,
        });
        return { success: true, message: "Fawry payment pending verification." };
      }),

    depositCard: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        reference: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const amountCents = Math.round(input.amount * 100);
        await createWalletTransaction({
          userId: ctx.user.id,
          type: "deposit",
          amount: amountCents,
          status: "pending",
          paymentMethod: "card",
          reference: input.reference,
          description: `Card deposit of EGP ${input.amount}`,
        });
        return { success: true, message: "Card payment processing." };
      }),

    // Withdrawal Operations
    requestWithdrawal: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        bankAccountId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const balance = await getWalletBalance(ctx.user.id);
        const amountCents = Math.round(input.amount * 100);

        if (balance < amountCents) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance",
          });
        }

        await createWalletTransaction({
          userId: ctx.user.id,
          type: "withdrawal",
          amount: amountCents,
          status: "pending",
          paymentMethod: "bank_transfer",
          reference: `Bank Account ID: ${input.bankAccountId}`,
          description: `Withdrawal of EGP ${input.amount} to bank account`,
        });

        return { success: true, message: "Withdrawal request submitted. Pending admin approval." };
      }),

    // Admin Operations
    admin: router({
      getPendingTransactions: adminProcedure.query(async () => {
        return await getPendingWalletTransactions();
      }),

      getAllTransactions: adminProcedure
        .input(z.object({
          status: z.enum(["pending", "completed", "failed", "cancelled", "all"]).optional().default("all"),
          type: z.enum(["deposit", "withdrawal", "all"]).optional().default("all"),
          limit: z.number().optional().default(100),
        }))
        .query(async ({ input }) => {
          return await getAllWalletTransactions(input);
        }),

      approveTransaction: adminProcedure
        .input(z.object({ transactionId: z.number() }))
        .mutation(async ({ input }) => {
          await approveWalletTransaction(input.transactionId);
          return { success: true, message: "Transaction approved successfully" };
        }),

      rejectTransaction: adminProcedure
        .input(z.object({
          transactionId: z.number(),
          reason: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          await rejectWalletTransaction(input.transactionId, input.reason);
          return { success: true, message: "Transaction rejected" };
        }),
    }),
  }),

  // Admin routes moved to adminRouters.ts
});

export type AppRouter = typeof appRouter;
