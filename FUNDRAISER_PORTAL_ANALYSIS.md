# Fundraiser Portal Analysis

## Current Status vs. Specification

### What's Already Implemented ✅

| Feature | Status | Location |
|---------|--------|----------|
| Fundraiser Dashboard | ✅ Exists | `/fundraiser/dashboard` → `FundraiserDashboard.tsx` |
| Property Management | ✅ Exists | `/fundraiser/property-management` → `FundraiserPropertyManagement.tsx` |
| My Offerings | ✅ Exists | `/offerings` → `OfferingsDashboard.tsx` |
| Create Offering | ✅ Exists | `/offerings/create` → `CreateOffering.tsx` |
| Backend Data Filtering | ✅ Exists | `fundraiserDb.ts` filters by `fundraiserId` |
| Role-based Access | ✅ Exists | `fundraiserProcedure` checks for fundraiser/admin role |

### What's Missing or Needs Refactoring ❌

| Feature | Status | Required Action |
|---------|--------|-----------------|
| Dedicated FundraiserLayout | ❌ Missing | Create `client/src/components/layout/FundraiserLayout.tsx` |
| Fundraiser Pages Directory | ❌ Missing | Create `client/src/pages/fundraiser/` directory |
| Route Group with RoleGuard | ❌ Missing | Add protected route wrapper in `App.tsx` |
| New Property Submission Route | ⚠️ Partial | Currently at `/admin/add-property`, should be `/fundraiser/properties/new` |
| Admin Create Buttons Removal | ⚠️ Partial | Admin still has access to `/admin/add-property` |

---

## Detailed Analysis

### 1. File Structure

**Current:**
```
client/src/pages/
├── FundraiserDashboard.tsx
├── FundraiserPropertyManagement.tsx
└── (no dedicated fundraiser directory)
```

**Required:**
```
client/src/pages/fundraiser/
├── FundraiserDashboard.tsx
├── FundraiserProperties.tsx
├── FundraiserPropertyNew.tsx
└── FundraiserOfferings.tsx

client/src/components/layout/
└── FundraiserLayout.tsx
```

### 2. Routing

**Current Routes:**
- `/fundraiser/dashboard` → FundraiserDashboard
- `/fundraiser/property-management` → FundraiserPropertyManagement
- `/offerings` → OfferingsDashboard (shared, not fundraiser-specific)
- `/offerings/create` → CreateOffering (shared)
- `/admin/add-property` → AddProperty (in admin!)

**Required Routes:**
- `/fundraiser` → FundraiserDashboard (Overview)
- `/fundraiser/properties` → List of fundraiser's properties
- `/fundraiser/properties/new` → Property submission form
- `/fundraiser/offerings` → Status of investment rounds

### 3. Layout

**Current:** Uses shared `DashboardLayout` with conditional sidebar items

**Required:** Dedicated `FundraiserLayout` with:
- Dashboard (Overview)
- My Properties
- New Submission
- My Offerings

### 4. Backend Endpoints

**Current (Already Implemented):**
- `fundraiser.getDashboardStats` - Filters by fundraiserId ✅
- `fundraiser.getProperties` - Filters by fundraiserId ✅
- `fundraiser.getPropertyPerformance` - Filters by fundraiserId ✅
- `fundraiser.getRecentInvestors` - Filters by fundraiserId ✅

**Issue:** `FundraiserPropertyManagement.tsx` uses `trpc.properties.list.useQuery()` which returns ALL properties, not just the fundraiser's properties.

### 5. Admin Panel

**Current Issues:**
- Admin Dashboard has "Add Property" floating action button
- `/admin/add-property` route exists
- FundraiserPropertyManagement links to `/admin/add-property`

**Required:**
- Admin should only have "Review/Approve" lists
- Remove "Create Property" buttons from Admin
- Move property creation to Fundraiser Portal

---

## Recommendations

### Option A: Full Refactor (As Specified)
1. Create dedicated `FundraiserLayout.tsx`
2. Create `client/src/pages/fundraiser/` directory
3. Move/refactor pages into the new structure
4. Add RoleGuard wrapper for `/fundraiser` routes
5. Remove create buttons from Admin panel
6. Update all links and navigation

### Option B: Minimal Fix (Quick)
1. Fix `FundraiserPropertyManagement.tsx` to use `trpc.fundraiser.getProperties`
2. Change "Add Property" link from `/admin/add-property` to `/properties/create`
3. Keep current structure but ensure data isolation

---

## Current Sidebar Items (DashboardLayout.tsx)

**Fundraiser Dashboard submenu:**
- Dashboard → `/fundraiser/dashboard`
- Property Management → `/fundraiser/property-management`
- My Offerings → `/offerings`
- Create Offering → `/offerings/create`

This is partially correct but:
- Uses shared DashboardLayout instead of dedicated FundraiserLayout
- "My Offerings" should be `/fundraiser/offerings` not `/offerings`
- Missing "New Submission" for property creation

---

## Conclusion

The Fundraiser Portal is **partially implemented**. The core functionality exists but doesn't follow the specified architecture:

1. **Works:** Dashboard stats, property performance, recent investors (with data filtering)
2. **Missing:** Dedicated layout, proper route grouping, role guard wrapper
3. **Issue:** Property creation still in Admin area, property list not filtered

**Recommendation:** Implement the full refactor to properly separate concerns between Admin and Fundraiser portals.
