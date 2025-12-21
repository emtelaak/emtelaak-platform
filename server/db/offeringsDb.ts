import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { 
  offerings, 
  offeringFinancialProjections,
  offeringFees,
  offeringDocuments,
  offeringTimeline,
  offeringStatusHistory,
  offeringApprovals,
  type Offering,
  type InsertOffering,
  type InsertOfferingFinancialProjection,
  type InsertOfferingFee,
  type InsertOfferingDocument,
  type InsertOfferingTimeline,
  type InsertOfferingStatusHistory,
  type InsertOfferingApproval
} from "../../drizzle/offerings-schema";
import { properties } from "../../drizzle/schema";

/**
 * OFFERINGS DATABASE HELPERS
 * Phase 1: Core Offering Management
 */

// ============================================
// OFFERING CRUD OPERATIONS
// ============================================

export async function createOffering(data: InsertOffering) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [offering] = await db.insert(offerings).values(data).$returningId();
  
  // Create initial status history entry
  await db.insert(offeringStatusHistory).values({
    offeringId: offering.id,
    previousStatus: null,
    newStatus: data.status || "draft",
    changedBy: data.fundraiserId,
    changeReason: "Offering created",
  });

  // Create initial timeline milestone
  await db.insert(offeringTimeline).values({
    offeringId: offering.id,
    milestoneType: "offering_created",
    milestoneName: "Offering Created",
    milestoneDescription: "Initial offering created by fundraiser",
    actualDate: new Date(),
    isCompleted: true,
    completedBy: data.fundraiserId,
  });

  return offering;
}

export async function getOfferingById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [offering] = await db
    .select()
    .from(offerings)
    .where(eq(offerings.id, id))
    .limit(1);

  return offering || null;
}

export async function getOfferingWithProperty(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db
    .select({
      offering: offerings,
      property: properties,
    })
    .from(offerings)
    .leftJoin(properties, eq(offerings.propertyId, properties.id))
    .where(eq(offerings.id, id))
    .limit(1);

  return result || null;
}

export async function getOfferingsByFundraiserId(fundraiserId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(offerings)
    .where(eq(offerings.fundraiserId, fundraiserId))
    .orderBy(desc(offerings.createdAt));
}

export async function getOfferingsByStatus(status: Offering["status"]) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(offerings)
    .where(eq(offerings.status, status))
    .orderBy(desc(offerings.createdAt));
}

export async function updateOffering(id: number, data: Partial<InsertOffering>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(offerings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(offerings.id, id));

  return await getOfferingById(id);
}

export async function deleteOffering(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(offerings).where(eq(offerings.id, id));
}

// ============================================
// OFFERING STATUS MANAGEMENT
// ============================================

export async function updateOfferingStatus(
  offeringId: number,
  newStatus: Offering["status"],
  changedBy: number,
  reason?: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offering = await getOfferingById(offeringId);
  if (!offering) throw new Error("Offering not found");

  const previousStatus = offering.status;

  // Update offering status
  await db
    .update(offerings)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(offerings.id, offeringId));

  // Record status change in history
  await db.insert(offeringStatusHistory).values({
    offeringId,
    previousStatus,
    newStatus,
    changedBy,
    changeReason: reason,
    changeNotes: notes,
  });

  // Create timeline milestone for significant status changes
  const milestoneMap: Record<string, any> = {
    under_review: { type: "submitted_for_review", name: "Submitted for Review" },
    approved: { type: "approved", name: "Offering Approved" },
    funding: { type: "funding_started", name: "Funding Started" },
    fully_funded: { type: "fully_funded", name: "Fully Funded" },
    closed: { type: "offering_closed", name: "Offering Closed" },
  };

  if (milestoneMap[newStatus]) {
    await db.insert(offeringTimeline).values({
      offeringId,
      milestoneType: milestoneMap[newStatus].type,
      milestoneName: milestoneMap[newStatus].name,
      actualDate: new Date(),
      isCompleted: true,
      completedBy: changedBy,
    });
  }

  return await getOfferingById(offeringId);
}

export async function getOfferingStatusHistory(offeringId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(offeringStatusHistory)
    .where(eq(offeringStatusHistory.offeringId, offeringId))
    .orderBy(desc(offeringStatusHistory.changedAt));
}

// ============================================
// FINANCIAL PROJECTIONS
// ============================================

export async function createFinancialProjection(data: InsertOfferingFinancialProjection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [projection] = await db
    .insert(offeringFinancialProjections)
    .values(data)
    .$returningId();

  return projection;
}

export async function getFinancialProjection(offeringId: number) {
  const db = await getDb();
  if (!db) return null;

  const [projection] = await db
    .select()
    .from(offeringFinancialProjections)
    .where(eq(offeringFinancialProjections.offeringId, offeringId))
    .limit(1);

  return projection || null;
}

export async function updateFinancialProjection(
  offeringId: number,
  data: Partial<InsertOfferingFinancialProjection>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(offeringFinancialProjections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(offeringFinancialProjections.offeringId, offeringId));

  return await getFinancialProjection(offeringId);
}

// ============================================
// FEE STRUCTURE
// ============================================

export async function createOfferingFees(data: InsertOfferingFee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [fees] = await db.insert(offeringFees).values(data).$returningId();
  return fees;
}

export async function getOfferingFees(offeringId: number) {
  const db = await getDb();
  if (!db) return null;

  const [fees] = await db
    .select()
    .from(offeringFees)
    .where(eq(offeringFees.offeringId, offeringId))
    .limit(1);

  return fees || null;
}

export async function updateOfferingFees(
  offeringId: number,
  data: Partial<InsertOfferingFee>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(offeringFees)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(offeringFees.offeringId, offeringId));

  return await getOfferingFees(offeringId);
}

// ============================================
// DOCUMENTS
// ============================================

export async function createOfferingDocument(data: InsertOfferingDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If this is a new version of an existing document, mark the old one as not latest
  if (data.previousVersionId) {
    await db
      .update(offeringDocuments)
      .set({ isLatestVersion: false })
      .where(eq(offeringDocuments.id, data.previousVersionId));
  }

  const [document] = await db
    .insert(offeringDocuments)
    .values(data)
    .$returningId();

  return document;
}

export async function getOfferingDocuments(offeringId: number, latestOnly = true) {
  const db = await getDb();
  if (!db) return [];

  const query = db
    .select()
    .from(offeringDocuments)
    .where(
      latestOnly
        ? and(
            eq(offeringDocuments.offeringId, offeringId),
            eq(offeringDocuments.isLatestVersion, true)
          )
        : eq(offeringDocuments.offeringId, offeringId)
    )
    .orderBy(desc(offeringDocuments.uploadedAt));

  return await query;
}

export async function getOfferingDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [document] = await db
    .select()
    .from(offeringDocuments)
    .where(eq(offeringDocuments.id, id))
    .limit(1);

  return document || null;
}

export async function deleteOfferingDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(offeringDocuments).where(eq(offeringDocuments.id, id));
}

// ============================================
// TIMELINE
// ============================================

export async function createTimelineMilestone(data: InsertOfferingTimeline) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [milestone] = await db
    .insert(offeringTimeline)
    .values(data)
    .$returningId();

  return milestone;
}

export async function getOfferingTimeline(offeringId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(offeringTimeline)
    .where(eq(offeringTimeline.offeringId, offeringId))
    .orderBy(offeringTimeline.targetDate);
}

export async function updateTimelineMilestone(
  id: number,
  data: Partial<InsertOfferingTimeline>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(offeringTimeline)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(offeringTimeline.id, id));
}

export async function completeTimelineMilestone(
  id: number,
  completedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(offeringTimeline)
    .set({
      isCompleted: true,
      actualDate: new Date(),
      completedBy,
      updatedAt: new Date(),
    })
    .where(eq(offeringTimeline.id, id));
}

export async function deleteTimelineMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(offeringTimeline)
    .where(eq(offeringTimeline.id, id));
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

export async function createApprovalRequest(data: InsertOfferingApproval) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [approval] = await db
    .insert(offeringApprovals)
    .values(data)
    .$returningId();

  return approval;
}

export async function getOfferingApprovals(offeringId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(offeringApprovals)
    .where(eq(offeringApprovals.offeringId, offeringId))
    .orderBy(desc(offeringApprovals.createdAt));
}

export async function getPendingApprovals(reviewerId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(offeringApprovals.decision, "pending")];
  if (reviewerId) {
    conditions.push(eq(offeringApprovals.reviewerId, reviewerId));
  }

  return await db
    .select()
    .from(offeringApprovals)
    .where(and(...conditions))
    .orderBy(desc(offeringApprovals.createdAt));
}

export async function updateApprovalDecision(
  id: number,
  decision: "approved" | "rejected" | "changes_requested",
  comments?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(offeringApprovals)
    .set({
      decision,
      comments,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(offeringApprovals.id, id));

  // If approved, update offering status
  const [approval] = await db
    .select()
    .from(offeringApprovals)
    .where(eq(offeringApprovals.id, id))
    .limit(1);

  if (approval && decision === "approved") {
    await updateOfferingStatus(
      approval.offeringId,
      "approved",
      approval.reviewerId,
      "Approved by reviewer"
    );
  }
}

// ============================================
// FUNDING TRACKING
// ============================================

export async function updateOfferingFunding(
  offeringId: number,
  amountToAdd: number,
  investorCount: number = 1
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offering = await getOfferingById(offeringId);
  if (!offering) throw new Error("Offering not found");

  const newFundedAmount = offering.currentFundedAmount + amountToAdd;
  const newInvestorCount = offering.currentInvestorCount || 0 || 0 + investorCount;
  const fundingPercentage = (newFundedAmount / offering.totalOfferingAmount) * 100;

  // Update offering
  await db
    .update(offerings)
    .set({
      currentFundedAmount: newFundedAmount,
      currentInvestorCount: newInvestorCount,
      updatedAt: new Date(),
    })
    .where(eq(offerings.id, offeringId));

  // Check for funding milestones
  const milestones = [
    { threshold: 25, type: "25_percent_funded", name: "25% Funded" },
    { threshold: 50, type: "50_percent_funded", name: "50% Funded" },
    { threshold: 75, type: "75_percent_funded", name: "75% Funded" },
    { threshold: 100, type: "fully_funded", name: "Fully Funded" },
  ];

  for (const milestone of milestones) {
    if (fundingPercentage >= milestone.threshold) {
      // Check if milestone already exists
      const existing = await db
        .select()
        .from(offeringTimeline)
        .where(
          and(
            eq(offeringTimeline.offeringId, offeringId),
            eq(offeringTimeline.milestoneType, milestone.type as any)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(offeringTimeline).values({
          offeringId,
          milestoneType: milestone.type as any,
          milestoneName: milestone.name,
          actualDate: new Date(),
          isCompleted: true,
        });
      }
    }
  }

  // If fully funded, update status
  if (fundingPercentage >= 100) {
    await updateOfferingStatus(
      offeringId,
      "fully_funded",
      offering.fundraiserId,
      "Offering fully funded"
    );
  }

  return await getOfferingById(offeringId);
}

// ============================================
// COMPREHENSIVE OFFERING DATA
// ============================================

export async function getCompleteOfferingData(offeringId: number) {
  const db = await getDb();
  if (!db) return null;

  const offering = await getOfferingWithProperty(offeringId);
  if (!offering) return null;

  const [financialProjections, fees, documents, timeline, statusHistory, approvals] = await Promise.all([
    getFinancialProjection(offeringId),
    getOfferingFees(offeringId),
    getOfferingDocuments(offeringId),
    getOfferingTimeline(offeringId),
    getOfferingStatusHistory(offeringId),
    getOfferingApprovals(offeringId),
  ]);

  return {
    ...offering,
    financialProjections,
    fees,
    documents,
    timeline,
    statusHistory,
    approvals,
  };
}
