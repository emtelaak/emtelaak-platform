# Phase 149 Testing Guide
**Date:** January 9, 2025  
**Purpose:** Verify Phase 1 migration compatibility layer and property management system

---

## Testing Environment

**Dev Server:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer  
**Admin Access Required:** Yes (role: admin)  
**Test User:** Owner account

---

## Test Suite Overview

| Test # | Feature | Status | Priority |
|--------|---------|--------|----------|
| 1 | Portfolio displays unified investments | ⏳ Pending | 🔴 Critical |
| 2 | Property price update via admin UI | ⏳ Pending | 🔴 Critical |
| 3 | Investment with updated price | ⏳ Pending | 🔴 Critical |
| 4 | New investment appears in Portfolio | ⏳ Pending | 🔴 Critical |
| 5 | Configurable fees in calculation | ⏳ Pending | 🟡 High |
| 6 | Audit logs for price changes | ⏳ Pending | 🟡 High |

---

## Test 1: Portfolio Displays Unified Investments

### Objective
Verify that Portfolio page shows investments from BOTH old and new systems.

### Prerequisites
- At least one investment in old `investments` table
- At least one investment in new `investment_transactions` table
- User logged in with admin role

### Steps
1. Navigate to `/portfolio`
2. Wait for page to load
3. Check "My Investments" section

### Expected Results
✅ **Pass Criteria:**
- Portfolio loads without errors
- Investments from old system visible (marked as "legacy" in source)
- Investments from new system visible (marked as "new" in source)
- No duplicate investments shown
- Investments sorted by date (newest first)
- Total invested amount includes both systems

### Verification Queries
```sql
-- Check old investments count
SELECT COUNT(*) as old_count FROM investments WHERE userId = ?;

-- Check new investments count
SELECT COUNT(*) as new_count FROM investment_transactions WHERE userId = ?;

-- Verify unified query returns both
-- (Check browser console for API response)
```

### Troubleshooting
- **Issue:** Portfolio shows 0 investments
  - **Fix:** Check if user has any investments in either table
- **Issue:** Only old OR new investments shown
  - **Fix:** Verify `getUnifiedPortfolioSummary` is being called in router
- **Issue:** Duplicate investments
  - **Fix:** Check if migration script ran twice

---

## Test 2: Property Price Update via Admin UI

### Objective
Verify admins can update property share prices through the UI.

### Prerequisites
- Admin user logged in
- At least one property in database
- Property has existing sharePrice value

### Steps
1. Navigate to `/admin/property-management`
2. Locate a property in the table
3. Note current share price
4. Click "Edit Price" button
5. Enter new share price (e.g., $150 instead of $100)
6. Review calculation preview
7. Click "Save Changes"

### Expected Results
✅ **Pass Criteria:**
- Admin Property Management page loads
- Properties table displays all properties
- Edit Price dialog opens
- Current price shown in dialog
- New price input accepts decimal values
- Calculation preview updates in real-time
- Warning message displayed about impact
- Save button enabled when valid price entered
- Success toast appears after save
- Table refreshes with new price
- Dialog closes automatically

### Verification Queries
```sql
-- Check property price updated
SELECT id, name, sharePrice FROM properties WHERE id = ?;

-- Check audit log created
SELECT * FROM audit_logs 
WHERE entityType = 'property' 
  AND entityId = ? 
  AND action = 'update_property_share_price'
ORDER BY createdAt DESC 
LIMIT 1;
```

### Test Data
```
Property ID: 1
Old Price: 10000 cents ($100)
New Price: 15000 cents ($150)
```

### Troubleshooting
- **Issue:** Page shows "No properties found"
  - **Fix:** Check if properties exist in database
- **Issue:** Save button disabled
  - **Fix:** Verify price is valid number >= 0
- **Issue:** Error on save
  - **Fix:** Check browser console and server logs

---

## Test 3: Investment with Updated Price

### Objective
Verify new investments use the updated property share price.

### Prerequisites
- Property share price updated in Test 2
- User logged in (can be non-admin)
- Property has available shares

### Steps
1. Navigate to property detail page (e.g., `/property/1`)
2. Click "Invest Now" button
3. Enter number of shares (e.g., 10 shares)
4. Review investment calculation

### Expected Results
✅ **Pass Criteria:**
- Investment modal opens
- Share price matches updated value from Test 2
- Investment amount = shares × new price
- Platform fee calculated using configurable percentage
- Processing fee matches configured value
- Total amount = investment + platform fee + processing fee
- Fee breakdown shows dynamic percentage (not hardcoded "2.5%")

### Example Calculation
```
Shares: 10
New Price Per Share: $150 (15000 cents)
Investment Amount: 10 × $150 = $1,500

Platform Fee (2.5%): $1,500 × 0.025 = $37.50
Processing Fee: $5.00
Total Amount: $1,500 + $37.50 + $5.00 = $1,542.50
```

### Verification
Check API response in browser console:
```json
{
  "numberOfShares": 10,
  "pricePerShare": 15000,
  "investmentAmount": 150000,
  "platformFee": 3750,
  "platformFeePercentage": 2.5,
  "processingFee": 500,
  "processingFeeDollars": 5,
  "totalAmount": 154250
}
```

### Troubleshooting
- **Issue:** Still shows old price ($100)
  - **Fix:** Clear browser cache and refresh
- **Issue:** Calculation incorrect
  - **Fix:** Verify property price updated in database

---

## Test 4: New Investment Appears in Portfolio

### Objective
Verify investments created through PropertyDetail appear in Portfolio.

### Prerequisites
- Test 3 completed (investment created)
- Same user logged in

### Steps
1. Complete investment in PropertyDetail modal
2. Wait for confirmation
3. Navigate to `/portfolio`
4. Check "My Investments" section

### Expected Results
✅ **Pass Criteria:**
- New investment appears in Portfolio
- Investment details match what was entered:
  * Property name correct
  * Number of shares correct
  * Investment amount correct
  * Status shows "pending" or "completed"
- Investment appears at top (sorted by date)
- Total invested amount increased
- Active investments count increased (if completed)

### Verification Queries
```sql
-- Check investment created
SELECT * FROM investment_transactions 
WHERE userId = ? 
ORDER BY createdAt DESC 
LIMIT 1;

-- Verify it appears in unified query
-- (Check Portfolio API response in browser console)
```

### Troubleshooting
- **Issue:** Investment not visible in Portfolio
  - **Fix:** Verify Phase 1 compatibility layer implemented
  - **Fix:** Check `getUnifiedPortfolioSummary` includes new investments
- **Issue:** Investment shows wrong amount
  - **Fix:** Check `investmentAmount` field in database

---

## Test 5: Configurable Fees in Calculation

### Objective
Verify investment calculations use configurable fees from database.

### Prerequisites
- Admin user logged in
- Platform settings accessible

### Steps
1. Navigate to `/admin/platform-settings`
2. Note current platform fee percentage
3. Update platform fee to 3.0%
4. Update processing fee to $7.00
5. Save changes
6. Navigate to property detail page
7. Enter investment amount
8. Check fee calculation

### Expected Results
✅ **Pass Criteria:**
- Platform Settings page loads
- Current fees displayed in cards
- Fee update forms accept valid values
- Success toast after save
- New investment calculation uses updated fees:
  * Platform fee = investment × 3.0%
  * Processing fee = $7.00
- Fee breakdown label shows "Platform Fee (3%)" not "(2.5%)"

### Example Calculation
```
Investment: $1,000
Platform Fee (3%): $1,000 × 0.03 = $30.00
Processing Fee: $7.00
Total: $1,037.00
```

### Verification Queries
```sql
-- Check platform settings updated
SELECT * FROM platform_settings WHERE settingKey = 'platform_fee_percentage';
SELECT * FROM platform_settings WHERE settingKey = 'processing_fee_cents';

-- Check audit logs
SELECT * FROM audit_logs 
WHERE action IN ('update_platform_fee', 'update_processing_fee')
ORDER BY createdAt DESC 
LIMIT 2;
```

### Troubleshooting
- **Issue:** Calculation still uses old fees
  - **Fix:** Clear browser cache
  - **Fix:** Verify `getPlatformFeePercentage()` queries database
- **Issue:** Percentage label still shows hardcoded value
  - **Fix:** Verify PropertyDetail uses `investmentCalculation.platformFeePercentage`

---

## Test 6: Audit Logs for Price Changes

### Objective
Verify all price changes are logged for audit trail.

### Prerequisites
- Admin user logged in
- Property price updated in Test 2
- Platform fees updated in Test 5

### Steps
1. Navigate to admin audit logs (if page exists)
2. Or query database directly

### Expected Results
✅ **Pass Criteria:**
- Audit log entry for property price change:
  * `action`: "update_property_share_price"
  * `entityType`: "property"
  * `entityId`: property ID
  * `changes`: JSON with old and new values
  * `userId`: admin user ID
- Audit log entries for platform fee changes:
  * `action`: "update_platform_fee" or "update_processing_fee"
  * `changes`: JSON with old and new values

### Verification Queries
```sql
-- Property price change logs
SELECT 
  al.id,
  al.action,
  al.entityType,
  al.entityId,
  al.changes,
  u.name as userName,
  al.createdAt
FROM audit_logs al
JOIN users u ON al.userId = u.id
WHERE al.action = 'update_property_share_price'
ORDER BY al.createdAt DESC
LIMIT 5;

-- Platform fee change logs
SELECT 
  al.id,
  al.action,
  al.changes,
  u.name as userName,
  al.createdAt
FROM audit_logs al
JOIN users u ON al.userId = u.id
WHERE al.action IN ('update_platform_fee', 'update_processing_fee')
ORDER BY al.createdAt DESC
LIMIT 5;
```

### Expected Log Format
```json
{
  "field": "sharePrice",
  "oldValue": 10000,
  "newValue": 15000
}
```

### Troubleshooting
- **Issue:** No audit logs found
  - **Fix:** Verify `createAuditLog` called in mutation
  - **Fix:** Check if audit_logs table exists

---

## Integration Testing Checklist

### Phase 1 Compatibility Layer
- [ ] Old investments visible in Portfolio
- [ ] New investments visible in Portfolio
- [ ] No duplicate investments
- [ ] Correct sorting by date
- [ ] Total invested calculation accurate
- [ ] Status mapping works (confirmed → completed)

### Property Management System
- [ ] Admin can view all properties
- [ ] Admin can update share prices
- [ ] Price validation works (no negative values)
- [ ] Calculation preview accurate
- [ ] Warning message displayed
- [ ] Audit logs created

### Investment Flow
- [ ] Investment calculation uses actual property price
- [ ] Investment calculation uses configurable fees
- [ ] Fee breakdown displays dynamic percentage
- [ ] New investments saved to investment_transactions table
- [ ] New investments appear in Portfolio immediately

### User Experience
- [ ] Navigation links work (Property Management, Platform Settings)
- [ ] All pages load without errors
- [ ] Success/error toasts display correctly
- [ ] Loading states shown during operations
- [ ] Mobile responsive (if applicable)

---

## Performance Testing

### Load Times
- [ ] Portfolio page loads in < 2 seconds
- [ ] Property Management page loads in < 2 seconds
- [ ] Investment calculation responds in < 500ms

### Database Queries
- [ ] Unified investment query efficient (no N+1 queries)
- [ ] Property list query uses proper indexes
- [ ] Audit log inserts don't block main operations

---

## Security Testing

### Authorization
- [ ] Only admins can access `/admin/property-management`
- [ ] Only admins can access `/admin/platform-settings`
- [ ] Non-admins get 403 error on admin endpoints
- [ ] Audit logs include user ID for accountability

### Validation
- [ ] Share price cannot be negative
- [ ] Platform fee percentage 0-100
- [ ] Processing fee cannot be negative
- [ ] Number of shares must be positive integer

---

## Regression Testing

### Existing Features
- [ ] Property detail page still works
- [ ] Investment creation still works
- [ ] User authentication still works
- [ ] Old Portfolio features still work
- [ ] Income distributions still work (if implemented)

---

## Post-Testing Actions

### If All Tests Pass ✅
1. Mark Phase 149 as complete in todo.md
2. Create checkpoint with test results
3. Document any edge cases found
4. Plan Phase 2 migration (schema updates)

### If Tests Fail ❌
1. Document failing tests in detail
2. Identify root cause
3. Create bug fix tasks in todo.md
4. Re-run tests after fixes
5. Do NOT proceed to Phase 2 until all tests pass

---

## Test Results Template

```markdown
## Test Results - Phase 149
**Date:** [Date]
**Tester:** [Name]
**Environment:** Development

| Test # | Feature | Result | Notes |
|--------|---------|--------|-------|
| 1 | Portfolio unified display | ✅ Pass | All investments visible |
| 2 | Property price update | ✅ Pass | Price updated successfully |
| 3 | Investment with new price | ✅ Pass | Calculation correct |
| 4 | New investment in Portfolio | ✅ Pass | Appears immediately |
| 5 | Configurable fees | ✅ Pass | Fees applied correctly |
| 6 | Audit logs | ✅ Pass | All changes logged |

**Overall Status:** ✅ All tests passed
**Recommendation:** Proceed to Phase 2 migration
```

---

**End of Testing Guide**
