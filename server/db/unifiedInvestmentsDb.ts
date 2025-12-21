import { getUserInvestments as getOldInvestments } from "../db";
import { getUserInvestments as getNewInvestments } from "../investmentTransactionDb";

/**
 * Status mapping from old investment system to new system
 */
function mapOldStatusToNew(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    "pending": "pending",
    "confirmed": "completed",
    "active": "completed",
    "exited": "completed",
    "cancelled": "cancelled",
  };
  return statusMap[oldStatus] || "pending";
}

/**
 * Unified investment type that combines both old and new systems
 */
export interface UnifiedInvestment {
  id: number;
  userId: number;
  propertyId: number;
  investmentAmount: number;
  numberOfShares: number;
  pricePerShare: number;
  platformFee: number;
  processingFee: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  completedAt: Date | null;
  source: "legacy" | "new";
  // Phase 2 fields
  distributionFrequency?: string | null;
  exitedAt?: Date | null;
  ownershipPercentage?: number | null;
}

/**
 * Get all investments for a user from BOTH old and new systems
 * This provides a compatibility layer during migration
 */
export async function getUnifiedUserInvestments(userId: number): Promise<UnifiedInvestment[]> {
  // Get investments from both tables
  const oldInvestments = await getOldInvestments(userId);
  const newInvestments = await getNewInvestments(userId);
  
  // Transform old investments to match new format
  const transformedOld: UnifiedInvestment[] = oldInvestments.map(inv => ({
    id: inv.id,
    userId: inv.userId,
    propertyId: inv.propertyId,
    investmentAmount: inv.amount,
    numberOfShares: inv.shares,
    pricePerShare: inv.sharePrice,
    platformFee: 0, // Old system had no platform fee
    processingFee: 0, // Old system had no processing fee
    totalAmount: inv.amount,
    status: mapOldStatusToNew(inv.status),
    paymentStatus: inv.paymentStatus || "pending",
    createdAt: inv.investmentDate,
    completedAt: inv.confirmedAt || null,
    source: "legacy" as const,
    // Phase 2 fields from old system
    distributionFrequency: inv.distributionFrequency || null,
    exitedAt: inv.exitedAt || null,
    ownershipPercentage: inv.ownershipPercentage || null,
  }));
  
  // Transform new investments to unified format
  const transformedNew: UnifiedInvestment[] = newInvestments.map(inv => ({
    id: inv.investment.id,
    userId: inv.investment.userId,
    propertyId: inv.investment.propertyId,
    investmentAmount: inv.investment.investmentAmount,
    numberOfShares: inv.investment.numberOfShares,
    pricePerShare: inv.investment.pricePerShare,
    platformFee: inv.investment.platformFee,
    processingFee: inv.investment.processingFee,
    totalAmount: inv.investment.totalAmount,
    status: inv.investment.status,
    paymentStatus: inv.investment.paymentStatus,
    createdAt: inv.investment.createdAt,
    completedAt: inv.investment.completedAt || null,
    source: "new" as const,
    // Phase 2 fields from new system
    distributionFrequency: inv.investment.distributionFrequency || null,
    exitedAt: inv.investment.exitedAt || null,
    ownershipPercentage: inv.investment.ownershipPercentage || null,
  })) as UnifiedInvestment[];
  
  // Combine and sort by date (newest first)
  const allInvestments = [...transformedOld, ...transformedNew];
  allInvestments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return allInvestments;
}

/**
 * Get unified portfolio summary for a user
 */
export async function getUnifiedPortfolioSummary(userId: number) {
  const investments = await getUnifiedUserInvestments(userId);
  
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const activeInvestments = investments.filter(inv => inv.status === "completed").length;
  
  return {
    totalInvested,
    activeInvestments,
    investments,
  };
}
