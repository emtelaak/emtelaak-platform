import { eq, and, or, sql, desc } from "drizzle-orm";
import { getDb } from "../db";
import { incomeDistributions, investmentTransactions, investments } from "../../drizzle/schema";

/**
 * Create income distribution for NEW investment system
 */
export async function createIncomeDistributionForTransaction(distribution: {
  investmentTransactionId: number;
  amount: number;
  distributionType: "rental_income" | "capital_gain" | "exit_proceeds";
  distributionDate: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(incomeDistributions).values({
    investmentTransactionId: distribution.investmentTransactionId,
    amount: distribution.amount,
    distributionType: distribution.distributionType,
    distributionDate: distribution.distributionDate,
    status: "pending",
  });

  return result;
}

/**
 * Create income distribution for OLD investment system (backward compatibility)
 */
export async function createIncomeDistributionForInvestment(distribution: {
  investmentId: number;
  amount: number;
  distributionType: "rental_income" | "capital_gain" | "exit_proceeds";
  distributionDate: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(incomeDistributions).values({
    investmentId: distribution.investmentId,
    amount: distribution.amount,
    distributionType: distribution.distributionType,
    distributionDate: distribution.distributionDate,
    status: "pending",
  });

  return result;
}

/**
 * Distribute income to all investors of a property (BOTH old and new systems)
 */
export async function distributeIncomeToProperty(params: {
  propertyId: number;
  totalAmount: number;
  distributionType: "rental_income" | "capital_gain" | "exit_proceeds";
  distributionDate: Date;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all completed investments for this property from OLD system
  const oldInvestments = await db
    .select({
      id: investments.id,
      userId: investments.userId,
      shares: investments.shares,
      ownershipPercentage: investments.ownershipPercentage,
    })
    .from(investments)
    .where(
      and(
        eq(investments.propertyId, params.propertyId),
        or(
          eq(investments.status, "confirmed"),
          eq(investments.status, "active")
        )
      )
    );

  // Get all completed investments for this property from NEW system
  const newInvestments = await db
    .select({
      id: investmentTransactions.id,
      userId: investmentTransactions.userId,
      shares: investmentTransactions.numberOfShares,
      ownershipPercentage: investmentTransactions.ownershipPercentage,
    })
    .from(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.propertyId, params.propertyId),
        eq(investmentTransactions.status, "completed")
      )
    );

  // Calculate total ownership percentage
  const totalOwnership =
    oldInvestments.reduce((sum, inv) => sum + (inv.ownershipPercentage || 0), 0) +
    newInvestments.reduce((sum, inv) => sum + (inv.ownershipPercentage || 0), 0);

  if (totalOwnership === 0) {
    throw new Error("No active investments found for this property");
  }

  const distributions: Array<{ investmentId?: number; investmentTransactionId?: number; amount: number }> = [];

  // Create distributions for OLD system investments
  for (const investment of oldInvestments) {
    const ownershipPct = investment.ownershipPercentage || 0;
    const distributionAmount = Math.floor((ownershipPct / totalOwnership) * params.totalAmount);

    if (distributionAmount > 0) {
      await createIncomeDistributionForInvestment({
        investmentId: investment.id,
        amount: distributionAmount,
        distributionType: params.distributionType,
        distributionDate: params.distributionDate,
      });

      distributions.push({
        investmentId: investment.id,
        amount: distributionAmount,
      });
    }
  }

  // Create distributions for NEW system investments
  for (const investment of newInvestments) {
    const ownershipPct = investment.ownershipPercentage || 0;
    const distributionAmount = Math.floor((ownershipPct / totalOwnership) * params.totalAmount);

    if (distributionAmount > 0) {
      await createIncomeDistributionForTransaction({
        investmentTransactionId: investment.id,
        amount: distributionAmount,
        distributionType: params.distributionType,
        distributionDate: params.distributionDate,
      });

      distributions.push({
        investmentTransactionId: investment.id,
        amount: distributionAmount,
      });
    }
  }

  return {
    totalDistributions: distributions.length,
    totalAmount: distributions.reduce((sum, d) => sum + d.amount, 0),
    distributions,
  };
}

/**
 * Get unified income history for a user (BOTH old and new systems)
 */
export async function getUserIncomeHistory(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  // Get user's old investment IDs
  const userOldInvestments = await db
    .select({ id: investments.id })
    .from(investments)
    .where(eq(investments.userId, userId));

  const oldInvestmentIds = userOldInvestments.map((inv) => inv.id);

  // Get user's new investment IDs
  const userNewInvestments = await db
    .select({ id: investmentTransactions.id })
    .from(investmentTransactions)
    .where(eq(investmentTransactions.userId, userId));

  const newInvestmentIds = userNewInvestments.map((inv) => inv.id);

  // Query distributions from BOTH systems
  const allDistributions = await db
    .select()
    .from(incomeDistributions)
    .where(
      or(
        oldInvestmentIds.length > 0
          ? sql`${incomeDistributions.investmentId} IN (${sql.join(
              oldInvestmentIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          : sql`1=0`,
        newInvestmentIds.length > 0
          ? sql`${incomeDistributions.investmentTransactionId} IN (${sql.join(
              newInvestmentIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          : sql`1=0`
      )
    )
    .orderBy(desc(incomeDistributions.distributionDate));

  return allDistributions.map((dist) => ({
    ...dist,
    source: dist.investmentId ? "legacy" : "new",
  }));
}

/**
 * Mark distribution as processed
 */
export async function markDistributionAsProcessed(distributionId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(incomeDistributions)
    .set({
      status: "processed",
      processedAt: new Date(),
    })
    .where(eq(incomeDistributions.id, distributionId));
}
