import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as crmDb from "./crm-db";

// ============================================
// LEADS ROUTER
// ============================================

const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      assignedTo: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await crmDb.getLeads(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lead = await crmDb.getLeadById(input.id);
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
      return lead;
    }),

  create: protectedProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      source: z.enum(["website", "referral", "social_media", "facebook", "instagram", "whatsapp", "event", "advertisement", "other"]),
      industry: z.string().optional(),
      investmentInterest: z.string().optional(),
      budget: z.number().optional(),
      notes: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.createLead({
        ...input,
        budget: input.budget?.toString(),
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  createPublic: publicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.enum(["website", "referral", "social_media", "facebook", "instagram", "whatsapp", "event", "advertisement", "other"]),
      investmentInterest: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Public lead creation - no authentication required
      const id = await crmDb.createLead({
        ...input,
        status: "new",
        score: 0,
        createdBy: null, // No user context for public submissions
      });
      return { id, success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      source: z.enum(["website", "referral", "social_media", "event", "advertisement", "other"]).optional(),
      status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
      score: z.number().optional(),
      industry: z.string().optional(),
      investmentInterest: z.string().optional(),
      budget: z.number().optional(),
      notes: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await crmDb.updateLead(id, {
        ...data,
        budget: data.budget?.toString(),
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await crmDb.deleteLead(input.id);
      return { success: true };
    }),

  convert: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      opportunityName: z.string(),
      amount: z.number(),
      accountId: z.number().optional(),
      contactId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const opportunityId = await crmDb.convertLead(input.leadId, {
        opportunityName: input.opportunityName,
        amount: input.amount,
        accountId: input.accountId,
        contactId: input.contactId,
      });
      return { opportunityId };
    }),

  analytics: protectedProcedure
    .query(async () => {
      return await crmDb.getLeadAnalytics();
    }),
});

// ============================================
// OPPORTUNITIES ROUTER
// ============================================

const opportunitiesRouter = router({
  list: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      assignedTo: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await crmDb.getOpportunities(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const opp = await crmDb.getOpportunityById(input.id);
      if (!opp) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Opportunity not found" });
      }
      return opp;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      accountId: z.number().optional(),
      contactId: z.number().optional(),
      amount: z.number(),
      stage: z.enum(["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]).default("prospecting"),
      probability: z.number().default(10),
      expectedCloseDate: z.string().optional(),
      propertyId: z.number().optional(),
      propertyType: z.string().optional(),
      investmentAmount: z.number().optional(),
      numberOfShares: z.number().optional(),
      source: z.string().optional(),
      description: z.string().optional(),
      nextStep: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.createOpportunity({
        ...input,
        amount: input.amount.toString(),
        investmentAmount: input.investmentAmount?.toString(),
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      accountId: z.number().optional(),
      contactId: z.number().optional(),
      amount: z.number().optional(),
      stage: z.enum(["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
      probability: z.number().optional(),
      expectedCloseDate: z.string().optional(),
      actualCloseDate: z.string().optional(),
      propertyId: z.number().optional(),
      propertyType: z.string().optional(),
      investmentAmount: z.number().optional(),
      numberOfShares: z.number().optional(),
      source: z.string().optional(),
      description: z.string().optional(),
      nextStep: z.string().optional(),
      competitorInfo: z.string().optional(),
      lossReason: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await crmDb.updateOpportunity(id, {
        ...data,
        amount: data.amount?.toString(),
        investmentAmount: data.investmentAmount?.toString(),
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        actualCloseDate: data.actualCloseDate ? new Date(data.actualCloseDate) : undefined,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await crmDb.deleteOpportunity(input.id);
      return { success: true };
    }),

  analytics: protectedProcedure
    .query(async () => {
      return await crmDb.getOpportunityAnalytics();
    }),
});

// ============================================
// ACCOUNTS ROUTER
// ============================================

const accountsRouter = router({
  list: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      ownerId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await crmDb.getAccounts(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const account = await crmDb.getAccountById(input.id);
      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }
      return account;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["investor", "partner", "vendor", "other"]).default("investor"),
      industry: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      billingAddress: z.string().optional(),
      shippingAddress: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      annualRevenue: z.number().optional(),
      numberOfEmployees: z.number().optional(),
      description: z.string().optional(),
      parentAccountId: z.number().optional(),
      ownerId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.createAccount({
        ...input,
        annualRevenue: input.annualRevenue?.toString(),
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(["investor", "partner", "vendor", "other"]).optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      billingAddress: z.string().optional(),
      shippingAddress: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      annualRevenue: z.number().optional(),
      numberOfEmployees: z.number().optional(),
      description: z.string().optional(),
      parentAccountId: z.number().optional(),
      ownerId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await crmDb.updateAccount(id, {
        ...data,
        annualRevenue: data.annualRevenue?.toString(),
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await crmDb.deleteAccount(input.id);
      return { success: true };
    }),
});

// ============================================
// CONTACTS ROUTER
// ============================================

const contactsRouter = router({
  list: protectedProcedure
    .input(z.object({
      accountId: z.number().optional(),
      ownerId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await crmDb.getContacts(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const contact = await crmDb.getContactById(input.id);
      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }
      return contact;
    }),

  create: protectedProcedure
    .input(z.object({
      accountId: z.number().optional(),
      userId: z.number().optional(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      title: z.string().optional(),
      department: z.string().optional(),
      isPrimary: z.boolean().default(false),
      mailingAddress: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      birthdate: z.string().optional(),
      description: z.string().optional(),
      ownerId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.createContact({
        ...input,
        birthdate: input.birthdate ? new Date(input.birthdate) : undefined,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      accountId: z.number().optional(),
      userId: z.number().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      title: z.string().optional(),
      department: z.string().optional(),
      isPrimary: z.boolean().optional(),
      mailingAddress: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      birthdate: z.string().optional(),
      description: z.string().optional(),
      ownerId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await crmDb.updateContact(id, {
        ...data,
        birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await crmDb.deleteContact(input.id);
      return { success: true };
    }),
});

// ============================================
// CASES ROUTER
// ============================================

const casesRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      assignedTo: z.number().optional(),
      userId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await crmDb.getCases(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const caseRecord = await crmDb.getCaseById(input.id);
      if (!caseRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
      }
      return caseRecord;
    }),

  create: protectedProcedure
    .input(z.object({
      subject: z.string(),
      description: z.string().optional(),
      status: z.enum(["new", "in_progress", "pending_customer", "resolved", "closed"]).default("new"),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      type: z.enum(["question", "problem", "feature_request", "complaint"]).default("question"),
      origin: z.enum(["web", "email", "phone", "chat", "social_media"]).default("web"),
      accountId: z.number().optional(),
      contactId: z.number().optional(),
      userId: z.number().optional(),
      propertyId: z.number().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.createCase({
        ...input,
        caseNumber: "", // Will be generated in createCase
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["new", "in_progress", "pending_customer", "resolved", "closed"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      type: z.enum(["question", "problem", "feature_request", "complaint"]).optional(),
      accountId: z.number().optional(),
      contactId: z.number().optional(),
      userId: z.number().optional(),
      propertyId: z.number().optional(),
      assignedTo: z.number().optional(),
      escalated: z.boolean().optional(),
      resolution: z.string().optional(),
      customerSatisfaction: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      // Auto-set resolvedAt when status changes to resolved
      if (data.status === "resolved") {
        const caseRecord = await crmDb.getCaseById(id);
        if (caseRecord && !caseRecord.resolvedAt) {
          await crmDb.updateCase(id, {
            ...data,
            resolvedAt: new Date(),
          });
          return { success: true };
        }
      }
      
      // Auto-set closedAt when status changes to closed
      if (data.status === "closed") {
        const caseRecord = await crmDb.getCaseById(id);
        if (caseRecord && !caseRecord.closedAt) {
          await crmDb.updateCase(id, {
            ...data,
            closedAt: new Date(),
          });
          return { success: true };
        }
      }
      
      await crmDb.updateCase(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await crmDb.deleteCase(input.id);
      return { success: true };
    }),

  addComment: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      comment: z.string(),
      isInternal: z.boolean().default(false),
      isFromCustomer: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.addCaseComment({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  getComments: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await crmDb.getCaseComments(input.caseId);
    }),

  analytics: protectedProcedure
    .query(async () => {
      return await crmDb.getCaseAnalytics();
    }),
});

// ============================================
// ACTIVITIES ROUTER
// ============================================

const activitiesRouter = router({
  list: protectedProcedure
    .input(z.object({
      relatedToType: z.enum(["lead", "opportunity", "account", "contact", "case"]).optional(),
      relatedToId: z.number().optional(),
      assignedTo: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await crmDb.getActivities(input);
    }),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(["note", "task", "call", "email", "meeting"]),
      subject: z.string(),
      description: z.string().optional(),
      status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("planned"),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      dueDate: z.string().optional(),
      relatedToType: z.enum(["lead", "opportunity", "account", "contact", "case"]).optional(),
      relatedToId: z.number().optional(),
      assignedTo: z.number().optional(),
      isInternal: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await crmDb.createActivity({
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      // Auto-set completedAt when status changes to completed
      if (data.status === "completed") {
        await crmDb.updateActivity(id, {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          completedAt: new Date(),
        });
        return { success: true };
      }
      
      await crmDb.updateActivity(id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await crmDb.deleteActivity(input.id);
      return { success: true };
    }),
});

// ============================================
// MAIN CRM ROUTER
// ============================================

export const crmRouter = router({
  leads: leadsRouter,
  opportunities: opportunitiesRouter,
  accounts: accountsRouter,
  contacts: contactsRouter,
  cases: casesRouter,
  activities: activitiesRouter,
});
