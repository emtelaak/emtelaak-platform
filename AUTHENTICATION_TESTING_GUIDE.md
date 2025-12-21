# Authentication Testing Guide

Complete manual testing guide for Emtelaak platform authentication flow.

## Test Accounts

Three test accounts have been created for testing:

### Admin Account
- **Email:** admin@emtelaak-test.com
- **Password:** TestPassword123!
- **Role:** Admin
- **Status:** Active, Email Verified

### Investor Account 1
- **Email:** investor1@emtelaak-test.com
- **Password:** TestPassword123!
- **Role:** Investor (User)
- **Status:** Active, Email Verified

### Investor Account 2
- **Email:** investor2@emtelaak-test.com
- **Password:** TestPassword123!
- **Role:** Investor (User)
- **Status:** Active, Email Verified

---

## Testing Environments

### Development Environment
- **URL:** https://3000-i2uh6dhvlradl3vyss9h0-909761ab.manus-asia.computer
- **Purpose:** Test all features before production deployment

### Production Environment
- **URL:** https://emtelaak.co
- **Purpose:** Final verification in live environment

---

## Test Scenarios

### 1. Sign-In Flow Testing

#### Test 1.1: Successful Sign-In (Admin)
**Steps:**
1. Navigate to https://emtelaak.co/login
2. Enter email: `admin@emtelaak-test.com`
3. Enter password: `TestPassword123!`
4. Click "Sign In"

**Expected Result:**
- ✅ Redirected to dashboard
- ✅ User name displayed in header
- ✅ Admin menu items visible
- ✅ Session created in database

#### Test 1.2: Successful Sign-In (Investor)
**Steps:**
1. Navigate to https://emtelaak.co/login
2. Enter email: `investor1@emtelaak-test.com`
3. Enter password: `TestPassword123!`
4. Click "Sign In"

**Expected Result:**
- ✅ Redirected to dashboard or home
- ✅ User name displayed in header
- ✅ Investor menu items visible (no admin options)
- ✅ Session created in database

#### Test 1.3: Failed Sign-In (Wrong Password)
**Steps:**
1. Navigate to https://emtelaak.co/login
2. Enter email: `admin@emtelaak-test.com`
3. Enter password: `WrongPassword123!`
4. Click "Sign In"

**Expected Result:**
- ✅ Error message displayed
- ✅ User remains on login page
- ✅ No session created

#### Test 1.4: Failed Sign-In (Non-existent Email)
**Steps:**
1. Navigate to https://emtelaak.co/login
2. Enter email: `nonexistent@test.com`
3. Enter password: `TestPassword123!`
4. Click "Sign In"

**Expected Result:**
- ✅ Error message displayed
- ✅ User remains on login page
- ✅ No session created

---

### 2. Sign-Out Flow Testing

#### Test 2.1: Sign-Out from Dashboard
**Steps:**
1. Sign in with any test account
2. Navigate to dashboard
3. Click user menu in header
4. Click "Sign Out" or "Logout"

**Expected Result:**
- ✅ Redirected to home page or login page
- ✅ User menu no longer visible
- ✅ Session revoked in database
- ✅ Cannot access protected routes

#### Test 2.2: Sign-Out from Any Page
**Steps:**
1. Sign in with any test account
2. Navigate to any page (Properties, Profile, etc.)
3. Click "Sign Out"

**Expected Result:**
- ✅ Redirected to home page or login page
- ✅ Session cleared
- ✅ Cannot access previous protected page

---

### 3. Multiple Sign-In/Sign-Out Cycles

#### Test 3.1: Rapid Sign-In/Sign-Out (5 cycles)
**Steps:**
Repeat 5 times:
1. Sign in with `investor1@emtelaak-test.com`
2. Wait 2 seconds
3. Sign out
4. Wait 2 seconds

**Expected Result:**
- ✅ All 5 sign-ins successful
- ✅ All 5 sign-outs successful
- ✅ No errors or crashes
- ✅ Sessions properly created and revoked

#### Test 3.2: Switch Between Accounts
**Steps:**
1. Sign in with `admin@emtelaak-test.com`
2. Sign out
3. Sign in with `investor1@emtelaak-test.com`
4. Sign out
5. Sign in with `investor2@emtelaak-test.com`
6. Sign out

**Expected Result:**
- ✅ All sign-ins successful
- ✅ Correct user data displayed for each account
- ✅ Correct permissions for each role
- ✅ No session conflicts

---

### 4. Session Management Testing

#### Test 4.1: View Active Sessions
**Steps:**
1. Sign in with `admin@emtelaak-test.com`
2. Navigate to `/sessions` or session management page
3. View list of active sessions

**Expected Result:**
- ✅ Current session displayed with green badge
- ✅ Session details shown (device, browser, IP, location)
- ✅ Last activity timestamp displayed
- ✅ Session statistics shown

#### Test 4.2: Multiple Concurrent Sessions
**Steps:**
1. Sign in with `investor1@emtelaak-test.com` on Chrome
2. Open Firefox (or incognito window)
3. Sign in with same account on Firefox
4. Navigate to `/sessions` on Chrome
5. View session list

**Expected Result:**
- ✅ Both sessions visible in list
- ✅ Current session highlighted
- ✅ Different browsers/devices identified
- ✅ Both sessions active

#### Test 4.3: Revoke Single Session
**Steps:**
1. Create 2 sessions (Chrome + Firefox) with same account
2. On Chrome, navigate to `/sessions`
3. Click "Revoke" on Firefox session
4. Confirm revocation
5. Check Firefox - try to access protected page

**Expected Result:**
- ✅ Session revoked successfully
- ✅ Firefox session logged out
- ✅ Chrome session still active
- ✅ Session removed from list

#### Test 4.4: Revoke All Other Sessions
**Steps:**
1. Create 3 sessions (Chrome, Firefox, Safari) with same account
2. On Chrome, navigate to `/sessions`
3. Click "Revoke All Other Sessions"
4. Confirm action
5. Check Firefox and Safari

**Expected Result:**
- ✅ All other sessions revoked
- ✅ Firefox and Safari logged out
- ✅ Chrome session still active
- ✅ Only current session in list

---

### 5. Session Persistence Testing

#### Test 5.1: Session Persists Across Page Refreshes
**Steps:**
1. Sign in with any account
2. Navigate to dashboard
3. Refresh page (F5 or Cmd+R)
4. Navigate to different pages
5. Refresh again

**Expected Result:**
- ✅ User remains logged in after refresh
- ✅ No re-authentication required
- ✅ User data still displayed
- ✅ Session still active

#### Test 5.2: Session Persists Across Browser Restart
**Steps:**
1. Sign in with any account
2. Close browser completely
3. Reopen browser
4. Navigate to https://emtelaak.co

**Expected Result:**
- ✅ User still logged in (if "Remember Me" enabled)
- ✅ Or redirected to login (if session expired)

---

### 6. Protected Routes Testing

#### Test 6.1: Access Protected Route Without Login
**Steps:**
1. Ensure you're logged out
2. Try to access `/dashboard` directly
3. Try to access `/profile` directly
4. Try to access `/sessions` directly

**Expected Result:**
- ✅ Redirected to login page
- ✅ Cannot access protected content
- ✅ After login, redirected to original destination

#### Test 6.2: Access Admin Routes as Investor
**Steps:**
1. Sign in with `investor1@emtelaak-test.com`
2. Try to access `/admin/dashboard`
3. Try to access `/admin/settings`

**Expected Result:**
- ✅ Access denied or redirected
- ✅ Error message shown
- ✅ Cannot view admin content

#### Test 6.3: Access Admin Routes as Admin
**Steps:**
1. Sign in with `admin@emtelaak-test.com`
2. Access `/admin/dashboard`
3. Access `/admin/settings`

**Expected Result:**
- ✅ Full access granted
- ✅ Admin features visible
- ✅ Can modify settings

---

### 7. Production Environment Testing

#### Test 7.1: All Tests on Production
**Steps:**
Repeat ALL above tests on production URL: https://emtelaak.co

**Expected Result:**
- ✅ All tests pass on production
- ✅ Same behavior as development
- ✅ No errors in production environment

#### Test 7.2: Database Persistence Check
**Steps:**
1. Sign in on production
2. Check database for session record
3. Sign out
4. Verify session marked as inactive

**Expected Result:**
- ✅ Sessions recorded in production database
- ✅ Session data accurate
- ✅ Proper cleanup on sign-out

---

## Test Checklist

Use this checklist to track your testing progress:

### Development Environment
- [ ] Test 1.1: Admin sign-in
- [ ] Test 1.2: Investor sign-in
- [ ] Test 1.3: Wrong password
- [ ] Test 1.4: Non-existent email
- [ ] Test 2.1: Sign-out from dashboard
- [ ] Test 2.2: Sign-out from any page
- [ ] Test 3.1: 5x sign-in/sign-out cycles
- [ ] Test 3.2: Switch between accounts
- [ ] Test 4.1: View active sessions
- [ ] Test 4.2: Multiple concurrent sessions
- [ ] Test 4.3: Revoke single session
- [ ] Test 4.4: Revoke all other sessions
- [ ] Test 5.1: Session persists across refreshes
- [ ] Test 5.2: Session persists across browser restart
- [ ] Test 6.1: Protected routes without login
- [ ] Test 6.2: Admin routes as investor
- [ ] Test 6.3: Admin routes as admin

### Production Environment
- [ ] Test 7.1: All tests on production
- [ ] Test 7.2: Database persistence check

---

## Reporting Issues

If you encounter any issues during testing, please document:

1. **Test number and name**
2. **Environment** (Dev or Production)
3. **Steps to reproduce**
4. **Expected result**
5. **Actual result**
6. **Screenshots** (if applicable)
7. **Browser and version**
8. **Error messages** (from console or UI)

---

## Test Results Template

```
## Test Results - [Date]

### Environment: [Development/Production]
### Tester: [Name]

#### Passed Tests: X/18
#### Failed Tests: X/18
#### Success Rate: XX%

### Failed Tests:
1. Test X.X: [Name]
   - Issue: [Description]
   - Screenshot: [Link]

### Notes:
[Any additional observations]
```

---

## Quick Test Script

For rapid testing, use this sequence:

1. **Quick Sign-In Test** (2 minutes)
   - Sign in with admin account
   - Check dashboard loads
   - Sign out

2. **Quick Session Test** (3 minutes)
   - Sign in
   - Open `/sessions`
   - Verify current session shown
   - Sign out

3. **Quick Multi-Cycle Test** (5 minutes)
   - Sign in/out 5 times
   - Verify no errors

**Total Time: ~10 minutes for quick validation**

---

## Automated Test Results

The automated test script has already verified:
- ✅ Sign-in/Sign-out cycles (5/5 passed)
- ✅ Session creation
- ✅ Session revocation

Manual testing focuses on:
- UI/UX validation
- Cross-browser compatibility
- Production environment verification
- Edge cases and error handling

