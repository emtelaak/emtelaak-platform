import { eq, and, sql, desc } from "drizzle-orm";
import { getDb } from "../db";
import { properties, investmentTransactions, users } from "../../drizzle/schema";

/**
 * Get all properties managed by a fundraiser
 */
export async function getFundraiserProperties(fundraiserId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const fundraiserProperties = await db
    .select({
      id: properties.id,
      name: properties.name,
      city: properties.city,
      country: properties.country,
      totalShares: properties.totalShares,
      sharePrice: properties.sharePrice,
      totalValue: properties.totalValue,
      availableValue: properties.availableValue,
      status: properties.status,
      createdAt: properties.createdAt,
    })
    .from(properties)
    .where(eq(properties.fundraiserId, fundraiserId))
    .orderBy(desc(properties.createdAt));

  return fundraiserProperties;
}

/**
 * Get investment statistics for a fundraiser's properties
 */
export async function getFundraiserInvestmentStats(fundraiserId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all property IDs for this fundraiser
  const fundraiserProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.fundraiserId, fundraiserId));

  const propertyIds = fundraiserProperties.map((p) => p.id);

  if (propertyIds.length === 0) {
    return {
      totalInvestments: 0,
      totalInvestors: 0,
      totalRevenue: 0,
      completedInvestments: 0,
      pendingInvestments: 0,
    };
  }

  // Get investment statistics
  const stats = await db
    .select({
      totalInvestments: sql<number>`COUNT(*)`,
      totalInvestors: sql<number>`COUNT(DISTINCT ${investmentTransactions.userId})`,
      totalRevenue: sql<number>`SUM(${investmentTransactions.totalAmount})`,
      completedInvestments: sql<number>`SUM(CASE WHEN ${investmentTransactions.status} = 'completed' THEN 1 ELSE 0 END)`,
      pendingInvestments: sql<number>`SUM(CASE WHEN ${investmentTransactions.status} = 'pending' THEN 1 ELSE 0 END)`,
    })
    .from(investmentTransactions)
    .where(sql`${investmentTransactions.propertyId} IN (${sql.join(propertyIds.map((id) => sql`${id}`), sql`, `)})`);

  return {
    totalInvestments: Number(stats[0]?.totalInvestments || 0),
    totalInvestors: Number(stats[0]?.totalInvestors || 0),
    totalRevenue: Number(stats[0]?.totalRevenue || 0),
    completedInvestments: Number(stats[0]?.completedInvestments || 0),
    pendingInvestments: Number(stats[0]?.pendingInvestments || 0),
  };
}

/**
 * Get detailed property performance for fundraiser
 */
export async function getFundraiserPropertyPerformance(fundraiserId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const performance = await db
    .select({
      propertyId: properties.id,
      propertyName: properties.name,
      totalShares: properties.totalShares,
      sharePrice: properties.sharePrice,
      totalValue: properties.totalValue,
      availableValue: properties.availableValue,
      status: properties.status,
      investmentCount: sql<number>`COUNT(${investmentTransactions.id})`,
      investorCount: sql<number>`COUNT(DISTINCT ${investmentTransactions.userId})`,
      totalInvested: sql<number>`COALESCE(SUM(${investmentTransactions.investmentAmount}), 0)`,
      sharesSold: sql<number>`COALESCE(SUM(${investmentTransactions.numberOfShares}), 0)`,
    })
    .from(properties)
    .leftJoin(
      investmentTransactions,
      and(
        eq(investmentTransactions.propertyId, properties.id),
        eq(investmentTransactions.status, "completed")
      )
    )
    .where(eq(properties.fundraiserId, fundraiserId))
    .groupBy(properties.id)
    .orderBy(desc(properties.createdAt));

  return performance.map((p) => ({
    ...p,
    investmentCount: Number(p.investmentCount),
    investorCount: Number(p.investorCount),
    totalInvested: Number(p.totalInvested),
    sharesSold: Number(p.sharesSold),
    fundingProgress: p.totalValue > 0 ? ((p.totalValue - p.availableValue) / p.totalValue) * 100 : 0,
    sharesProgress: p.totalShares > 0 ? (Number(p.sharesSold) / p.totalShares) * 100 : 0,
  }));
}

/**
 * Get recent investors for fundraiser's properties
 */
export async function getFundraiserRecentInvestors(fundraiserId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all property IDs for this fundraiser
  const fundraiserProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.fundraiserId, fundraiserId));

  const propertyIds = fundraiserProperties.map((p) => p.id);

  if (propertyIds.length === 0) {
    return [];
  }

  const recentInvestors = await db
    .select({
      investmentId: investmentTransactions.id,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      propertyId: properties.id,
      propertyName: properties.name,
      investmentAmount: investmentTransactions.investmentAmount,
      numberOfShares: investmentTransactions.numberOfShares,
      status: investmentTransactions.status,
      createdAt: investmentTransactions.createdAt,
    })
    .from(investmentTransactions)
    .innerJoin(users, eq(investmentTransactions.userId, users.id))
    .innerJoin(properties, eq(investmentTransactions.propertyId, properties.id))
    .where(sql`${investmentTransactions.propertyId} IN (${sql.join(propertyIds.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(desc(investmentTransactions.createdAt))
    .limit(limit);

  return recentInvestors;
}
