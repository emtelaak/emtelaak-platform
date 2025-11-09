# Income Distribution System Guide

## Overview

The Income Distribution system allows admins to distribute rental income, capital gains, or exit proceeds to property investors automatically based on their ownership percentage.

## Features

### Backend API (incomeDistribution Router)

1. **distributeIncome** - Distributes income to all investors of a property
2. **getDistributionHistory** - Retrieves distribution history with filters
3. **getPropertyDistributions** - Gets distributions for a specific property
4. **getInvestorPreview** - Shows who will receive distributions before processing
5. **markAsProcessed** - Marks a distribution as processed

### Frontend UI (/admin/income-distribution)

1. **Property Selection** - Dropdown to select property
2. **Distribution Type** - Rental income, capital gain, or exit proceeds
3. **Amount Input** - Total amount to distribute (in dollars)
4. **Date Picker** - Distribution date selection
5. **Investor Preview** - Shows total investors and average amount per investor
6. **Confirmation Dialog** - Review before distribution
7. **Distribution History** - View recent distributions

## How It Works

### Distribution Logic

When you distribute income to a property:

1. System queries **both** old and new investment systems
2. Finds all active/completed investments for the property
3. Calculates each investor's share based on `ownershipPercentage`
4. Creates individual distribution records for each investor
5. Records audit log for compliance

### Ownership Percentage Calculation

- **Old System**: Stored in `investments.ownershipPercentage` (integer × 10000)
- **New System**: Calculated as `(numberOfShares / totalShares) × 1,000,000`

Example:
- Investor owns 100 shares out of 1000 total
- Ownership = 10%
- Stored as 100,000 (10 × 10000)

### Distribution Amount Calculation

```
investorAmount = totalAmount × (ownershipPercentage / 1,000,000)
```

Example:
- Total distribution: $10,000
- Investor ownership: 10% (100,000)
- Investor receives: $10,000 × (100,000 / 1,000,000) = $1,000

## Usage Guide

### Step 1: Access the Page

1. Login as admin
2. Navigate to **Income Distribution** in the sidebar
3. Or visit `/admin/income-distribution`

### Step 2: Create Distribution

1. **Select Property** - Choose from dropdown
2. **Select Type**:
   - Rental Income - Monthly/quarterly rent payments
   - Capital Gain - Property value appreciation
   - Exit Proceeds - Final distribution when property is sold
3. **Enter Amount** - Total amount in dollars (e.g., 10000.00)
4. **Select Date** - Distribution date (defaults to today)
5. **Review Preview**:
   - Total Investors - How many will receive payments
   - Total Ownership - Sum of all ownership percentages
   - Amount per Investor (avg) - Average distribution amount

### Step 3: Confirm Distribution

1. Click **Distribute Income**
2. Review confirmation dialog:
   - Property name
   - Distribution type
   - Total amount
   - Number of investors
3. Click **Confirm Distribution**
4. Wait for success message

### Step 4: View History

- Recent distributions appear in the table below
- Shows: Date, Type, Amount, Status, Processed date
- Filter by property and date range (backend ready)

## Testing Checklist

### Test Case 1: Property with Old System Investors

```sql
-- Check old investments
SELECT * FROM investments WHERE propertyId = 1 AND status IN ('confirmed', 'active');
```

**Expected**: Distribution creates records with `investmentId` populated

### Test Case 2: Property with New System Investors

```sql
-- Check new investments
SELECT * FROM investment_transactions WHERE propertyId = 1 AND status = 'completed';
```

**Expected**: Distribution creates records with `investmentTransactionId` populated

### Test Case 3: Property with Mixed Investors

**Expected**: 
- Both old and new investors receive distributions
- Total distributed = sum of all individual amounts
- No duplicates

### Test Case 4: Ownership Percentage Accuracy

```sql
-- Verify total ownership = 100%
SELECT SUM(ownershipPercentage) / 10000 as totalOwnership 
FROM investments 
WHERE propertyId = 1 AND status IN ('confirmed', 'active');

SELECT SUM(ownershipPercentage) / 10000 as totalOwnership 
FROM investment_transactions 
WHERE propertyId = 1 AND status = 'completed';
```

**Expected**: Total should be close to 100% (allowing for rounding)

### Test Case 5: Distribution Amount Accuracy

**Example**:
- Total: $10,000
- Investor A: 25% ownership → $2,500
- Investor B: 50% ownership → $5,000
- Investor C: 25% ownership → $2,500

```sql
-- Verify distribution amounts
SELECT 
  id,
  amount,
  amount / 100.0 as dollarAmount
FROM income_distributions
WHERE distributionDate = '2024-01-15'
ORDER BY amount DESC;
```

## Database Schema

### income_distributions Table

```sql
CREATE TABLE income_distributions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  investmentId INT NULL,  -- References old investments table
  investmentTransactionId INT NULL,  -- References new investmentTransactions table
  amount INT NOT NULL,  -- Amount in cents
  distributionType ENUM('rental_income', 'capital_gain', 'exit_proceeds'),
  distributionDate DATETIME NOT NULL,
  status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  processedAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Examples

### Distribute Income

```typescript
const result = await trpc.incomeDistribution.distributeIncome.mutate({
  propertyId: 1,
  totalAmount: 1000000,  // $10,000 in cents
  distributionType: "rental_income",
  distributionDate: new Date("2024-01-15"),
});

console.log(`Distributed to ${result.totalDistributions} investors`);
```

### Get Distribution History

```typescript
const history = await trpc.incomeDistribution.getDistributionHistory.query({
  propertyId: 1,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  limit: 50,
});
```

### Get Investor Preview

```typescript
const preview = await trpc.incomeDistribution.getInvestorPreview.query({
  propertyId: 1,
});

console.log(`Total Investors: ${preview.totalInvestors}`);
console.log(`Total Ownership: ${preview.totalOwnership / 10000}%`);
```

## Troubleshooting

### Issue: No investors found for property

**Cause**: Property has no active/completed investments

**Solution**: 
1. Check if property has investments
2. Verify investment status (must be 'confirmed', 'active', or 'completed')

### Issue: Total ownership not 100%

**Cause**: Shares not fully allocated or calculation error

**Solution**:
1. Check total shares vs allocated shares
2. Verify ownershipPercentage calculations
3. Review investment creation logic

### Issue: Distribution amounts don't add up

**Cause**: Rounding errors or missing investors

**Solution**:
1. Use integer arithmetic (cents) to avoid floating point errors
2. Verify all investors included in distribution
3. Check for duplicate distributions

### Issue: Distribution fails with error

**Cause**: Database connection, validation, or permission issue

**Solution**:
1. Check server logs for detailed error
2. Verify admin permissions
3. Ensure property and investors exist
4. Check database connection

## Best Practices

1. **Always preview before distributing** - Use investor preview to verify counts
2. **Verify total ownership** - Should be close to 100%
3. **Use consistent dates** - Match accounting periods
4. **Keep audit trail** - All distributions logged automatically
5. **Test with small amounts first** - Verify calculations before large distributions
6. **Monitor distribution status** - Check processed vs pending
7. **Reconcile regularly** - Compare distributions to accounting records

## Future Enhancements

1. **Automated Distributions** - Schedule monthly/quarterly distributions
2. **Email Notifications** - Notify investors of distributions
3. **Export to CSV** - Download distribution reports
4. **Distribution Templates** - Save common distribution patterns
5. **Batch Processing** - Distribute to multiple properties at once
6. **Tax Reporting** - Generate 1099 forms for investors
7. **Distribution Approval Workflow** - Multi-step approval process

## Support

For issues or questions:
1. Check server logs: `/home/ubuntu/emtelaak-platform/server/logs`
2. Review audit logs in database
3. Contact platform administrator
