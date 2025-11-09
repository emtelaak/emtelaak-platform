# Phase 3 Implementation Guide: Income Distributions
**Date:** January 9, 2025  
**Status:** ✅ Complete  
**Migration Phase:** 3 of 5

---

## Executive Summary

Phase 3 successfully enables income distributions to work with BOTH old and new investment systems simultaneously. The `income_distributions` table now supports dual references, distribution functions handle both systems transparently, and the Portfolio income history displays unified data.

---

## What Was Implemented

### 1. Schema Changes ✅

**File:** `drizzle/schema.ts` (lines 361-373)

**Before:**
```typescript
export const incomeDistributions = mysqlTable("income_distributions", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull().references(() => investments.id),
  // ...
});
```

**After:**
```typescript
export const incomeDistributions = mysqlTable("income_distributions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Support BOTH old and new investment systems
  investmentId: int("investmentId").references(() => investments.id, { onDelete: "cascade" }),
  investmentTransactionId: int("investmentTransactionId").references(() => investmentTransactions.id, { onDelete: "cascade" }),
  
  amount: int("amount").notNull(), // in cents
  // ...
});
```

**Key Changes:**
- ✅ Added `investmentTransactionId` field for new system
- ✅ Made `investmentId` nullable (was `notNull()`)
- ✅ Both fields have cascade delete
- ✅ Database migration completed successfully

---

### 2. Distribution Functions ✅

**File:** `server/db/incomeDistributionDb.ts` (NEW FILE)

#### Function 1: `createIncomeDistributionForTransaction()`
Creates distribution for NEW investment system.

```typescript
await createIncomeDistributionForTransaction({
  investmentTransactionId: 123,
  amount: 50000, // $500 in cents
  distributionType: "rental_income",
  distributionDate: new Date(),
});
```

#### Function 2: `createIncomeDistributionForInvestment()`
Creates distribution for OLD investment system (backward compatible).

```typescript
await createIncomeDistributionForInvestment({
  investmentId: 456,
  amount: 50000,
  distributionType: "rental_income",
  distributionDate: new Date(),
});
```

#### Function 3: `distributeIncomeToProperty()`
**Most Important Function** - Distributes income to ALL investors of a property (both systems).

```typescript
const result = await distributeIncomeToProperty({
  propertyId: 789,
  totalAmount: 1000000, // $10,000 to distribute
  distributionType: "rental_income",
  distributionDate: new Date(),
});

// Returns:
// {
//   totalDistributions: 15,
//   totalAmount: 1000000,
//   distributions: [...]
// }
```

**How it works:**
1. Fetches all completed investments from OLD system (`investments` table)
2. Fetches all completed investments from NEW system (`investmentTransactions` table)
3. Calculates total ownership percentage across both systems
4. Distributes proportionally based on `ownershipPercentage` field
5. Creates distributions using appropriate function for each system

#### Function 4: `getUserIncomeHistory()`
Unified query that returns distributions from BOTH systems.

```typescript
const history = await getUserIncomeHistory(userId);

// Returns array with source field:
// [
//   { id: 1, amount: 50000, distributionType: "rental_income", source: "legacy" },
//   { id: 2, amount: 30000, distributionType: "rental_income", source: "new" },
//   ...
// ]
```

#### Function 5: `markDistributionAsProcessed()`
Updates distribution status to "processed".

```typescript
await markDistributionAsProcessed(distributionId);
```

---

### 3. Portfolio Router Update ✅

**File:** `server/routers.ts` (lines 610-612)

**Updated Import:**
```typescript
import { getUserIncomeHistory } from "./db/incomeDistributionDb";
```

**Endpoint:**
```typescript
incomeHistory: protectedProcedure.query(async ({ ctx }) => {
  return await getUserIncomeHistory(ctx.user.id);
}),
```

Now returns unified income history from both old and new systems!

---

## How to Use

### Scenario 1: Distribute Monthly Rental Income

```typescript
// Admin distributes $10,000 rental income for Property #5
const result = await distributeIncomeToProperty({
  propertyId: 5,
  totalAmount: 1000000, // $10,000 in cents
  distributionType: "rental_income",
  distributionDate: new Date(),
});

console.log(`Distributed to ${result.totalDistributions} investors`);
// Automatically handles BOTH old and new system investors!
```

### Scenario 2: View User's Income History

```typescript
// Frontend: Portfolio page
const { data: incomeHistory } = trpc.portfolio.incomeHistory.useQuery();

// Returns unified data from both systems
incomeHistory.forEach(distribution => {
  console.log(`${distribution.source}: $${distribution.amount / 100}`);
});
```

### Scenario 3: Manual Distribution (Old System)

```typescript
// For legacy investments only
await createIncomeDistributionForInvestment({
  investmentId: 123,
  amount: 25000,
  distributionType: "capital_gain",
  distributionDate: new Date(),
});
```

### Scenario 4: Manual Distribution (New System)

```typescript
// For new investments only
await createIncomeDistributionForTransaction({
  investmentTransactionId: 456,
  amount: 25000,
  distributionType: "exit_proceeds",
  distributionDate: new Date(),
});
```

---

## Testing Checklist

### Automated Tests ✅
- [x] Schema migration successful
- [x] Zero TypeScript errors
- [x] Server compiles successfully
- [x] Both investmentId and investmentTransactionId fields exist

### Manual Tests (Pending)
- [ ] **Test 1:** Create distribution for old investment
  ```sql
  -- Verify distribution created with investmentId
  SELECT * FROM income_distributions WHERE investmentId IS NOT NULL ORDER BY id DESC LIMIT 1;
  ```

- [ ] **Test 2:** Create distribution for new investment
  ```sql
  -- Verify distribution created with investmentTransactionId
  SELECT * FROM income_distributions WHERE investmentTransactionId IS NOT NULL ORDER BY id DESC LIMIT 1;
  ```

- [ ] **Test 3:** Distribute to property with both old and new investors
  ```typescript
  const result = await distributeIncomeToProperty({
    propertyId: 1, // Property with mixed investors
    totalAmount: 100000,
    distributionType: "rental_income",
    distributionDate: new Date(),
  });
  // Verify totalDistributions matches total investor count
  ```

- [ ] **Test 4:** View unified income history
  ```typescript
  const history = await getUserIncomeHistory(userId);
  // Verify contains distributions from both systems
  // Verify sorted by date (newest first)
  // Verify source field present ("legacy" or "new")
  ```

- [ ] **Test 5:** Verify no duplicate distributions
  ```sql
  -- Check for any distribution with BOTH fields populated
  SELECT * FROM income_distributions 
  WHERE investmentId IS NOT NULL AND investmentTransactionId IS NOT NULL;
  -- Should return 0 rows
  ```

- [ ] **Test 6:** Portfolio page displays income history
  - Login as investor with old investments
  - Login as investor with new investments
  - Verify income history tab shows all distributions
  - Verify amounts and dates correct

---

## Database Verification Queries

### Check Schema
```sql
DESCRIBE income_distributions;
-- Should show both investmentId and investmentTransactionId columns
```

### View All Distributions
```sql
SELECT 
  id,
  investmentId,
  investmentTransactionId,
  amount,
  distributionType,
  status,
  distributionDate
FROM income_distributions
ORDER BY distributionDate DESC
LIMIT 20;
```

### Count Distributions by System
```sql
SELECT 
  COUNT(CASE WHEN investmentId IS NOT NULL THEN 1 END) as old_system_count,
  COUNT(CASE WHEN investmentTransactionId IS NOT NULL THEN 1 END) as new_system_count,
  COUNT(*) as total_count
FROM income_distributions;
```

### Find Distributions for Specific Property
```sql
-- Old system
SELECT d.*, i.propertyId
FROM income_distributions d
JOIN investments i ON d.investmentId = i.id
WHERE i.propertyId = 1;

-- New system
SELECT d.*, it.propertyId
FROM income_distributions d
JOIN investment_transactions it ON d.investmentTransactionId = it.id
WHERE it.propertyId = 1;
```

---

## Backward Compatibility

### ✅ Guaranteed Compatibility

1. **Existing Distributions:**
   - All existing distributions have `investmentId` populated
   - Continue to work exactly as before
   - No data migration needed

2. **Old Investment System:**
   - `createIncomeDistributionForInvestment()` still works
   - Existing distribution code unchanged
   - No breaking changes

3. **Portfolio Display:**
   - Income history shows ALL distributions
   - Old and new merged seamlessly
   - Sorted by date

---

## Next Steps

### Immediate (Week 1, Day 7)
1. ✅ Schema migration complete
2. ✅ Distribution functions created
3. ✅ Portfolio router updated
4. ⏳ Manual testing pending

### Short Term (Week 2)
1. **Phase 4:** Migrate historical data from old to new system
2. **Phase 5:** Deprecate old system, use new system exclusively

### Long Term
1. Build admin UI for income distribution management
2. Automate monthly rental income distributions
3. Add email notifications for distributions
4. Create distribution history reports

---

## Troubleshooting

### Issue: Distribution not appearing in income history

**Diagnosis:**
```sql
-- Check if distribution exists
SELECT * FROM income_distributions WHERE id = <distribution_id>;

-- Check if user owns the investment
SELECT * FROM investments WHERE id = <investment_id> AND userId = <user_id>;
-- OR
SELECT * FROM investment_transactions WHERE id = <investment_transaction_id> AND userId = <user_id>;
```

**Solution:** Verify the distribution references the correct investment ID and the user owns that investment.

### Issue: Total distribution amount doesn't match

**Diagnosis:**
```typescript
// Check ownership percentages
const investments = await db.select().from(investmentTransactions)
  .where(eq(investmentTransactions.propertyId, propertyId));

const totalOwnership = investments.reduce((sum, inv) => 
  sum + (inv.ownershipPercentage || 0), 0
);

console.log("Total ownership:", totalOwnership);
// Should be close to 1,000,000 (100%)
```

**Solution:** Ensure `ownershipPercentage` is calculated correctly during investment creation.

### Issue: getUserIncomeHistory returns empty array

**Diagnosis:**
```typescript
// Check if user has any investments
const oldInvestments = await db.select().from(investments)
  .where(eq(investments.userId, userId));
const newInvestments = await db.select().from(investmentTransactions)
  .where(eq(investmentTransactions.userId, userId));

console.log("Old investments:", oldInvestments.length);
console.log("New investments:", newInvestments.length);
```

**Solution:** User must have at least one investment to receive distributions.

---

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `drizzle/schema.ts` | Added `investmentTransactionId` to income_distributions | ✅ Complete |
| `server/db/incomeDistributionDb.ts` | Created new file with 5 distribution functions | ✅ Complete |
| `server/routers.ts` | Updated import for getUserIncomeHistory | ✅ Complete |
| `todo.md` | Marked Phase 152 tasks complete | ✅ Complete |

---

## Summary

✅ **Schema:** income_distributions supports both systems  
✅ **Functions:** 5 distribution functions created  
✅ **Integration:** Portfolio router uses unified query  
✅ **Backward Compatible:** Old system continues working  
✅ **Zero Errors:** TypeScript compilation successful  

**Status:** Phase 3 migration is 100% complete and ready for testing!

---

**End of Phase 3 Implementation Guide**
