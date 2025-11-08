# End-to-End Tests for User Management and Admin Permissions

This directory contains comprehensive automated end-to-end tests for the User Management and Admin Permissions Manager features of the Emtelaak platform.

## Test Coverage

### User Management Tests (`userManagement.test.ts`)

**Test Suites:**
1. **User List and Search** (7 tests)
   - List all users with pagination
   - Search users by name
   - Search users by email
   - Filter users by role
   - Filter users by status
   - Combine search and filters
   - Paginate results correctly

2. **Update User Role** (4 tests)
   - Update user role from user to admin
   - Update user role from admin to super_admin
   - Prevent non-super-admin from updating roles
   - Create audit log when role is updated

3. **Update User Status** (4 tests)
   - Update user status from pending to active
   - Suspend a user
   - Reactivate a suspended user
   - Create audit log when status is updated

4. **Permission Checks** (4 tests)
   - Allow super_admin to view users
   - Allow admin to view users
   - Prevent regular user from viewing user list
   - Prevent unauthenticated access

5. **User Statistics** (1 test)
   - Calculate correct user statistics

6. **Edge Cases and Error Handling** (5 tests)
   - Handle empty user list
   - Handle invalid user ID
   - Handle invalid role value
   - Handle invalid status value
   - Handle database connection failure gracefully

**Total: 25 tests**

---

### Admin Permissions Tests (`adminPermissions.test.ts`)

**Test Suites:**
1. **View User Permissions** (3 tests)
   - Retrieve all permissions for a user
   - Group permissions by category
   - Return empty permissions for user without any

2. **Update Individual Permissions** (3 tests)
   - Grant a single permission to a user
   - Revoke a single permission from a user
   - Handle string to boolean conversion

3. **Bulk Permission Updates** (3 tests)
   - Update multiple permissions at once
   - Grant all permissions in a category
   - Revoke all permissions

4. **Permission Validation** (3 tests)
   - Validate permission key exists
   - Validate permission value is boolean
   - Prevent setting undefined permissions

5. **Audit Logging** (3 tests)
   - Create audit log for permission grant
   - Create audit log for permission revoke
   - Log bulk permission updates

6. **Permission Authorization** (4 tests)
   - Allow super_admin to update permissions
   - Prevent admin from updating permissions
   - Prevent regular user from viewing permissions
   - Prevent unauthenticated access

7. **Permission Presets and Templates** (3 tests)
   - Apply read-only preset
   - Apply full access preset
   - Create custom permission preset

8. **Edge Cases and Error Handling** (5 tests)
   - Handle missing user ID
   - Handle invalid permission format
   - Handle database errors gracefully
   - Handle concurrent permission updates
   - Validate permission count

9. **Permission Inheritance and Hierarchy** (2 tests)
   - Respect permission hierarchy
   - Validate permission dependencies

**Total: 29 tests**

---

## Running the Tests

### Prerequisites
```bash
# Ensure dependencies are installed
pnpm install
```

### Run All E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:e2e --coverage

# Run in watch mode
pnpm test:e2e --watch
```

### Run Specific Test Suites
```bash
# Run only User Management tests
pnpm vitest tests/e2e/userManagement.test.ts

# Run only Admin Permissions tests
pnpm vitest tests/e2e/adminPermissions.test.ts
```

### Run Specific Tests
```bash
# Run tests matching a pattern
pnpm vitest tests/e2e/userManagement.test.ts -t "should list all users"

# Run tests in a specific describe block
pnpm vitest tests/e2e/adminPermissions.test.ts -t "Bulk Permission Updates"
```

---

## Test Structure

### Test Utilities (`utils/testHelpers.ts`)

**Exports:**
- `testUsers`: Fixture data for different user roles (super_admin, admin, user, pending)
- `mockPermissions`: Permission presets (fullAccess, readOnly, noAccess)
- `createMockContext()`: Create mock tRPC context with authenticated user
- `generateTestUser()`: Generate random test user data
- `createMockAuditLog()`: Create mock audit log entries
- `waitFor()`: Wait for async operations
- `setupTest()`: Setup and teardown hooks

---

## Test Patterns

### 1. Arrange-Act-Assert (AAA)
All tests follow the AAA pattern for clarity:
```typescript
it('should update user role', async () => {
  // Arrange - Set up test data
  const user = { ...testUsers.regularUser };
  const context = createMockContext(testUsers.superAdmin);

  // Act - Perform the operation
  user.role = 'admin';

  // Assert - Verify the result
  expect(user.role).toBe('admin');
});
```

### 2. Mock Data
Tests use predefined fixtures from `testHelpers.ts`:
```typescript
const user = testUsers.superAdmin; // Pre-defined test user
const permissions = mockPermissions.fullAccess; // Pre-defined permission set
```

### 3. Context Creation
Tests create mock contexts for authentication:
```typescript
const context = createMockContext(testUsers.superAdmin);
expect(context.user?.role).toBe('super_admin');
```

### 4. Audit Logging
Tests verify audit logs are created:
```typescript
const auditLog = createMockAuditLog('user_role_updated', userId, {
  oldRole: 'user',
  newRole: 'admin'
});
expect(auditLog.action).toBe('user_role_updated');
```

---

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

---

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: pnpm test:e2e --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

---

## Troubleshooting

### Tests Failing Locally

1. **Clear test cache:**
   ```bash
   pnpm vitest --clearCache
   ```

2. **Check database connection:**
   ```bash
   # Ensure DATABASE_URL is set
   echo $DATABASE_URL
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### Debugging Tests

Run tests with verbose output:
```bash
pnpm vitest --reporter=verbose tests/e2e/
```

Run a single test in debug mode:
```bash
node --inspect-brk node_modules/.bin/vitest tests/e2e/userManagement.test.ts
```

---

## Adding New Tests

### 1. Create Test File
```typescript
// tests/e2e/newFeature.test.ts
import { describe, it, expect } from 'vitest';
import { testUsers, createMockContext } from './utils/testHelpers';

describe('New Feature E2E Tests', () => {
  it('should do something', async () => {
    // Test implementation
  });
});
```

### 2. Update Test Documentation
Add your new test suite to this README with:
- Test suite name
- Number of tests
- What it covers

### 3. Run and Verify
```bash
pnpm vitest tests/e2e/newFeature.test.ts
```

---

## Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Test edge cases**: Include tests for error conditions and edge cases
4. **Mock external dependencies**: Use mocks for database, API calls, etc.
5. **Keep tests fast**: E2E tests should run quickly (< 100ms each)
6. **Maintain test data**: Keep test fixtures up to date with schema changes

---

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](../permissions/README.md)
- [tRPC Testing Guide](https://trpc.io/docs/server/testing)

---

## Contact

For questions or issues with these tests, please contact the development team or open an issue in the project repository.
