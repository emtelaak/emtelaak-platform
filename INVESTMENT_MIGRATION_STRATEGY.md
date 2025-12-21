# Investment System Migration Strategy
**Date:** January 9, 2025  
**Purpose:** Complete migration plan from old `investments` table to new `investmentTransactions` table

---

## Executive Summary

This document outlines the complete strategy for migrating from the old investment system to the new enhanced system while maintaining data integrity and zero downtime.

**Approach:** Gradual migration with compatibility layer (5 phases)  
**Timeline:** Estimated 2-3 weeks  
**Risk Level:** Low (with proper testing and rollback procedures)

---

## Phase 1: Add Compatibility Layer (Week 1, Days 1-2)

### Objective
Enable Portfolio page to display investments from BOTH old and new systems simultaneously.

### Tasks

#### 1.1 Create Unified Investment Query Function
**File:** `server/db/unifiedInvestmentsDb.ts`

```typescript
import { getUserInvestments as getOldInvestments } from "./db";
import { getUserInvestments as getNewInvestments } from "./investmentTransactionDb";

export async function getUnifiedUserInvestments(userId: number) {
  // Get investments from both tables
  const oldInvestments = await getOldInvestments(userId);
  const newInvestments = await getNewInvestments(userId);
  
  // Transform old investments to match new format
  const transformedOld = oldInvestments.map(inv => ({
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
    paymentStatus: inv.paymentStatus,
    createdAt: inv.investmentDate,
    completedAt: inv.confirmedAt,
    source: "legacy", // Mark as legacy data
  }));
  
  // Combine and sort by date
  return [...transformedOld, ...newInvestments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

function mapOldStatusToNew(oldStatus: string): string {
  const statusMap = {
    "pending": "pending",
    "confirmed": "completed",
    "active": "completed",
    "exited": "completed",
    "cancelled": "cancelled",
  };
  return statusMap[oldStatus] || "pending";
}
```

#### 1.2 Update Portfolio Router
**File:** `server/routers.ts` (lines 599-611)

```typescript
// Portfolio
portfolio: router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const investments = await getUnifiedUserInvestments(ctx.user.id);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const activeInvestments = investments.filter(inv => inv.status === "completed").length;
    
    return {
      totalInvested,
      activeInvestments,
      investments,
    };
  }),
  
  incomeHistory: protectedProcedure.query(async ({ ctx }) => {
    // Keep existing implementation (works with old system)
    return await getUserIncomeHistory(ctx.user.id);
  }),
  
  transactions: protectedProcedure.query(async ({ ctx }) => {
    // Keep existing implementation (works with old system)
    return await getUserTransactions(ctx.user.id);
  }),
}),
```

#### 1.3 Testing Checklist
- [ ] Verify old investments visible in Portfolio
- [ ] Verify new investments visible in Portfolio
- [ ] Verify no duplicate investments shown
- [ ] Verify sorting by date works correctly
- [ ] Verify status badges display correctly
- [ ] Verify total invested calculation accurate

### Deliverables
- ✅ Unified investment query function
- ✅ Updated portfolio router
- ✅ All tests passing

---

## Phase 2: Add Missing Fields to New Schema (Week 1, Days 3-4)

### Objective
Add critical fields missing from `investmentTransactions` table that exist in old `investments` table.

### Schema Changes Required

#### 2.1 Add Missing Fields
**File:** `drizzle/schema.ts` (after line 1517)

```typescript
export const investmentTransactions = mysqlTable("investment_transactions", {
  // ... existing fields ...
  
  // NEW FIELDS (add these)
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "annual"]),
  exitedAt: timestamp("exitedAt"),
  ownershipPercentage: int("ownershipPercentage"), // percentage * 10000
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### 2.2 Run Database Migration
```bash
cd /home/ubuntu/emtelaak-platform
pnpm db:push
```

**Migration Prompts:**
- "Add column distributionFrequency?" → **Yes**
- "Add column exitedAt?" → **Yes**
- "Add column ownershipPercentage?" → **Yes**

#### 2.3 Update Investment Creation Logic
**File:** `server/investmentTransactionRouter.ts` (createInvestment mutation)

Add calculation for ownershipPercentage:
```typescript
const property = await getPropertyById(input.propertyId);
const ownershipPercentage = property 
  ? Math.round((input.numberOfShares / property.totalShares) * 1000000) // Store as integer
  : 0;
```

### Testing Checklist
- [ ] Schema migration successful
- [ ] New investments include distributionFrequency
- [ ] ownershipPercentage calculated correctly
- [ ] Existing investments not affected

### Deliverables
- ✅ Schema updated with missing fields
- ✅ Migration executed successfully
- ✅ Investment creation includes new fields

---

## Phase 3: Update Income Distributions (Week 1, Days 5-7)

### Objective
Enable income distributions to work with BOTH old and new investment systems.

### Schema Changes Required

#### 3.1 Add investmentTransactionId to income_distributions
**File:** `drizzle/schema.ts` (line 361)

```typescript
export const incomeDistributions = mysqlTable("income_distributions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Support BOTH old and new systems
  investmentId: int("investmentId").references(() => investments.id, { onDelete: "cascade" }),
  investmentTransactionId: int("investmentTransactionId").references(() => investmentTransactions.id, { onDelete: "cascade" }),
  
  amount: int("amount").notNull(), // in cents
  distributionType: mysqlEnum("distributionType", ["rental_income", "capital_gain", "exit_proceeds"]).notNull(),
  distributionDate: timestamp("distributionDate").notNull(),
  status: mysqlEnum("status", ["pending", "processed", "failed"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### 3.2 Update Distribution Functions
**File:** `server/db.ts` (add new function)

```typescript
export async function createIncomeDistributionForTransaction(distribution: {
  investmentTransactionId: number;
  amount: number;
  distributionType: string;
  distributionDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(incomeDistributions).values({
    investmentTransactionId: distribution.investmentTransactionId,
    amount: distribution.amount,
    distributionType: distribution.distributionType as any,
    distributionDate: distribution.distributionDate,
  });
  
  return result;
}
```

#### 3.3 Update Income History Query
**File:** `server/db.ts` (update getUserIncomeHistory function)

```typescript
export async function getUserIncomeHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get user's old investments
  const userOldInvestments = await getUserInvestments(userId);
  const oldInvestmentIds = userOldInvestments.map(inv => inv.id);
  
  // Get user's new investments
  const userNewInvestments = await getUnifiedUserInvestments(userId);
  const newInvestmentIds = userNewInvestments
    .filter(inv => inv.source !== "legacy")
    .map(inv => inv.id);
  
  // Query distributions from BOTH systems
  const distributions = await db
    .select()
    .from(incomeDistributions)
    .where(
      or(
        oldInvestmentIds.length > 0 ? sql`${incomeDistributions.investmentId} IN (${oldInvestmentIds.join(',')})` : sql`1=0`,
        newInvestmentIds.length > 0 ? sql`${incomeDistributions.investmentTransactionId} IN (${newInvestmentIds.join(',')})` : sql`1=0`
      )
    )
    .orderBy(desc(incomeDistributions.distributionDate));
  
  return distributions;
}
```

### Testing Checklist
- [ ] Schema migration successful
- [ ] Old investments can receive distributions
- [ ] New investments can receive distributions
- [ ] Income history shows distributions from both systems
- [ ] No duplicate distributions

### Deliverables
- ✅ income_distributions table supports both systems
- ✅ Distribution functions updated
- ✅ Income history unified

---

## Phase 4: Migrate Historical Data (Week 2, Days 1-3)

### Objective
Copy all existing investments from old table to new table with proper field mapping.

### Migration Script

#### 4.1 Create Migration Script
**File:** `server/scripts/migrateInvestments.ts`

```typescript
import { getDb } from "../db";
import { investments, investmentTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function migrateInvestments() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Starting investment migration...");

  // Get all investments from old table
  const oldInvestments = await db.select().from(investments);
  console.log(`Found ${oldInvestments.length} investments to migrate`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldInv of oldInvestments) {
    try {
      // Check if already migrated (by checking notes field)
      const existing = await db
        .select()
        .from(investmentTransactions)
        .where(eq(investmentTransactions.notes, `Migrated from investments.id=${oldInv.id}`))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skipping investment ${oldInv.id} - already migrated`);
        skipped++;
        continue;
      }

      // Map old status to new status
      const statusMap = {
        "pending": "pending",
        "confirmed": "completed",
        "active": "completed",
        "exited": "completed",
        "cancelled": "cancelled",
      };
      const newStatus = statusMap[oldInv.status] || "pending";

      // Insert into new table
      await db.insert(investmentTransactions).values({
        userId: oldInv.userId,
        propertyId: oldInv.propertyId,
        investmentAmount: oldInv.amount,
        numberOfShares: oldInv.shares,
        pricePerShare: oldInv.sharePrice,
        platformFee: 0, // Old system had no platform fee
        processingFee: 0, // Old system had no processing fee
        totalAmount: oldInv.amount,
        status: newStatus as any,
        paymentMethod: oldInv.paymentMethod || null,
        paymentStatus: oldInv.paymentStatus as any,
        paymentReference: oldInv.transactionId || null,
        paidAt: oldInv.confirmedAt,
        completedAt: oldInv.confirmedAt,
        distributionFrequency: oldInv.distributionFrequency as any,
        exitedAt: oldInv.exitedAt,
        ownershipPercentage: oldInv.ownershipPercentage,
        notes: `Migrated from investments.id=${oldInv.id}`,
        createdAt: oldInv.investmentDate,
        updatedAt: oldInv.updatedAt,
      });

      console.log(`✓ Migrated investment ${oldInv.id}`);
      migrated++;
    } catch (error) {
      console.error(`✗ Error migrating investment ${oldInv.id}:`, error);
      errors++;
    }
  }

  console.log("\nMigration Summary:");
  console.log(`- Migrated: ${migrated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Errors: ${errors}`);
  console.log(`- Total: ${oldInvestments.length}`);
}

// Run migration
migrateInvestments()
  .then(() => {
    console.log("\nMigration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
```

#### 4.2 Run Migration
```bash
cd /home/ubuntu/emtelaak-platform
npx tsx server/scripts/migrateInvestments.ts
```

#### 4.3 Verify Migration
```sql
-- Check counts match
SELECT COUNT(*) FROM investments;
SELECT COUNT(*) FROM investment_transactions WHERE notes LIKE 'Migrated from%';

-- Verify data integrity
SELECT 
  i.id as old_id,
  it.id as new_id,
  i.amount as old_amount,
  it.investmentAmount as new_amount,
  i.shares as old_shares,
  it.numberOfShares as new_shares
FROM investments i
LEFT JOIN investment_transactions it ON it.notes = CONCAT('Migrated from investments.id=', i.id)
WHERE i.id <= 10
ORDER BY i.id;
```

### Testing Checklist
- [ ] All investments migrated successfully
- [ ] No data loss (counts match)
- [ ] Field mapping correct (spot check 10 records)
- [ ] Portfolio shows all investments
- [ ] Income history includes old distributions

### Deliverables
- ✅ Migration script created
- ✅ All data migrated successfully
- ✅ Verification queries passed

---

## Phase 5: Deprecate Old System (Week 2, Days 4-7)

### Objective
Mark old system as deprecated and prepare for archival.

### Tasks

#### 5.1 Add @deprecated Tags
**File:** `server/db.ts`

```typescript
/**
 * @deprecated Use getUnifiedUserInvestments from unifiedInvestmentsDb.ts instead
 * This function will be removed in a future version.
 */
export async function getUserInvestments(userId: number) {
  // ... existing code ...
}

/**
 * @deprecated Use investment_transactions table instead
 * This function will be removed in a future version.
 */
export async function createInvestment(investment: InsertInvestment) {
  // ... existing code ...
}
```

#### 5.2 Update Portfolio to Use Only New System
**File:** `server/routers.ts`

```typescript
// Portfolio
portfolio: router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    // Now only query new system (old data already migrated)
    const investments = await getUserInvestments(ctx.user.id); // From investmentTransactionDb
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const activeInvestments = investments.filter(inv => inv.status === "completed").length;
    
    return {
      totalInvested,
      activeInvestments,
      investments,
    };
  }),
  
  // ... rest of router ...
}),
```

#### 5.3 Archive Old Table
```sql
-- Rename old table for archival
RENAME TABLE investments TO investments_archived;
RENAME TABLE income_distributions TO income_distributions_archived;

-- Create view for backward compatibility (optional)
CREATE VIEW investments AS 
SELECT 
  id,
  userId,
  propertyId,
  investmentAmount as amount,
  numberOfShares as shares,
  pricePerShare as sharePrice,
  ownershipPercentage,
  status,
  distributionFrequency,
  paymentMethod,
  paymentStatus,
  paymentReference as transactionId,
  createdAt as investmentDate,
  paidAt as confirmedAt,
  exitedAt,
  createdAt,
  updatedAt
FROM investment_transactions;
```

### Testing Checklist
- [ ] Portfolio works without old table
- [ ] All features functional
- [ ] No references to old table in active code
- [ ] Backup of old table created

### Deliverables
- ✅ Old functions marked deprecated
- ✅ Portfolio uses new system only
- ✅ Old table archived

---

## Rollback Procedures

### If Migration Fails in Phase 1-3
1. Revert code changes via git
2. Restart server
3. No data loss (old table untouched)

### If Migration Fails in Phase 4
1. Delete migrated records:
   ```sql
   DELETE FROM investment_transactions WHERE notes LIKE 'Migrated from%';
   ```
2. Revert code changes
3. Re-run migration after fixing issues

### If Issues Found in Phase 5
1. Restore old table:
   ```sql
   RENAME TABLE investments_archived TO investments;
   ```
2. Revert portfolio router changes
3. System back to Phase 4 state

---

## Success Criteria

✅ **Phase 1:** Portfolio displays investments from both systems  
✅ **Phase 2:** New investments include all necessary fields  
✅ **Phase 3:** Income distributions work for both systems  
✅ **Phase 4:** All historical data migrated with zero loss  
✅ **Phase 5:** Old system deprecated, new system fully operational

---

## Post-Migration Monitoring

### Week 3: Monitor for Issues
- [ ] Check error logs daily
- [ ] Monitor investment creation success rate
- [ ] Verify income distributions processing correctly
- [ ] Collect user feedback on Portfolio page

### Week 4: Performance Optimization
- [ ] Add indexes to investment_transactions table
- [ ] Optimize unified query performance
- [ ] Cache frequently accessed data

---

## Conclusion

This gradual migration strategy ensures:
- **Zero downtime** - Users can continue investing during migration
- **Data integrity** - All historical data preserved
- **Rollback safety** - Can revert at any phase
- **Testing at each step** - Issues caught early

**Estimated Total Time:** 2-3 weeks  
**Risk Level:** Low (with proper testing)  
**Data Loss Risk:** None (old table kept as backup)

---

**End of Migration Strategy**
