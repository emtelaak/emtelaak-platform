# Manual Permission Testing Checklist

This checklist provides step-by-step instructions for manually verifying that granular permissions are correctly enforced in the Emtelaak platform UI and API.

## Prerequisites

1. ✅ Automated tests have passed (`./run-tests.sh`)
2. ✅ Permissions are seeded in database
3. ✅ Dev server is running (`pnpm dev`)
4. ✅ You have super_admin access to create test users

## Test User Setup

Create the following test users with specific permission combinations:

### Test User 1: View Only User
**Email**: `viewonly@test.emtelaak.com`  
**Permissions**: 
- `view_users`
- `view_investments`
- `view_properties`

### Test User 2: User Manager
**Email**: `usermanager@test.emtelaak.com`  
**Permissions**:
- `view_users`
- `create_user`
- `edit_user`
- `delete_user`

### Test User 3: Investment Manager
**Email**: `investmanager@test.emtelaak.com`  
**Permissions**:
- `view_investments`
- `create_investment`
- `edit_investment`
- `delete_investment`
- `process_distributions`

### Test User 4: Property Manager
**Email**: `propmanager@test.emtelaak.com`  
**Permissions**:
- `view_properties`
- `create_properties`
- `edit_properties`
- `delete_properties`
- `manage_property_documents`

### Test User 5: Partial User Manager
**Email**: `partialuser@test.emtelaak.com`  
**Permissions**:
- `view_users`
- `edit_user`

### Test User 6: Property Acquisition Specialist
**Email**: `acquisition@test.emtelaak.com`  
**Permissions**:
- `view_properties`
- `create_properties`
- `manage_property_documents`

## User Management Permission Tests

### Test 1.1: View Users Permission
**Test User**: View Only User

- [ ] Login as View Only User
- [ ] Navigate to `/admin/users` or admin dashboard
- [ ] **Expected**: Can see user list
- [ ] **Expected**: Cannot see "Create User" button
- [ ] **Expected**: Cannot see "Edit" or "Delete" buttons on user rows
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 1.2: Create User Permission
**Test User**: User Manager

- [ ] Login as User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Can see "Create User" button
- [ ] Click "Create User" button
- [ ] Fill in user details and submit
- [ ] **Expected**: User is created successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 1.3: Create User Without Permission
**Test User**: Partial User Manager

- [ ] Login as Partial User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Cannot see "Create User" button
- [ ] Try to access create user API directly (if possible)
- [ ] **Expected**: API returns 403 Forbidden
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 1.4: Edit User Permission
**Test User**: User Manager

- [ ] Login as User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Can see "Edit" buttons on user rows
- [ ] Click "Edit" on a user
- [ ] Modify user details and save
- [ ] **Expected**: User is updated successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 1.5: Edit User Without Full Permissions
**Test User**: Partial User Manager

- [ ] Login as Partial User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Can see "Edit" buttons (has edit_user permission)
- [ ] **Expected**: Cannot see "Delete" buttons (no delete_user permission)
- [ ] **Expected**: Cannot see "Create User" button (no create_user permission)
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 1.6: Delete User Permission
**Test User**: User Manager

- [ ] Login as User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Can see "Delete" buttons on user rows
- [ ] Click "Delete" on a test user
- [ ] Confirm deletion
- [ ] **Expected**: User is deleted successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 1.7: Delete User Without Permission
**Test User**: Partial User Manager

- [ ] Login as Partial User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Cannot see "Delete" buttons
- [ ] Try to access delete user API directly (if possible)
- [ ] **Expected**: API returns 403 Forbidden
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

## Investment Management Permission Tests

### Test 2.1: View Investments Permission
**Test User**: View Only User

- [ ] Login as View Only User
- [ ] Navigate to `/admin/investments` or admin dashboard
- [ ] **Expected**: Can see investment list
- [ ] **Expected**: Cannot see "Create Investment" button
- [ ] **Expected**: Cannot see "Edit" or "Delete" buttons
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 2.2: Create Investment Permission
**Test User**: Investment Manager

- [ ] Login as Investment Manager
- [ ] Navigate to `/admin/investments`
- [ ] **Expected**: Can see "Create Investment" button
- [ ] Click "Create Investment" button
- [ ] Fill in investment details and submit
- [ ] **Expected**: Investment is created successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 2.3: Edit Investment Permission
**Test User**: Investment Manager

- [ ] Login as Investment Manager
- [ ] Navigate to `/admin/investments`
- [ ] **Expected**: Can see "Edit" buttons on investment rows
- [ ] Click "Edit" on an investment
- [ ] Modify investment details and save
- [ ] **Expected**: Investment is updated successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 2.4: Delete Investment Permission
**Test User**: Investment Manager

- [ ] Login as Investment Manager
- [ ] Navigate to `/admin/investments`
- [ ] **Expected**: Can see "Delete" buttons on investment rows
- [ ] Click "Delete" on a test investment
- [ ] Confirm deletion
- [ ] **Expected**: Investment is deleted successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 2.5: Process Distributions Permission
**Test User**: Investment Manager

- [ ] Login as Investment Manager
- [ ] Navigate to income distributions section
- [ ] **Expected**: Can see "Process Distribution" button or UI
- [ ] Process a test distribution
- [ ] **Expected**: Distribution is processed successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 2.6: Process Distributions Without Permission
**Test User**: View Only User

- [ ] Login as View Only User
- [ ] Navigate to income distributions section
- [ ] **Expected**: Cannot see "Process Distribution" button
- [ ] Try to access process distribution API directly (if possible)
- [ ] **Expected**: API returns 403 Forbidden
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

## Property Management Permission Tests

### Test 3.1: View Properties Permission
**Test User**: View Only User

- [ ] Login as View Only User
- [ ] Navigate to `/admin/properties` or admin dashboard
- [ ] **Expected**: Can see property list
- [ ] **Expected**: Cannot see "Add Property" button
- [ ] **Expected**: Cannot see "Edit" or "Delete" buttons
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 3.2: Create Properties Permission
**Test User**: Property Manager

- [ ] Login as Property Manager
- [ ] Navigate to `/admin/properties`
- [ ] **Expected**: Can see "Add Property" button
- [ ] Click "Add Property" button
- [ ] Fill in property details and submit
- [ ] **Expected**: Property is created successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 3.3: Edit Properties Permission
**Test User**: Property Manager

- [ ] Login as Property Manager
- [ ] Navigate to `/admin/properties`
- [ ] **Expected**: Can see "Edit" buttons on property rows
- [ ] Click "Edit" on a property
- [ ] Modify property details and save
- [ ] **Expected**: Property is updated successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 3.4: Delete Properties Permission
**Test User**: Property Manager

- [ ] Login as Property Manager
- [ ] Navigate to `/admin/properties`
- [ ] **Expected**: Can see "Delete" buttons on property rows
- [ ] Click "Delete" on a test property
- [ ] Confirm deletion
- [ ] **Expected**: Property is deleted successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 3.5: Manage Property Documents Permission
**Test User**: Property Manager

- [ ] Login as Property Manager
- [ ] Navigate to a property detail page
- [ ] **Expected**: Can see "Upload Document" button or section
- [ ] Upload a test document
- [ ] **Expected**: Document is uploaded successfully
- [ ] Delete the uploaded document
- [ ] **Expected**: Document is deleted successfully
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 3.6: Manage Documents Without Permission
**Test User**: View Only User

- [ ] Login as View Only User
- [ ] Navigate to a property detail page
- [ ] **Expected**: Cannot see "Upload Document" button
- [ ] **Expected**: Cannot see "Delete" buttons on documents
- [ ] Try to access upload document API directly (if possible)
- [ ] **Expected**: API returns 403 Forbidden
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

## Workflow-Based Permission Tests

### Test 4.1: Property Acquisition Specialist Workflow
**Test User**: Property Acquisition Specialist

- [ ] Login as Property Acquisition Specialist
- [ ] Navigate to `/admin/properties`
- [ ] **Expected**: Can see "Add Property" button (has create_properties)
- [ ] **Expected**: Can see property list (has view_properties)
- [ ] **Expected**: Cannot see "Edit" buttons (no edit_properties)
- [ ] **Expected**: Cannot see "Delete" buttons (no delete_properties)
- [ ] Create a new property
- [ ] **Expected**: Property is created successfully
- [ ] Navigate to property detail page
- [ ] **Expected**: Can see "Upload Document" button (has manage_property_documents)
- [ ] Upload property documents
- [ ] **Expected**: Documents are uploaded successfully
- [ ] Try to edit the property
- [ ] **Expected**: Cannot edit (no edit_properties permission)
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 4.2: Combined Permissions Independence
**Test User**: Partial User Manager

- [ ] Login as Partial User Manager
- [ ] Navigate to `/admin/users`
- [ ] **Expected**: Can see user list (has view_users)
- [ ] **Expected**: Can see "Edit" buttons (has edit_user)
- [ ] **Expected**: Cannot see "Create User" button (no create_user)
- [ ] **Expected**: Cannot see "Delete" buttons (no delete_user)
- [ ] Edit a user successfully
- [ ] Try to access other admin sections (investments, properties)
- [ ] **Expected**: Cannot access (no permissions for those modules)
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

## API Endpoint Permission Tests

### Test 5.1: User Management API Endpoints
**Test User**: View Only User

Use browser DevTools or Postman to test API endpoints:

- [ ] GET `/api/trpc/admin.users.list`
  - [ ] **Expected**: 200 OK (has view_users)
- [ ] POST `/api/trpc/admin.users.create`
  - [ ] **Expected**: 403 Forbidden (no create_user)
- [ ] PUT `/api/trpc/admin.users.update`
  - [ ] **Expected**: 403 Forbidden (no edit_user)
- [ ] DELETE `/api/trpc/admin.users.delete`
  - [ ] **Expected**: 403 Forbidden (no delete_user)
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 5.2: Investment Management API Endpoints
**Test User**: View Only User

- [ ] GET `/api/trpc/admin.investments.list`
  - [ ] **Expected**: 200 OK (has view_investments)
- [ ] POST `/api/trpc/admin.investments.create`
  - [ ] **Expected**: 403 Forbidden (no create_investment)
- [ ] PUT `/api/trpc/admin.investments.update`
  - [ ] **Expected**: 403 Forbidden (no edit_investment)
- [ ] DELETE `/api/trpc/admin.investments.delete`
  - [ ] **Expected**: 403 Forbidden (no delete_investment)
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 5.3: Property Management API Endpoints
**Test User**: View Only User

- [ ] GET `/api/trpc/admin.properties.list`
  - [ ] **Expected**: 200 OK (has view_properties)
- [ ] POST `/api/trpc/admin.properties.create`
  - [ ] **Expected**: 403 Forbidden (no create_properties)
- [ ] PUT `/api/trpc/admin.properties.update`
  - [ ] **Expected**: 403 Forbidden (no edit_properties)
- [ ] DELETE `/api/trpc/admin.properties.delete`
  - [ ] **Expected**: 403 Forbidden (no delete_properties)
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

## Audit Logging Verification

### Test 6.1: Permission Changes Are Logged
**Test User**: Super Admin

- [ ] Login as Super Admin
- [ ] Navigate to `/super-admin` (audit log viewer)
- [ ] Grant a permission to a test user
- [ ] **Expected**: Action is logged in audit_logs table
- [ ] **Expected**: Log shows: action="grant_permission", userId, permissionId, timestamp
- [ ] Revoke the permission
- [ ] **Expected**: Action is logged in audit_logs table
- [ ] **Expected**: Log shows: action="revoke_permission", userId, permissionId, timestamp
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

### Test 6.2: Admin Actions Are Logged
**Test User**: User Manager

- [ ] Login as User Manager
- [ ] Create a new user
- [ ] Edit a user
- [ ] Delete a user
- [ ] Login as Super Admin
- [ ] Navigate to audit log viewer
- [ ] **Expected**: All three actions are logged with correct details
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: _____________________

## Summary

### Overall Test Results

- **Total Tests**: 30
- **Passed**: _____
- **Failed**: _____
- **Skipped**: _____

### Critical Issues Found

1. _____________________
2. _____________________
3. _____________________

### Recommendations

1. _____________________
2. _____________________
3. _____________________

### Sign-off

**Tester Name**: _____________________  
**Date**: _____________________  
**Approved for Production**: YES / NO  
**Notes**: _____________________
