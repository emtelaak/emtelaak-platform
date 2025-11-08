# Permission Testing Suite

This directory contains comprehensive tests for verifying granular permission enforcement across the Emtelaak platform.

## Overview

The permission system has been refactored from coarse-grained permissions (manage_users, manage_investments) to fine-grained permissions:

### User Management Permissions
- `view_users` - View user list and details
- `create_user` - Create new users
- `edit_user` - Edit existing user information
- `delete_user` - Delete users

### Investment Management Permissions
- `view_investments` - View investment list and details
- `create_investment` - Create new investment opportunities
- `edit_investment` - Edit existing investments
- `delete_investment` - Delete investments
- `process_distributions` - Process income distributions to investors

### Property Management Permissions
- `view_properties` - View property list and details
- `create_properties` - Create new properties
- `edit_properties` - Edit existing properties
- `delete_properties` - Delete properties
- `manage_property_documents` - Upload/manage property documents

## Test Files

### `testUtils.ts`
Utility functions for permission testing:
- `createTestUser(name, email, permissions)` - Create test users with specific permissions
- `userHasPermission(userId, permissionName)` - Check if user has a permission
- `getUserPermissions(userId)` - Get all permissions for a user
- `cleanupTestUsers(userIds)` - Clean up test data after tests

### `userManagement.test.ts`
Tests for user management permissions:
- ✅ view_users permission enforcement
- ✅ create_user permission enforcement
- ✅ edit_user permission enforcement
- ✅ delete_user permission enforcement
- ✅ Combined permissions (multiple permissions)
- ✅ Granular independence (permissions don't grant each other)

### `investmentManagement.test.ts`
Tests for investment management permissions:
- ✅ view_investments permission enforcement
- ✅ create_investment permission enforcement
- ✅ edit_investment permission enforcement
- ✅ delete_investment permission enforcement
- ✅ process_distributions permission enforcement
- ✅ Combined permissions
- ✅ Granular independence

### `propertyManagement.test.ts`
Tests for property management permissions:
- ✅ view_properties permission enforcement
- ✅ create_properties permission enforcement
- ✅ edit_properties permission enforcement
- ✅ delete_properties permission enforcement
- ✅ manage_property_documents permission enforcement
- ✅ Combined permissions
- ✅ Granular independence
- ✅ Workflow-based permission scenarios (acquisition specialist, maintenance staff)

## Running Tests

### Prerequisites
```bash
# Install dependencies if not already installed
pnpm install

# Ensure database is running and seeded with permissions
pnpm db:push
```

### Run All Permission Tests
```bash
# Run all tests in the permissions directory
pnpm test tests/permissions/

# Run with verbose output
pnpm test tests/permissions/ --reporter=verbose

# Run with coverage
pnpm test tests/permissions/ --coverage
```

### Run Specific Test Files
```bash
# User management tests only
pnpm test tests/permissions/userManagement.test.ts

# Investment management tests only
pnpm test tests/permissions/investmentManagement.test.ts

# Property management tests only
pnpm test tests/permissions/propertyManagement.test.ts
```

### Watch Mode (for development)
```bash
# Run tests in watch mode
pnpm test tests/permissions/ --watch
```

## Test Structure

Each test file follows this structure:

```typescript
describe("Permission Category", () => {
  const testUserIds: number[] = [];

  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
  });

  describe("specific_permission", () => {
    it("should allow action with permission", async () => {
      const testUser = await createTestUser(
        "Test User",
        "test@example.com",
        ["specific_permission"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(
        testUser.id,
        "specific_permission"
      );
      expect(hasPermission).toBe(true);
    });

    it("should deny action without permission", async () => {
      const testUser = await createTestUser(
        "No Perms User",
        "noperms@example.com",
        []
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(
        testUser.id,
        "specific_permission"
      );
      expect(hasPermission).toBe(false);
    });
  });
});
```

## Expected Results

All tests should pass with the following characteristics:

1. **Permission Independence**: Having one permission does not grant another
2. **Explicit Grant Required**: Permissions must be explicitly granted
3. **Granular Control**: Each permission controls a specific action
4. **Combined Permissions**: Users can have multiple permissions
5. **Role-Based Inheritance**: Permissions can be granted via roles or directly

## Manual Testing Checklist

After automated tests pass, perform manual UI testing:

### User Management UI
- [ ] Admin with `view_users` can see user list
- [ ] Admin with `create_user` sees "Create User" button
- [ ] Admin with `edit_user` sees "Edit" buttons on user rows
- [ ] Admin with `delete_user` sees "Delete" buttons on user rows
- [ ] Admin without permissions sees appropriate restrictions

### Investment Management UI
- [ ] Admin with `view_investments` can access investments page
- [ ] Admin with `create_investment` sees "Create Investment" button
- [ ] Admin with `edit_investment` sees "Edit" buttons
- [ ] Admin with `delete_investment` sees "Delete" buttons
- [ ] Admin with `process_distributions` sees distribution processing UI

### Property Management UI
- [ ] Admin with `view_properties` can access properties admin page
- [ ] Admin with `create_properties` sees "Add Property" button
- [ ] Admin with `edit_properties` sees "Edit" buttons
- [ ] Admin with `delete_properties` sees "Delete" buttons
- [ ] Admin with `manage_property_documents` sees document upload UI

## API Endpoint Testing

Test that API endpoints enforce permissions:

### User Management Endpoints
```bash
# Test view_users
curl -X GET http://localhost:3000/api/trpc/admin.users.list \
  -H "Cookie: session=<token>"

# Test create_user
curl -X POST http://localhost:3000/api/trpc/admin.users.create \
  -H "Cookie: session=<token>" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

### Investment Management Endpoints
```bash
# Test view_investments
curl -X GET http://localhost:3000/api/trpc/admin.investments.list \
  -H "Cookie: session=<token>"

# Test create_investment
curl -X POST http://localhost:3000/api/trpc/admin.investments.create \
  -H "Cookie: session=<token>" \
  -d '{"propertyId":1,"userId":1,"amount":1000}'
```

### Property Management Endpoints
```bash
# Test view_properties
curl -X GET http://localhost:3000/api/trpc/admin.properties.list \
  -H "Cookie: session=<token>"

# Test create_properties
curl -X POST http://localhost:3000/api/trpc/admin.properties.create \
  -H "Cookie: session=<token>" \
  -d '{"name":"Test Property","location":"Cairo"}'
```

## Troubleshooting

### Tests Fail with "Database not available"
- Ensure `DATABASE_URL` environment variable is set
- Check that database server is running
- Verify database connection in `.env` file

### Tests Fail with "Permission not found"
- Run permission seeding script: `pnpm tsx server/seedPermissions.ts`
- Verify permissions exist in database: `SELECT * FROM permissions;`

### Tests Fail with Foreign Key Errors
- Ensure test cleanup is running properly
- Check that `afterAll` hooks are executing
- Manually clean test data if needed: `DELETE FROM users WHERE openId LIKE 'test_%';`

### Tests Pass but UI Still Shows Unauthorized
- Clear browser cache and cookies
- Re-login to refresh user session
- Check that frontend is using correct permission checks
- Verify tRPC procedures have proper permission middleware

## Next Steps

1. **Integration Tests**: Add tests that verify API endpoint permission enforcement
2. **UI Tests**: Add Playwright/Cypress tests for UI permission visibility
3. **Performance Tests**: Test permission checks with large user/permission datasets
4. **Audit Tests**: Verify all permission changes are logged in audit_logs table
5. **Role Tests**: Test permission inheritance through roles

## Support

For questions or issues with permission testing:
- Review the permission seeding script: `server/seedPermissions.ts`
- Check the admin permissions router: `server/adminPermissionsRouter.ts`
- Consult the main README for overall project documentation
