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

  // Get distribution details before updating
  const [distribution] = await db
    .select()
    .from(incomeDistributions)
    .where(eq(incomeDistributions.id, distributionId))
    .limit(1);

  if (!distribution) {
    throw new Error("Distribution not found");
  }

  // Update status
  await db
    .update(incomeDistributions)
    .set({
      status: "processed",
      processedAt: new Date(),
    })
    .where(eq(incomeDistributions.id, distributionId));

  // Send email notification to investor
  try {
    const { generateIncomeDistributionEmail, sendEmail } = await import("../_core/emailService");
    const { getUserById } = await import("../db");
    
    // Get user ID from investment
    let userId: number | null = null;
    let propertyId: number | null = null;
    
    if (distribution.investmentId) {
      const [investment] = await db
        .select({ userId: investments.userId, propertyId: investments.propertyId })
        .from(investments)
        .where(eq(investments.id, distribution.investmentId))
        .limit(1);
      userId = investment?.userId || null;
      propertyId = investment?.propertyId || null;
    } else if (distribution.investmentTransactionId) {
      const [transaction] = await db
        .select({ userId: investmentTransactions.userId, propertyId: investmentTransactions.propertyId })
        .from(investmentTransactions)
        .where(eq(investmentTransactions.id, distribution.investmentTransactionId))
        .limit(1);
      userId = transaction?.userId || null;
      propertyId = transaction?.propertyId || null;
    }
    
    if (userId && propertyId) {
      const user = await getUserById(userId);
      const { getPropertyById } = await import("../db");
      const property = await getPropertyById(propertyId);
      
      if (user && user.email && property) {
        const distributionTypeLabels = {
          rental_income: "Rental Income",
          capital_gain: "Capital Gain",
          exit_proceeds: "Exit Proceeds",
        };
        
        const emailContent = generateIncomeDistributionEmail({
          userName: user.name || "Investor",
          propertyName: property.name,
          amount: distribution.amount,
          distributionDate: distribution.distributionDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          distributionPeriod: distributionTypeLabels[distribution.distributionType],
        });
        
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      }
    }
  } catch (emailError) {
    console.error("Failed to send income distribution email:", emailError);
    // Don't fail the distribution processing if email fails
  }
}
