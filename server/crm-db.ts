import { eq, desc, and, or, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  crmLeads,
  crmOpportunities,
  crmAccounts,
  crmContacts,
  crmCases,
  crmCaseComments,
  crmActivities,
  type InsertCrmLead,
  type InsertCrmOpportunity,
  type InsertCrmAccount,
  type InsertCrmContact,
  type InsertCrmCase,
  type InsertCrmCaseComment,
  type InsertCrmActivity,
} from "../drizzle/schema";

// ============================================
// LEADS
// ============================================

export async function createLead(lead: InsertCrmLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(crmLeads).values(lead);
  return result.insertId;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
  return lead || null;
}

export async function getLeads(filters?: {
  status?: string;
  assignedTo?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(crmLeads);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(crmLeads.status, filters.status as any));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(crmLeads.assignedTo, filters.assignedTo));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(crmLeads.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateLead(id: number, data: Partial<InsertCrmLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmLeads).set(data).where(eq(crmLeads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmLeads).where(eq(crmLeads.id, id));
}

export async function convertLead(leadId: number, data: {
  opportunityName: string;
  amount: number;
  accountId?: number;
  contactId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");
  
  // Create opportunity
  const [oppResult] = await db.insert(crmOpportunities).values({
    name: data.opportunityName,
    amount: data.amount.toString(),
    accountId: data.accountId,
    contactId: data.contactId,
    stage: "prospecting",
    probability: 10,
    assignedTo: lead.assignedTo,
    createdBy: lead.createdBy,
  });
  
  // Update lead status
  await db.update(crmLeads).set({
    status: "converted",
    convertedToOpportunityId: oppResult.insertId,
    convertedToAccountId: data.accountId,
    convertedToContactId: data.contactId,
    convertedAt: new Date(),
  }).where(eq(crmLeads.id, leadId));
  
  return oppResult.insertId;
}

// ============================================
// OPPORTUNITIES
// ============================================

export async function createOpportunity(opportunity: InsertCrmOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(crmOpportunities).values(opportunity);
  return result.insertId;
}

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [opp] = await db.select().from(crmOpportunities).where(eq(crmOpportunities.id, id));
  return opp || null;
}

export async function getOpportunities(filters?: {
  stage?: string;
  assignedTo?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(crmOpportunities);
  
  const conditions = [];
  if (filters?.stage) {
    conditions.push(eq(crmOpportunities.stage, filters.stage as any));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(crmOpportunities.assignedTo, filters.assignedTo));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(crmOpportunities.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateOpportunity(id: number, data: Partial<InsertCrmOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmOpportunities).set(data).where(eq(crmOpportunities.id, id));
}

export async function deleteOpportunity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmOpportunities).where(eq(crmOpportunities.id, id));
}

// ============================================
// ACCOUNTS
// ============================================

export async function createAccount(account: InsertCrmAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(crmAccounts).values(account);
  return result.insertId;
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [account] = await db.select().from(crmAccounts).where(eq(crmAccounts.id, id));
  return account || null;
}

export async function getAccounts(filters?: {
  type?: string;
  ownerId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(crmAccounts);
  
  const conditions = [];
  if (filters?.type) {
    conditions.push(eq(crmAccounts.type, filters.type as any));
  }
  if (filters?.ownerId) {
    conditions.push(eq(crmAccounts.ownerId, filters.ownerId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(crmAccounts.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateAccount(id: number, data: Partial<InsertCrmAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmAccounts).set(data).where(eq(crmAccounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmAccounts).where(eq(crmAccounts.id, id));
}

// ============================================
// CONTACTS
// ============================================

export async function createContact(contact: InsertCrmContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(crmContacts).values(contact);
  return result.insertId;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [contact] = await db.select().from(crmContacts).where(eq(crmContacts.id, id));
  return contact || null;
}

export async function getContacts(filters?: {
  accountId?: number;
  ownerId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(crmContacts);
  
  const conditions = [];
  if (filters?.accountId) {
    conditions.push(eq(crmContacts.accountId, filters.accountId));
  }
  if (filters?.ownerId) {
    conditions.push(eq(crmContacts.ownerId, filters.ownerId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(crmContacts.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateContact(id: number, data: Partial<InsertCrmContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmContacts).set(data).where(eq(crmContacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmContacts).where(eq(crmContacts.id, id));
}

// ============================================
// CASES
// ============================================

export async function createCase(caseData: InsertCrmCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate case number
  const caseNumber = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const [result] = await db.insert(crmCases).values({
    ...caseData,
    caseNumber,
  });
  return result.insertId;
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [caseRecord] = await db.select().from(crmCases).where(eq(crmCases.id, id));
  return caseRecord || null;
}

export async function getCases(filters?: {
  status?: string;
  priority?: string;
  assignedTo?: number;
  userId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(crmCases);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(crmCases.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(crmCases.priority, filters.priority as any));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(crmCases.assignedTo, filters.assignedTo));
  }
  if (filters?.userId) {
    conditions.push(eq(crmCases.userId, filters.userId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(crmCases.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateCase(id: number, data: Partial<InsertCrmCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmCases).set(data).where(eq(crmCases.id, id));
}

export async function deleteCase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmCases).where(eq(crmCases.id, id));
}

export async function addCaseComment(comment: InsertCrmCaseComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(crmCaseComments).values(comment);
  
  // Update case firstResponseAt if this is the first response
  const caseRecord = await getCaseById(comment.caseId);
  if (caseRecord && !caseRecord.firstResponseAt && !comment.isFromCustomer) {
    await db.update(crmCases).set({
      firstResponseAt: new Date(),
    }).where(eq(crmCases.id, comment.caseId));
  }
  
  return result.insertId;
}

export async function getCaseComments(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(crmCaseComments)
    .where(eq(crmCaseComments.caseId, caseId))
    .orderBy(crmCaseComments.createdAt);
}

// ============================================
// ACTIVITIES
// ============================================

export async function createActivity(activity: InsertCrmActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(crmActivities).values(activity);
  return result.insertId;
}

export async function getActivities(filters: {
  relatedToType?: string;
  relatedToId?: number;
  assignedTo?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(crmActivities);
  
  const conditions = [];
  if (filters.relatedToType && filters.relatedToId) {
    conditions.push(
      and(
        eq(crmActivities.relatedToType, filters.relatedToType as any),
        eq(crmActivities.relatedToId, filters.relatedToId)
      )
    );
  }
  if (filters.assignedTo) {
    conditions.push(eq(crmActivities.assignedTo, filters.assignedTo));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(crmActivities.createdAt)) as any;
  
  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateActivity(id: number, data: Partial<InsertCrmActivity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmActivities).set(data).where(eq(crmActivities.id, id));
}

export async function deleteActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmActivities).where(eq(crmActivities.id, id));
}

// ============================================
// ANALYTICS
// ============================================

export async function getLeadAnalytics() {
  const db = await getDb();
  if (!db) return null;
  
  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    new: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
    contacted: sql<number>`SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END)`,
    qualified: sql<number>`SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END)`,
    converted: sql<number>`SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END)`,
    lost: sql<number>`SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END)`,
  }).from(crmLeads);
  
  return stats;
}

export async function getOpportunityAnalytics() {
  const db = await getDb();
  if (!db) return null;
  
  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    totalValue: sql<string>`SUM(amount)`,
    prospecting: sql<number>`SUM(CASE WHEN stage = 'prospecting' THEN 1 ELSE 0 END)`,
    qualification: sql<number>`SUM(CASE WHEN stage = 'qualification' THEN 1 ELSE 0 END)`,
    proposal: sql<number>`SUM(CASE WHEN stage = 'proposal' THEN 1 ELSE 0 END)`,
    negotiation: sql<number>`SUM(CASE WHEN stage = 'negotiation' THEN 1 ELSE 0 END)`,
    closedWon: sql<number>`SUM(CASE WHEN stage = 'closed_won' THEN 1 ELSE 0 END)`,
    closedLost: sql<number>`SUM(CASE WHEN stage = 'closed_lost' THEN 1 ELSE 0 END)`,
  }).from(crmOpportunities);
  
  return stats;
}

export async function getCaseAnalytics() {
  const db = await getDb();
  if (!db) return null;
  
  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    new: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
    inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
    pendingCustomer: sql<number>`SUM(CASE WHEN status = 'pending_customer' THEN 1 ELSE 0 END)`,
    resolved: sql<number>`SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)`,
    closed: sql<number>`SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)`,
    avgSatisfaction: sql<number>`AVG(customerSatisfaction)`,
  }).from(crmCases);
  
  return stats;
}
