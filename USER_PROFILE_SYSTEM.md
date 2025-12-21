# User Profile System Documentation

## Overview

The Emtelaak platform includes a comprehensive user profile system that displays and manages user information after authentication. The profile page integrates seamlessly with the new JWT-based authentication system.

## Implementation Date

January 10, 2025

---

## Profile Page Features

### 1. User Information Display
The profile page (`/profile`) displays comprehensive user information including:

- **Personal Information**:
  - Full name (English and Arabic)
  - Email address
  - Phone number
  - Date of birth
  - Nationality

- **Address Information**:
  - Address line 1 and 2
  - City
  - Country
  - Postal code

- **Employment & Financial**:
  - Employment status
  - Employment information
  - Annual income range
  - Investor type (individual/institutional)

- **Preferences**:
  - Preferred language (English/Arabic)
  - Preferred currency (USD, EGP, EUR, GBP, SAR, AED)

### 2. Profile Picture Upload
- Upload and display profile picture
- Image preview before upload
- Automatic S3 storage integration
- Fallback to user initials if no picture

### 3. KYC Verification Status
- Verification level badges (Level 0, 1, 2)
- Email verification status
- Phone verification status
- Documents verification status
- Questionnaire completion status
- Investment access indicator
- KYC progress indicator
- Direct link to complete KYC

### 4. Recent Activity
- Display last 10 user activities
- Activity types: logins, investments, KYC updates
- Timestamps for each activity
- Activity descriptions

### 5. Two-Factor Authentication
- Enable/disable 2FA
- QR code for authenticator apps
- Backup codes generation
- Trusted devices management

### 6. Custom Fields
- Dynamic custom fields support
- Field templates
- Conditional field dependencies
- Validation rules

---

## Authentication Integration

### JWT Token Flow

1. **User Login**:
   - User enters credentials on `/login`
   - Backend validates and generates JWT token
   - Token stored in localStorage as "auth_token"
   - User redirected to home page

2. **Profile Access**:
   - User navigates to `/profile`
   - tRPC client reads token from localStorage
   - Token sent in Authorization header: `Bearer {token}`
   - Backend verifies token in context.ts
   - User data loaded from database
   - Profile page renders with user information

3. **API Requests**:
   - All tRPC requests include JWT token
   - Server validates token for protected procedures
   - User context available in all protected routes

### Backend Context (server/_core/context.ts)

The tRPC context now supports dual authentication:

```typescript
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. Try JWT authentication from Authorization header
  const authHeader = opts.req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, ENV.jwtSecret);
      const db = await getDb();
      const userResult = await db.select().from(users).where(eq(users.id, decoded.userId));
      if (userResult.length > 0) {
        user = userResult[0];
      }
    } catch (error) {
      // JWT verification failed
    }
  }

  // 2. Fallback to OAuth authentication if JWT didn't succeed
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}
```

### Frontend tRPC Client (client/src/main.tsx)

The tRPC client automatically includes JWT token in all requests:

```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Get JWT token from localStorage
        const token = localStorage.getItem("auth_token");
        
        // Add Authorization header if token exists
        const headers = { ...(init?.headers || {}) };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers,
        });
      },
    }),
  ],
});
```

### Auth Hook (client/src/_core/hooks/useAuth.ts)

The useAuth hook supports both JWT and OAuth:

```typescript
export function useAuth(options?: UseAuthOptions) {
  const token = localStorage.getItem("auth_token");

  // Verify JWT token if present
  const verifyQuery = trpc.standardAuth.verifyToken.useQuery(
    { token: token || "" },
    { enabled: Boolean(token) }
  );

  // Fallback to OAuth if no token
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !token
  });

  // Determine user from JWT or OAuth
  const user = token && verifyQuery.data?.valid 
    ? verifyQuery.data.user 
    : meQuery.data;

  return {
    user: user ?? null,
    loading: /* ... */,
    error: /* ... */,
    isAuthenticated: Boolean(user),
    refresh: /* ... */,
    logout: /* ... */,
  };
}
```

---

## Profile API Endpoints

All profile endpoints are protected procedures requiring authentication:

### profile.get
- **Type**: Query
- **Auth**: Required
- **Returns**: User profile data
- **Usage**: `trpc.profile.get.useQuery()`

### profile.update
- **Type**: Mutation
- **Auth**: Required
- **Input**: Profile fields (name, address, preferences, etc.)
- **Returns**: Success status
- **Usage**: `trpc.profile.update.useMutation()`

### profile.uploadProfilePicture
- **Type**: Mutation
- **Auth**: Required
- **Input**: base64 image data, mimeType
- **Process**: Converts to buffer, uploads to S3, updates profile
- **Returns**: Image URL
- **Usage**: `trpc.profile.uploadProfilePicture.useMutation()`

### profile.getVerificationStatus
- **Type**: Query
- **Auth**: Required
- **Returns**: KYC verification status
- **Usage**: `trpc.profile.getVerificationStatus.useQuery()`

### profile.getRecentActivity
- **Type**: Query
- **Auth**: Required
- **Input**: limit (1-50, default 10)
- **Returns**: Array of recent activities
- **Usage**: `trpc.profile.getRecentActivity.useQuery({ limit: 10 })`

---

## Profile Page Structure

### Tabs

1. **Overview Tab**:
   - Profile picture
   - User name and email
   - Verification status badges
   - KYC progress indicator
   - Quick actions (Complete KYC, Edit Profile)

2. **Personal Information Tab**:
   - Editable form with all personal fields
   - Name in English and Arabic
   - Contact information
   - Address details
   - Employment information
   - Save/Cancel buttons

3. **Verification Tab**:
   - Verification level display
   - Email verification status
   - Phone verification status
   - Documents verification status
   - Questionnaire completion status
   - Links to complete verification steps

4. **Activity Tab**:
   - Recent activity list
   - Activity timestamps
   - Activity descriptions
   - Pagination (if needed)

5. **Preferences Tab**:
   - Language selection (English/Arabic)
   - Currency selection (USD, EGP, EUR, GBP, SAR, AED)
   - Notification preferences
   - Save button

6. **Security Tab**:
   - Two-factor authentication settings
   - Trusted devices management
   - Change password option
   - Active sessions

---

## User Flow

### First-Time User (After Registration)

1. User registers at `/register`
2. JWT token generated and stored
3. Redirected to home page
4. User clicks profile icon/link
5. Navigates to `/profile`
6. Profile page loads with basic information from registration
7. User sees prompts to:
   - Upload profile picture
   - Complete personal information
   - Complete KYC verification
   - Set preferences

### Returning User (After Login)

1. User logs in at `/login`
2. JWT token generated and stored
3. Redirected to home page
4. User clicks profile icon/link
5. Navigates to `/profile`
6. Profile page loads with all saved information:
   - Profile picture
   - Personal details
   - Verification status
   - Recent activity
   - Preferences
7. User can edit any information

### Editing Profile

1. User clicks "Edit Profile" button
2. Form fields become editable
3. User modifies information
4. User clicks "Save Changes"
5. `profile.update` mutation called
6. Success toast notification
7. Profile data refreshed
8. Form returns to read-only mode

### Uploading Profile Picture

1. User clicks profile picture area
2. File picker opens
3. User selects image
4. Image preview shown
5. User confirms upload
6. Image converted to base64
7. `profile.uploadProfilePicture` mutation called
8. Image uploaded to S3
9. Profile updated with image URL
10. New profile picture displayed

---

## Security Considerations

### Authentication
- All profile endpoints require authentication
- JWT token verified on every request
- Expired tokens automatically rejected
- User redirected to login if unauthorized

### Authorization
- Users can only access their own profile
- User ID from JWT token used for all queries
- No ability to access other users' profiles
- Admin users have separate admin endpoints

### Data Validation
- All inputs validated with Zod schemas
- Email format validation
- Phone number validation
- Required fields enforced
- Data sanitization before storage

### File Upload Security
- Image files only (validated by mimeType)
- File size limits enforced
- Unique filenames generated
- S3 storage with proper permissions
- No executable files allowed

---

## Responsive Design

The profile page is fully responsive:

- **Desktop (≥1024px)**:
  - Two-column layout
  - Sidebar navigation
  - Full-width content area
  - Large profile picture

- **Tablet (768px-1023px)**:
  - Single column layout
  - Tabbed navigation
  - Medium profile picture
  - Optimized spacing

- **Mobile (<768px)**:
  - Single column layout
  - Bottom navigation bar
  - Compact profile picture
  - Touch-optimized buttons
  - Collapsible sections

---

## Multilingual Support

The profile page supports English and Arabic:

- **Language Switching**:
  - Language switcher component in header
  - Instant language change
  - RTL layout for Arabic
  - LTR layout for English

- **Translated Elements**:
  - All labels and headings
  - Button text
  - Placeholder text
  - Error messages
  - Success notifications
  - Help text

- **Database Storage**:
  - Name stored in both English and Arabic
  - Language preference saved
  - Automatic language detection

---

## Integration with Other Features

### KYC System
- Profile shows KYC verification status
- Direct link to KYC questionnaire
- KYC progress indicator
- Document upload status
- Verification level badges

### Investment System
- Recent investment activity shown
- Investment access based on KYC level
- Portfolio link in profile
- Investment preferences

### Notification System
- Notification preferences in profile
- Email notification settings
- Push notification settings
- Notification history

### Wallet System
- Wallet balance display (optional)
- Payment method preferences
- Transaction history link

---

## Testing Checklist

### Authentication Tests
- [ ] Login with valid credentials
- [ ] JWT token stored in localStorage
- [ ] Token sent in Authorization header
- [ ] Profile loads with user data
- [ ] Logout clears token
- [ ] Expired token redirects to login
- [ ] Invalid token redirects to login

### Profile Display Tests
- [ ] All user information displays correctly
- [ ] Profile picture shows or fallback to initials
- [ ] Verification badges show correct status
- [ ] Recent activity loads
- [ ] Tabs switch correctly
- [ ] Responsive layout works on all devices

### Profile Edit Tests
- [ ] Edit button enables form fields
- [ ] Form validation works
- [ ] Save updates profile successfully
- [ ] Cancel discards changes
- [ ] Success notification shows
- [ ] Profile data refreshes

### Profile Picture Tests
- [ ] Upload button opens file picker
- [ ] Image preview shows before upload
- [ ] Upload succeeds and updates profile
- [ ] New picture displays immediately
- [ ] Large images handled correctly
- [ ] Invalid file types rejected

### Language Tests
- [ ] Language switcher works
- [ ] All text translates correctly
- [ ] RTL layout for Arabic
- [ ] LTR layout for English
- [ ] Language preference saves

---

## Troubleshooting

### Profile Not Loading
**Symptoms**: Profile page shows loading spinner indefinitely
**Causes**:
- JWT token invalid or expired
- Database connection issue
- User record not found

**Solutions**:
1. Check browser console for errors
2. Verify token in localStorage
3. Clear localStorage and login again
4. Check database connection
5. Verify user exists in database

### Profile Update Fails
**Symptoms**: Save button doesn't work or shows error
**Causes**:
- Validation error
- Network error
- Database error
- Authentication expired

**Solutions**:
1. Check form validation messages
2. Verify all required fields filled
3. Check network tab for API errors
4. Re-login if session expired
5. Check server logs for errors

### Profile Picture Upload Fails
**Symptoms**: Upload button doesn't work or shows error
**Causes**:
- File too large
- Invalid file type
- S3 upload error
- Network error

**Solutions**:
1. Check file size (max 5MB)
2. Verify file is image type
3. Check S3 credentials
4. Try different image
5. Check network connection

---

## Future Enhancements

### Planned Features
1. **Social Profiles**:
   - Link social media accounts
   - Display social profiles
   - Share profile publicly

2. **Profile Completion Score**:
   - Calculate profile completeness
   - Show progress bar
   - Suggest missing fields
   - Rewards for complete profile

3. **Profile Privacy Settings**:
   - Control what information is visible
   - Public/private profile toggle
   - Field-level privacy controls

4. **Profile Export**:
   - Export profile data as PDF
   - Export investment history
   - Export KYC documents
   - GDPR compliance

5. **Profile Verification**:
   - Email verification
   - Phone verification
   - Identity verification
   - Address verification

6. **Activity Filters**:
   - Filter by activity type
   - Date range filters
   - Search activity
   - Export activity log

---

## Code References

### Frontend Files
- `client/src/pages/Profile.tsx` - Main profile page (500+ lines)
- `client/src/components/ProfilePictureUpload.tsx` - Picture upload component
- `client/src/components/KYCProgressIndicator.tsx` - KYC progress display
- `client/src/components/RecentActivity.tsx` - Activity list component
- `client/src/components/TwoFactorSettings.tsx` - 2FA settings
- `client/src/components/TrustedDevicesManager.tsx` - Device management
- `client/src/_core/hooks/useAuth.ts` - Authentication hook

### Backend Files
- `server/routers.ts` - Profile API endpoints (lines 232-303)
- `server/db.ts` - Profile database helpers
- `server/_core/context.ts` - JWT authentication context
- `drizzle/schema.ts` - User and profile tables

### Configuration Files
- `client/src/main.tsx` - tRPC client with JWT support
- `client/src/const.ts` - Constants and login URL

---

## Summary

The user profile system is a comprehensive, production-ready feature that:

✅ Integrates seamlessly with JWT authentication
✅ Displays all user information in organized tabs
✅ Supports profile editing with validation
✅ Includes profile picture upload with S3 storage
✅ Shows KYC verification status and progress
✅ Displays recent user activity
✅ Supports two-factor authentication
✅ Includes multilingual support (English/Arabic)
✅ Fully responsive for all devices
✅ Secure with proper authentication and authorization
✅ Well-documented with clear code structure

The profile page is ready for production use and provides users with a complete view and control of their account information.
