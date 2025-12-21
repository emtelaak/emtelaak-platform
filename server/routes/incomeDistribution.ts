import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import {
  distributeIncomeToProperty,
  getUserIncomeHistory,
  markDistributionAsProcessed,
} from "../db/incomeDistributionDb";
import { getDb } from "../db";
import { incomeDistributions, properties, investments, investmentTransactions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, or, sql } from "drizzle-orm";
import { createAuditLog } from "../permissionsDb";

export const incomeDistributionRouter = router({
  /**
   * Distribute income to all investors of a property
   */
  distributeIncome: adminProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive(),
        totalAmount: z.number().int().positive(),
        distributionType: z.enum(["rental_income", "capital_gain", "exit_proceeds"]),
        distributionDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await distributeIncomeToProperty({
        propertyId: input.propertyId,
        totalAmount: input.totalAmount,
        distributionType: input.distributionType,
        distributionDate: input.distributionDate,
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "income_distribution_created",
        targetType: "income_distribution",
        targetId: input.propertyId,
        details: JSON.stringify({
          propertyId: input.propertyId,
          totalAmount: input.totalAmount,
          distributionType: input.distributionType,
          totalDistributions: result.totalDistributions,
        }),
      });

      return result;
    }),

  /**
   * Get distribution history with filters
   */
  getDistributionHistory: adminProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().positive().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(incomeDistributions.distributionDate, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(incomeDistributions.distributionDate, input.endDate));
      }

      // Get distributions
      let query = db
        .select({
          id: incomeDistributions.id,
          investmentId: incomeDistributions.investmentId,
          investmentTransactionId: incomeDistributions.investmentTransactionId,
          amount: incomeDistributions.amount,
          distributionType: incomeDistributions.distributionType,
          distributionDate: incomeDistributions.distributionDate,
          status: incomeDistributions.status,
          processedAt: incomeDistributions.processedAt,
          createdAt: incomeDistributions.createdAt,
        })
        .from(incomeDistributions);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const distributions = await query
        .orderBy(desc(incomeDistributions.distributionDate))
        .limit(input.limit);

      // If propertyId filter is provided, we need to join with investments/investmentTransactions
      if (input.propertyId) {
        const filtered = [];
        for (const dist of distributions) {
          if (dist.investmentId) {
            const inv = await db
              .select({ propertyId: investments.propertyId })
              .from(investments)
              .where(eq(investments.id, dist.investmentId))
              .limit(1);
            if (inv[0]?.propertyId === input.propertyId) {
              filtered.push(dist);
            }
          } else if (dist.investmentTransactionId) {
            const inv = await db
              .select({ propertyId: investmentTransactions.propertyId })
              .from(investmentTransactions)
              .where(eq(investmentTransactions.id, dist.investmentTransactionId))
              .limit(1);
            if (inv[0]?.propertyId === input.propertyId) {
              filtered.push(dist);
            }
          }
        }
        return filtered;
      }

      return distributions as any;
    }),

  /**
   * Get distributions for a specific property
   */
  getPropertyDistributions: adminProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      // Get all investments for this property (old system)
      const oldInvestments = await db
        .select({ id: investments.id })
        .from(investments)
        .where(eq(investments.propertyId, input.propertyId));

      const oldInvestmentIds = oldInvestments.map((inv) => inv.id);

      // Get all investments for this property (new system)
      const newInvestments = await db
        .select({ id: investmentTransactions.id })
        .from(investmentTransactions)
        .where(eq(investmentTransactions.propertyId, input.propertyId));

      const newInvestmentIds = newInvestments.map((inv) => inv.id);

      // Get distributions for these investments
      const distributions = await db
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

      return distributions.map((dist) => ({
        ...dist,
        source: dist.investmentId ? "legacy" : "new",
      }));
    }),

  /**
   * Get investor preview for a property (who will receive distributions)
   */
  getInvestorPreview: adminProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { investors: [], totalOwnership: 0 };
      }

      // Get old system investors
      const oldInvestors = await db
        .select({
          userId: investments.userId,
          shares: investments.shares,
          ownershipPercentage: investments.ownershipPercentage,
          amount: investments.amount,
          source: sql<string>`'legacy'`,
        })
        .from(investments)
        .where(
          and(
            eq(investments.propertyId, input.propertyId),
            or(eq(investments.status, "confirmed"), eq(investments.status, "active"))
          )
        );

      // Get new system investors
      const newInvestors = await db
        .select({
          userId: investmentTransactions.userId,
          shares: investmentTransactions.numberOfShares,
          ownershipPercentage: investmentTransactions.ownershipPercentage,
          amount: investmentTransactions.investmentAmount,
          source: sql<string>`'new'`,
        })
        .from(investmentTransactions)
        .where(
          and(
            eq(investmentTransactions.propertyId, input.propertyId),
            eq(investmentTransactions.status, "completed")
          )
        );

      const allInvestors = [...oldInvestors, ...newInvestors];

      const totalOwnership = allInvestors.reduce(
        (sum, inv) => sum + (inv.ownershipPercentage || 0),
        0
      );

      return {
        investors: allInvestors,
        totalOwnership,
        totalInvestors: allInvestors.length,
      };
    }),

  /**
   * Mark distribution as processed
   */
  markAsProcessed: adminProcedure
    .input(z.object({ distributionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await markDistributionAsProcessed(input.distributionId);

      await createAuditLog({
        userId: ctx.user.id,
        action: "income_distribution_processed",
        targetType: "income_distribution",
        targetId: input.distributionId,
        details: JSON.stringify({ distributionId: input.distributionId }),
      });

      return { success: true };
    }),
});
