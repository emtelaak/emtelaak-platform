import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  investmentReservations,
  investmentEligibility,
  investmentPayments,
  escrowAccounts,
  type InvestmentReservation,
  type InsertInvestmentReservation,
  type InvestmentEligibility,
  type InsertInvestmentEligibility,
  type InvestmentPayment,
  type InsertInvestmentPayment,
  type EscrowAccount,
  type InsertEscrowAccount,
} from "../../drizzle/investment-flow-schema";

// ============================================
// INVESTMENT RESERVATIONS
// ============================================

/**
 * Create a new investment reservation
 */
export async function createReservation(data: InsertInvestmentReservation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [reservation] = await db.insert(investmentReservations).values(data).$returningId();
  return reservation.id;
}

/**
 * Get reservation by ID
 */
export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [reservation] = await db
    .select()
    .from(investmentReservations)
    .where(eq(investmentReservations.id, id))
    .limit(1);

  return reservation || null;
}

/**
 * Get active reservations for a user
 */
export async function getUserActiveReservations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(investmentReservations)
    .where(
      and(
        eq(investmentReservations.userId, userId),
        eq(investmentReservations.status, "active")
      )
    )
    .orderBy(desc(investmentReservations.createdAt));
}

/**
 * Get all reservations for an offering
 */
export async function getOfferingReservations(offeringId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(investmentReservations)
    .where(eq(investmentReservations.offeringId, offeringId))
    .orderBy(desc(investmentReservations.createdAt));
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(
  id: number,
  status: "active" | "expired" | "converted" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentReservations)
    .set({ status, updatedAt: new Date() })
    .where(eq(investmentReservations.id, id));
}

/**
 * Get expired reservations
 */
export async function getExpiredReservations() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(investmentReservations)
    .where(
      and(
        eq(investmentReservations.status, "active"),
        lte(investmentReservations.expiresAt, new Date())
      )
    );
}

/**
 * Mark expired reservations
 */
export async function markExpiredReservations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(investmentReservations)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(investmentReservations.status, "active"),
        lte(investmentReservations.expiresAt, new Date())
      )
    );
}

// ============================================
// INVESTMENT ELIGIBILITY
// ============================================

/**
 * Create or update eligibility check
 */
export async function upsertEligibility(data: InsertInvestmentEligibility) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if exists
  const [existing] = await db
    .select()
    .from(investmentEligibility)
    .where(
      and(
        eq(investmentEligibility.userId, data.userId),
        eq(investmentEligibility.offeringId, data.offeringId)
      )
    )
    .limit(1);

  if (existing) {
    // Update
    await db
      .update(investmentEligibility)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(investmentEligibility.id, existing.id));
    return existing.id;
  } else {
    // Insert
    const [result] = await db.insert(investmentEligibility).values(data).$returningId();
    return result.id;
  }
}

/**
 * Get eligibility for user and offering
 */
export async function getEligibility(userId: number, offeringId: number) {
  const db = await getDb();
  if (!db) return null;

  const [eligibility] = await db
    .select()
    .from(investmentEligibility)
    .where(
      and(
        eq(investmentEligibility.userId, userId),
        eq(investmentEligibility.offeringId, offeringId)
      )
    )
    .limit(1);

  return eligibility || null;
}

/**
 * Get all eligibility checks for a user
 */
export async function getUserEligibilityChecks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(investmentEligibility)
    .where(eq(investmentEligibility.userId, userId))
    .orderBy(desc(investmentEligibility.checkedAt));
}

/**
 * Check if user is eligible for offering
 */
export async function isUserEligible(userId: number, offeringId: number): Promise<boolean> {
  const eligibility = await getEligibility(userId, offeringId);
  
  if (!eligibility) return false;
  
  // Check if eligibility is still valid
  if (eligibility.expiresAt && new Date() > eligibility.expiresAt) {
    return false;
  }
  
  return eligibility.isEligible && 
         eligibility.accreditationStatus === "verified" &&
         eligibility.jurisdictionCheck === "allowed";
}

// ============================================
// INVESTMENT PAYMENTS
// ============================================

/**
 * Create a new payment record
 */
export async function createPayment(data: InsertInvestmentPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [payment] = await db.insert(investmentPayments).values(data).$returningId();
  return payment.id;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [payment] = await db
    .select()
    .from(investmentPayments)
    .where(eq(investmentPayments.id, id))
    .limit(1);

  return payment || null;
}

/**
 * Get all payments for an investment
 */
export async function getInvestmentPayments(investmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(investmentPayments)
    .where(eq(investmentPayments.investmentId, investmentId))
    .orderBy(desc(investmentPayments.createdAt));
}

/**
 * Update payment verification status
 */
export async function updatePaymentVerification(
  id: number,
  status: "pending" | "verifying" | "verified" | "failed" | "rejected",
  verifiedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    verificationStatus: status,
    updatedAt: new Date(),
  };

  if (status === "verified") {
    updateData.verifiedAt = new Date();
    if (verifiedBy) {
      updateData.verifiedBy = verifiedBy;
    }
  }

  await db
    .update(investmentPayments)
    .set(updateData)
    .where(eq(investmentPayments.id, id));
}

/**
 * Get pending payments for verification
 */
export async function getPendingPayments() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(investmentPayments)
    .where(eq(investmentPayments.verificationStatus, "pending"))
    .orderBy(desc(investmentPayments.createdAt));
}

/**
 * Get total verified payment amount for an investment
 */
export async function getInvestmentVerifiedPaymentTotal(investmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${investmentPayments.amountCents}), 0)` })
    .from(investmentPayments)
    .where(
      and(
        eq(investmentPayments.investmentId, investmentId),
        eq(investmentPayments.verificationStatus, "verified")
      )
    );

  return result?.total || 0;
}

// ============================================
// ESCROW ACCOUNTS
// ============================================

/**
 * Create a new escrow account
 */
export async function createEscrowAccount(data: InsertEscrowAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [escrow] = await db.insert(escrowAccounts).values(data).$returningId();
  return escrow.id;
}

/**
 * Get escrow account by ID
 */
export async function getEscrowAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [escrow] = await db
    .select()
    .from(escrowAccounts)
    .where(eq(escrowAccounts.id, id))
    .limit(1);

  return escrow || null;
}

/**
 * Get escrow account for an offering
 */
export async function getOfferingEscrowAccount(offeringId: number) {
  const db = await getDb();
  if (!db) return null;

  const [escrow] = await db
    .select()
    .from(escrowAccounts)
    .where(eq(escrowAccounts.offeringId, offeringId))
    .orderBy(desc(escrowAccounts.createdAt))
    .limit(1);

  return escrow || null;
}

/**
 * Update escrow account status
 */
export async function updateEscrowStatus(
  id: number,
  status: "pending_setup" | "active" | "releasing" | "released" | "closed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "active" && !updateData.openedAt) {
    updateData.openedAt = new Date();
  }

  if (status === "closed") {
    updateData.closedAt = new Date();
  }

  await db
    .update(escrowAccounts)
    .set(updateData)
    .where(eq(escrowAccounts.id, id));
}

/**
 * Update escrow account balance
 */
export async function updateEscrowBalance(id: number, amountCents: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(escrowAccounts)
    .set({
      totalHeldCents: sql`${escrowAccounts.totalHeldCents} + ${amountCents}`,
      updatedAt: new Date(),
    })
    .where(eq(escrowAccounts.id, id));
}

/**
 * Get all active escrow accounts
 */
export async function getActiveEscrowAccounts() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(escrowAccounts)
    .where(eq(escrowAccounts.status, "active"))
    .orderBy(desc(escrowAccounts.createdAt));
}
