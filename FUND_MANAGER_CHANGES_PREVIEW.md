# Fund Manager Role Rename - Changes Preview

## Summary
This update renames the "Fundraiser" role to "Fund Manager" across the entire Emtelaak platform.

## Database Changes

### Schema Update (drizzle/schema.ts)
```typescript
// Before
role: mysqlEnum("role", ["user", "investor", "developer", "admin", "super_admin"])

// After
role: mysqlEnum("role", ["user", "investor", "fund_manager", "admin", "super_admin"])
```

### Migration Script (server/db/migrate_fundraiser_to_fund_manager.sql)
```sql
-- Step 1: Add fund_manager to enum
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'investor', 'fundraiser', 'fund_manager', 'admin', 'super_admin') DEFAULT 'user' NOT NULL;

-- Step 2: Migrate existing users
UPDATE users SET role = 'fund_manager' WHERE role = 'fundraiser';

-- Step 3: Remove old fundraiser value
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'investor', 'fund_manager', 'admin', 'super_admin') DEFAULT 'user' NOT NULL;
```

## URL Route Changes

| Before | After | Description |
|--------|-------|-------------|
| `/developer` | `/fund-manager` | Main portal dashboard |
| `/developer/properties` | `/fund-manager/properties` | Properties list |
| `/developer/properties/new` | `/fund-manager/properties/new` | New property submission |
| `/developer/offerings` | `/fund-manager/offerings` | Offerings management |

### Backward Compatibility
All old routes redirect to new routes:
- `/fundraiser/*` → `/fund-manager/*`
- `/developer/*` → `/fund-manager/*`

## UI Label Changes

### English
| Location | Before | After |
|----------|--------|-------|
| Role name | Property Developer | Fund Manager |
| Portal title | Developer Portal | Fund Manager Portal |
| Navigation link | Developer Portal | Fund Manager Portal |

### Arabic
| Location | Before | After |
|----------|--------|-------|
| Role name | مطور عقاري | مدير الصندوق |
| Portal title | بوابة المطور | بوابة مدير الصندوق |
| Navigation link | بوابة المطور | بوابة مدير الصندوق |

## Files Modified

### Frontend (client/src/)
1. **App.tsx** - Route definitions and lazy loading
2. **components/Navigation.tsx** - User dropdown menu
3. **components/Breadcrumb.tsx** - Breadcrumb labels
4. **components/CreateUserDialog.tsx** - Role selection dropdown
5. **components/layout/FundraiserLayout.tsx** - Portal layout and navigation
6. **locales/en.ts** - English translations
7. **locales/ar.ts** - Arabic translations
8. **pages/AdminDashboard.tsx** - Role filter dropdowns
9. **pages/FundraiserDashboard.tsx** - Role access check
10. **pages/Workflows.tsx** - Workflow role display
11. **pages/fundraiser/*.tsx** - Portal pages role checks

### Backend (server/)
1. **routes/fundraiser.ts** - Role check middleware
2. **routes/investmentFlow.ts** - Role authorization
3. **adminPermissionsRouter.ts** - Role enum validations

### Database (drizzle/)
1. **schema.ts** - User role enum definition

## Access Control
Users with `fund_manager` role can access:
- Fund Manager Portal (`/fund-manager/*`)
- Property submission and management
- Offerings creation and management

Admin and Super Admin users also have access to the Fund Manager Portal.

## Testing Checklist
- [ ] Login as fund_manager role user
- [ ] Access Fund Manager Portal via navigation dropdown
- [ ] Navigate to all portal pages
- [ ] Submit a new property
- [ ] View existing properties
- [ ] Access offerings page
- [ ] Verify breadcrumbs show correct labels
- [ ] Test Arabic language labels
- [ ] Verify old URLs redirect correctly
