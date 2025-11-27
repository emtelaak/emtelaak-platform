import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  investmentTransactions,
  investmentDocuments,
  investmentEligibility,
  investmentActivity,
  properties,
  users,
  InsertInvestmentTransaction,
  InsertInvestmentDocument,
  InsertInvestmentEligibility,
  InsertInvestmentActivity,
} from "../drizzle/schema";

/**
 * Create a new investment transaction
 */
export async function createInvestmentTransaction(data: InsertInvestmentTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(investmentTransactions).values(data).$returningId();
  return result[0].id;
}

/**
 * Get investment transaction by ID
 */
export async function getInvestmentTransactionById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(investmentTransactions)
    .where(eq(investmentTransactions.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all investments for a user
 */
export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      investment: investmentTransactions,
      property: properties,
    })
    .from(investmentTransactions)
    .leftJoin(properties, eq(investmentTransactions.propertyId, properties.id))
    .where(eq(investmentTransactions.userId, userId))
    .orderBy(desc(investmentTransactions.createdAt));
}

/**
 * Get all investments for a property
 */
export async function getPropertyInvestments(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      investment: investmentTransactions,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(investmentTransactions)
    .leftJoin(users, eq(investmentTransactions.userId, users.id))
    .where(eq(investmentTransactions.propertyId, propertyId))
    .orderBy(desc(investmentTransactions.createdAt));
}

/**
 * Update investment transaction status
 */
export async function updateInvestmentStatus(
  id: number,
  status: string,
  additionalData?: Partial<InsertInvestmentTransaction>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentTransactions)
    .set({
      status: status as any,
      ...additionalData,
      updatedAt: new Date(),
    })
    .where(eq(investmentTransactions.id, id));
}

/**
 * Reserve shares for an investment
 */
export async function reserveInvestment(id: number, expirationMinutes: number = 15) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  await db
    .update(investmentTransactions)
    .set({
      status: "reserved",
      reservedAt: new Date(),
      reservationExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(investmentTransactions.id, id));

  return expiresAt;
}

/**
 * Cancel expired reservations
 */
export async function cancelExpiredReservations() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .update(investmentTransactions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(investmentTransactions.status, "reserved"),
        lte(investmentTransactions.reservationExpiresAt, new Date())
      )
    );

  return (result as any).rowsAffected || 0;
}

/**
 * Mark investment as paid
 */
export async function markInvestmentPaid(
  id: number,
  paymentReference: string,
  paymentMethod: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentTransactions)
    .set({
      status: "processing",
      paymentStatus: "completed",
      paymentReference,
      paymentMethod,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(investmentTransactions.id, id));
}

/**
 * Complete investment and issue certificate
 */
export async function completeInvestment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentTransactions)
    .set({
      status: "completed",
      completedAt: new Date(),
      certificateIssued: true,
      certificateIssuedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(investmentTransactions.id, id));
}

/**
 * Add investment document
 */
export async function addInvestmentDocument(data: InsertInvestmentDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(investmentDocuments).values(data).$returningId();
  return result[0].id;
}

/**
 * Get investment documents
 */
export async function getInvestmentDocuments(investmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(investmentDocuments)
    .where(eq(investmentDocuments.investmentId, investmentId))
    .orderBy(desc(investmentDocuments.createdAt));
}

/**
 * Sign investment document
 */
export async function signInvestmentDocument(
  documentId: number,
  signatureData: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentDocuments)
    .set({
      signed: true,
      signedAt: new Date(),
      signatureData,
      updatedAt: new Date(),
    })
    .where(eq(investmentDocuments.id, documentId));
}

/**
 * Get or create user eligibility record
 */
export async function getUserEligibility(userId: number) {
  const db = await getDb();
  if (!db) return null;

  let result = await db
    .select()
    .from(investmentEligibility)
    .where(eq(investmentEligibility.userId, userId))
    .limit(1);

  if (result.length === 0) {
    // Create default eligibility record
    await db.insert(investmentEligibility).values({
      userId,
      isAccredited: false,
      accreditationType: "none",
      accreditationVerified: false,
      currentYearInvested: 0,
      lifetimeInvested: 0,
      kycStatus: "pending",
      amlStatus: "pending",
    });

    result = await db
      .select()
      .from(investmentEligibility)
      .where(eq(investmentEligibility.userId, userId))
      .limit(1);
  }

  return result[0] || null;
}

/**
 * Update user eligibility
 */
export async function updateUserEligibility(
  userId: number,
  data: Partial<InsertInvestmentEligibility>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentEligibility)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(investmentEligibility.userId, userId));
}

/**
 * Check if user can invest amount
 */
export async function checkInvestmentEligibility(userId: number, amount: number) {
  const eligibility = await getUserEligibility(userId);
  if (!eligibility) {
    return {
      eligible: false,
      reason: "No eligibility record found",
    };
  }

  // Check KYC status
  if (eligibility.kycStatus !== "approved") {
    return {
      eligible: false,
      reason: "KYC verification required",
    };
  }

  // Check AML status
  if (eligibility.amlStatus === "flagged" || eligibility.amlStatus === "rejected") {
    return {
      eligible: false,
      reason: "AML check failed",
    };
  }

  // Check annual investment limit
  if (eligibility.annualInvestmentLimit) {
    const remainingLimit = eligibility.annualInvestmentLimit - ((eligibility.currentYearInvested || 0) || 0) || 0 || 0;
    if (amount > remainingLimit) {
      return {
        eligible: false,
        reason: `Investment exceeds annual limit. Remaining: $${(remainingLimit / 100).toFixed(2)}`,
      };
    }
  }

  return {
    eligible: true,
    reason: null,
  };
}

/**
 * Update investment totals for user
 */
export async function updateUserInvestmentTotals(userId: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentEligibility)
    .set({
      currentYearInvested: sql`${investmentEligibility.currentYearInvested} + ${amount}`,
      lifetimeInvested: sql`${investmentEligibility.lifetimeInvested} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(investmentEligibility.userId, userId));
}

/**
 * Add investment activity log
 */
export async function logInvestmentActivity(data: InsertInvestmentActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(investmentActivity).values(data);
}

/**
 * Get investment activity history
 */
export async function getInvestmentActivity(investmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(investmentActivity)
    .where(eq(investmentActivity.investmentId, investmentId))
    .orderBy(desc(investmentActivity.createdAt));
}

/**
 * Get investment statistics
 */
export async function getInvestmentStats() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      totalInvestments: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`SUM(${investmentTransactions.totalAmount})`,
      completedInvestments: sql<number>`SUM(CASE WHEN ${investmentTransactions.status} = 'completed' THEN 1 ELSE 0 END)`,
      pendingInvestments: sql<number>`SUM(CASE WHEN ${investmentTransactions.status} IN ('pending', 'reserved', 'processing') THEN 1 ELSE 0 END)`,
    })
    .from(investmentTransactions);

  return result[0] || null;
}

/**
 * Calculate available shares for a property
 */
export async function getAvailableShares(propertyId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get property details
  const property = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property[0]) return null;

  // Calculate total shares sold (completed + reserved)
  const soldShares = await db
    .select({
      total: sql<number>`SUM(${investmentTransactions.numberOfShares})`,
    })
    .from(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.propertyId, propertyId),
        sql`${investmentTransactions.status} IN ('reserved', 'processing', 'completed')`
      )
    );

  const totalSold = soldShares[0]?.total || 0;
  const totalShares = property[0].totalShares || 0;

  return {
    totalShares,
    soldShares: totalSold,
    availableShares: totalShares - totalSold,
    percentageSold: totalShares > 0 ? (totalSold / totalShares) * 100 : 0,
  };
}
