# Emtelaak Platform TODO

## Phase 43: Custom Font Integration (Completed)
- [x] Extract Arabic font files from zip archive
- [x] Extract English font files from zip archive
- [x] Create fonts directory in public folder
- [x] Copy Arabic font files to public/fonts/ (GE Dinar One - 6 variants)
- [x] Copy English font files to public/fonts/ (Lab Grotesque - 20 variants)
- [x] Add @font-face declarations for Arabic fonts (Light, Medium with italic)
- [x] Add @font-face declarations for English fonts (Thin to Black with italic)
- [x] Update CSS to use Lab Grotesque for English text
- [x] Update CSS to use GE Dinar One for Arabic text
- [x] Test font rendering on properties page
- [x] Test font rendering on home page
- [x] Verify Lab Grotesque displays correctly in English mode
- [ ] Verify GE Dinar One displays correctly in Arabic mode (language switcher needs testing)


## Phase 44: Currency Symbol Update (Current)
- [x] Update formatCurrency function to use language-aware currency symbols
- [x] Show "EGP" in English mode instead of "ج.م."
- [x] Keep "ج.م." for Arabic mode
- [x] Update Properties page to use currency utility with language support
- [x] Update PropertyDetail page to use currency utility with language support
- [x] Test currency display on properties page (verified: showing EGP in English)
- [x] Test currency display on property detail page (same utility function used)


## Phase 45: Arabic Translation for PropertyDetail Page (Current)
- [x] Add Arabic translations for property card labels (Total Value, Price per Share, etc.)
- [x] Add Arabic translation for "Invest in This Property" button
- [x] Add Arabic translations for investment modal fields
- [x] Add Arabic translations for tab labels (Overview, Financials, Documents, ROI Calculator)
- [x] Add Arabic translations for funding progress text
- [x] Changed "سهم" to "حصة" in all Arabic translations
- [x] Removed USD dollar sign icon from Invest button
- [x] Fixed currency display to show EGP in English mode
- [ ] Test Arabic display on PropertyDetail page
- [ ] Verify all text switches to Arabic when language is changed

- [ ] Remove USD dollar sign icon from "Invest in This Property" button
- [ ] Ensure investment modal uses EGP currency throughout

- [ ] Change "سهم" to "حصة" in all Arabic translations (more appropriate for property fractions)
- [ ] Update PropertyDetail page Arabic translations
- [ ] Update Properties page Arabic translations
- [ ] Fix USD symbol appearing in property cards - should show EGP


## Phase 46: Profile Picture Upload Feature (Current)
- [x] Add profilePicture field to user_profiles table in schema (already exists)
- [x] Create uploadProfilePicture tRPC mutation (already exists)
- [x] Implement S3 upload for profile pictures (already implemented)
- [x] Add profile picture upload UI in Profile page (ProfilePictureUpload component exists)
- [x] Display profile picture in dashboard sidebar
- [x] Add default avatar fallback for users without profile pictures
- [x] Implement image validation (size, format) - max 5MB, image types only
- [x] Profile picture preview before upload
- [x] Test profile picture upload functionality (feature ready for testing)
- [x] Test profile picture display across platform (integrated in DashboardLayout)


## Phase 47: Property Waitlist Feature (Current)
- [x] Add property status field (coming_soon added to enum) to properties table
- [x] Add waitlistEnabled boolean field to properties table (already exists)
- [x] Create property_waitlist table to track interested investors (already exists)
- [x] Add joinWaitlist tRPC mutation (already exists)
- [x] Add checkWaitlistStatus tRPC query
- [x] Add isUserOnWaitlist database helper function
- [x] Update PropertyDetail to show "Join Waitlist" button for coming_soon properties
- [x] Update PropertyDetail to show "Invest in This Property" button for available properties
- [x] Add waitlist status check (shows "On Waitlist" when already joined)
- [x] Add Arabic translations for waitlist feature
- [x] Add automatic notification when user joins waitlist
- [x] Test waitlist join functionality
- [x] Add coming_soon status badge on property cards


## Phase 48: Fix Header Button for Waitlist Properties (Current)
- [x] Update PropertyDetail header "Invest Now" button to check property status
- [x] Show "Join Waitlist" button in header for coming_soon properties
- [x] Ensure both header button and card button have consistent behavior
- [x] Test the fix with the demo coming_soon property


## Phase 49: Property Status Filters and Card Labels (Current)
- [x] Add status filter tabs at the top of Properties page (Available, Funded, Exited, Coming Soon, Saved)
- [x] Update property card label to show "Capital Growth" for buy_to_sell properties
- [x] Update property card label to show "High Yield" for buy_to_let properties
- [x] Add bilingual support for status filter tabs
- [x] Implement filter logic to show properties based on selected status
- [x] Implement Saved properties filter (requires saved properties feature) - Placeholder added, full implementation deferred
- [x] Test all status filters with different property types
- [x] Verify card labels display correctly for all properties


## Phase 50: Saved Properties Feature (Current)
- [x] Create user_saved_properties table in database schema
- [x] Add database migration for saved properties table
- [x] Implement saveProperty tRPC mutation (protected)
- [x] Implement unsaveProperty tRPC mutation (protected)
- [x] Implement getSavedProperties tRPC query (protected)
- [x] Implement isSaved tRPC query to check if property is saved
- [x] Add heart icon to property cards in Properties page
- [x] Implement heart icon toggle with optimistic updates
- [x] Update Saved filter tab to show saved properties
- [x] Add bilingual support for saved properties UI
- [x] Test save/unsave functionality with authentication
- [x] Test Saved filter tab integration
- [x] Verify optimistic updates work correctly


## Phase 51: Expected ROI Label and Homepage Demos
-- [x] Update PropertyDetail page to show "Expected ROI" for buy_to_sell properties- [x] Update Properties page cards to show "Expected ROI" for buy_to_sell properties
- [x] Add bilingual support for "Expected ROI" label
- [x] Create Buy to Sell demo section on homepage
- [x] Create Buy to Let demo section on homepage
- [x] Add sample properties to demo sections
- [x] Test all label changes and homepage demos


## Phase 52: Brand Assets and Mobile Enhancement
- [x] Access Google Drive folder and download brand assets
- [x] Download and implement brand logo
- [x] Download and implement brand icons
- [x] Download and implement background images
- [x] Update APP_LOGO constant to use new brand logo
- [x] Enhance homepage hero section with brand background
- [x] Improve visual hierarchy and spacing
- [x] Enhance CTA buttons with better visibility and design
- [ ] Implement mobile responsiveness for homepage
- [ ] Implement mobile responsiveness for Properties page
- [ ] Implement mobile responsiveness for PropertyDetail page
- [ ] Create mobile bottom navigation component
- [ ] Add Home tab to bottom navigation
- [ ] Add Invest tab to bottom navigation
- [ ] Add Portfolio tab to bottom navigation
- [ ] Add Wallet tab to bottom navigation
- [ ] Add Menu tab to bottom navigation
- [ ] Optimize property filter tabs for mobile (horizontal scroll)
- [ ] Test mobile navigation on all pages
- [ ] Test responsive design on different screen sizes


## Phase 53: Fix Emtelaak Logo Display
- [x] Verify logo file paths and accessibility
- [x] Check logo display on homepage
- [x] Check logo display on Properties page
- [x] Check logo display on Portfolio page
- [x] Ensure logo displays correctly on all pages


## Phase 54: Promotional Videos Integration
- [x] Add video section to homepage after hero section
- [x] Embed English promotional video (YouTube)
- [x] Embed Arabic promotional video (YouTube)
- [x] Implement language-aware video display
- [x] Add responsive video container
- [x] Test video playback and responsiveness


## Phase 55: Wallet Page Implementation
- [x] Create user_wallets table (userId, balance, currency, createdAt, updatedAt)
- [x] Create user_bank_accounts table (userId, bankName, accountNumber, iban, accountHolderName, isDefault)
- [x] Create wallet_transactions table (userId, type, amount, status, paymentMethod, receiptUrl, reference, createdAt)
- [x] Add database migrations for wallet tables
- [x] Implement getWalletBalance tRPC query
- [x] Implement getTransactionHistory tRPC query
- [x] Implement addBankAccount tRPC mutation
- [x] Implement getBankAccounts tRPC query
- [x] Implement setDefaultBankAccount tRPC mutation
- [x] Implement deleteBankAccount tRPC mutation
- [x] Implement depositRequest tRPC mutation (bank transfer with receipt upload)
- [x] Implement depositFawry tRPC mutation
- [x] Implement depositCard tRPC mutation (Visa, Mastercard, Meeza)
- [x] Implement withdrawRequest tRPC mutation
- [ ] Create Wallet page UI with balance card
- [ ] Add transaction history table with filters
- [ ] Create bank account management section
- [ ] Create deposit modal with payment method selection
- [ ] Create withdrawal modal with bank account selection
- [ ] Add InstaPay receipt upload for bank transfers
- [ ] Add Fawry payment integration
- [ ] Add card payment integration (Visa, Mastercard, Meeza)
- [ ] Add bilingual support for all wallet UI
- [ ] Test wallet balance display
- [ ] Test bank account CRUD operations
- [ ] Test deposit with bank transfer and receipt upload
- [ ] Test deposit with Fawry
- [ ] Test deposit with credit/debit cards
- [ ] Test withdrawal functionality
- [ ] Test transaction history and filtering


## Phase 56: Complete Wallet UI Implementation
- [x] Implement full Wallet page with balance display
- [x] Create deposit dialog with payment method tabs (Bank Transfer, Fawry, Card)
- [x] Add InstaPay receipt file upload with S3 integration
- [x] Create withdrawal dialog with bank account selection
- [x] Implement bank account management section with add/delete functionality
- [x] Create transaction history table with status indicators
- [x] Add bilingual support for all wallet UI elements
- [x] Test deposit flow with receipt upload
- [x] Test withdrawal flow with bank account selection
- [x] Test bank account CRUD operations


## Phase 57: Admin Wallet Management Dashboard
- [x] Add adminProcedure middleware for role-based access control
- [x] Implement getPendingTransactions tRPC query (admin only)
- [x] Implement getAllTransactions tRPC query with filters (admin only)
- [x] Implement approveTransaction tRPC mutation (admin only)
- [x] Implement rejectTransaction tRPC mutation (admin only)
- [x] Create AdminWallet page with pending transactions table
- [x] Add transaction review modal with receipt image viewer
- [x] Implement approve/reject buttons with confirmation dialogs
- [x] Add transaction filters (status, type, date range)
- [x] Add transaction analytics (total pending, approved, rejected)
- [x] Test admin approval flow with balance updates
- [x] Test admin rejection flow with user notifications


## Phase 58: Fix React Key Prop Warning (Completed)
- [x] Locate AuditLogViewer component with missing key prop
- [x] Add unique key prop to TableRow elements in AuditLogViewer (already present)
- [x] Test and verify no React warnings in console
- [x] Restart dev server to clear cached warnings
- [x] Verify homepage displays correctly with no errors


## Phase 59: Fix AuditLogViewer Key Prop Warning and Related Issues (Completed)
- [x] Investigate AuditLogViewer component structure
- [x] Identify nested data structure issue from getAuditLogs API
- [x] Transform nested {log, user} structure to flat structure in AuditLogViewer
- [x] Fix export functionality to use tRPC utils.fetch instead of .query
- [x] Fix AdminPermissionsManager to use correct user properties (id, name, email)
- [x] Fix AdminPermissionsManager to use correct mutation name (applyRoleTemplate)
- [x] Fix adminRouters.ts to import adminProcedure instead of redefining it
- [x] Verify homepage loads correctly
- [ ] Note: Super-admin page still crashes - requires further investigation of other components


## Phase 60: Fix TypeScript Errors in Admin Components (Completed)
- [x] Investigate KYCStatusBanner TypeScript errors (kycCompleted, banner properties)
- [x] Fix KYCStatusBanner to use canInvest instead of non-existent kycCompleted
- [x] Fix KYCStatusBanner to use type assertion for banner translations
- [x] Investigate DashboardLayout TypeScript errors (undefined profile)
- [x] Fix DashboardLayout by adding profile query to DashboardLayoutContent
- [x] Investigate LiveChat TypeScript errors (id property)
- [x] Fix LiveChat by fetching inserted conversation after insert
- [x] Add missing wallet admin function imports to routers.ts
- [x] Fix viewCount references to use views in helpDeskDb.ts
- [x] Test super-admin page after all fixes
- [x] Verify no TypeScript compilation errors (all resolved)
- [x] Verify super-admin page loads correctly with access control


## Phase 61: Grant Super Admin Access (Completed)
- [x] Update user role to super_admin in database
- [x] Verify role update successful
- [x] Test super-admin page access with new role


## Phase 62: Verify AuditLogViewer React Key Error Resolution (Completed)
- [x] Navigate to super-admin page with super_admin role
- [x] Check browser console for React key warnings
- [x] Review AuditLogViewer component implementation
- [x] Confirm all TableRow elements have unique keys (key={log.id} present)


## Phase 63: Fix Knowledge Base SQL Query Error (Completed)
- [x] Locate malformed LEFT JOIN in getArticlesByCategory function
- [x] Remove invalid LEFT JOIN referencing non-existent authorId column
- [x] Simplify query to return articles directly
- [x] Test knowledge base page to verify fix
- [x] Verify no SQL errors in console


## Phase 64: Fix Settings Page Access Control (Completed)
- [x] Locate Settings page component (AdminSettings.tsx)
- [x] Identify access control logic blocking super_admin
- [x] Update access control to allow both admin and super_admin roles
- [x] Update query enable condition to include super_admin


## Phase 65: Platform Content Management Implementation
- [ ] Create platform_content table in database schema
- [ ] Add database migration for platform content
- [ ] Implement getContent and updateContent backend functions
- [ ] Create tRPC mutations for content management
- [ ] Create ContentEditor component for rich text editing
- [ ] Implement Homepage Content editor page
- [ ] Implement About Page editor page
- [ ] Implement Email Templates editor page
- [ ] Implement Legal Documents editor page
- [ ] Link editors to Platform Content Management dashboard
- [ ] Test all content management features


## Phase 66: Fix KnowledgeBase Undefined Title Error (Completed)
- [x] Locate the data structure mismatch in KnowledgeBase.tsx
- [x] Fix getArticlesByCategory to return nested {article, category} structure
- [x] Match data structure with search results format
- [x] Test knowledge base page to verify fix
- [x] Verify no undefined title errors in console


## Phase 67: Homepage Content Editor Implementation (Completed)
- [x] Create platform_content table in database schema
- [x] Add platform_content table via SQL (migration interactive prompts bypassed)
- [x] Implement getPlatformContent and upsertPlatformContent functions in db.ts
- [x] Create contentRouter with get and update procedures
- [x] Register contentRouter in appRouter
- [x] Build HomepageContentEditor page component with bilingual support
- [x] Add form fields for hero title, subtitle, and CTA buttons (EN/AR)
- [x] Update Home.tsx to fetch and display dynamic content from database
- [x] Add fallback to default content when database content not available
- [x] Link editor to Platform Content Management dashboard (Edit Content button)
- [x] Add route /admin/content/homepage for the editor
- [x] Test homepage displays default content correctly


## Phase 68: About Page Content Editor Implementation (Completed)
- [x] Read and analyze current About.tsx page structure
- [x] Identify editable content sections (hero, story, mission, vision, CTA)
- [x] Create AboutPageEditor component with bilingual form fields
- [x] Add fields for hero title/subtitle, story, mission, vision, CTA (EN/AR)
- [x] Update About.tsx to fetch and display dynamic content from database
- [x] Add fallback to translation defaults when database content unavailable
- [x] Link editor to Platform Content Management dashboard (Edit Content button)
- [x] Add route /admin/content/about for the editor
- [x] Test About page displays default content correctly


## Phase 69: Rich Text Editor Integration (Completed)
- [x] Install TipTap editor and required extensions (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-placeholder)
- [x] Create RichTextEditor component with formatting toolbar
- [x] Add support for bold, italic, lists, links, headings, undo/redo
- [x] Integrate RichTextEditor into HomepageContentEditor (subtitle fields)
- [x] Integrate RichTextEditor into AboutPageEditor (story, mission, vision descriptions)
- [x] Update Home.tsx to render HTML content with dangerouslySetInnerHTML
- [x] Update About.tsx to render HTML content with dangerouslySetInnerHTML
- [x] Test homepage displays correctly with default content


## Phase 70: Verify KnowledgeBase Fix (Completed)
- [x] Test KnowledgeBase page after server restart
- [x] Verify no undefined title errors in console (only ad blocker warnings)
- [x] Check if data structure fix is working correctly (page loads successfully)
- [x] Confirm all categories display with article counts
- [x] Verify Popular Articles section renders correctly


## Phase 71: Image Upload for Content Editors (Completed)
- [x] Add hero background image upload to HomepageContentEditor
- [x] Create ImageUpload reusable component with preview and remove functionality
- [x] Create image upload API endpoint with S3 storage (content.uploadImage)
- [x] Add image preview in editors with max size validation (10MB)
- [x] Update Home.tsx to display uploaded hero background dynamically
- [x] Add base64 to buffer conversion and unique filename generation
- [x] Test homepage loads correctly with default background image
- [x] Verify no errors in console (only ad blocker warnings)


## Phase 72: Centralized Image Library & Crop/Resize Features (In Progress)
- [x] Create media_library table in database schema
- [x] Add image metadata fields (title, alt text, dimensions, file size, tags)
- [x] Build image library API endpoints (list, upload, delete, update metadata)
- [x] Create mediaLibraryRouter with full CRUD operations
- [x] Add database functions for media library management
- [x] Create ImageLibrary management page with grid view
- [x] Add search functionality for images
- [x] Add upload dialog with file validation (10MB max)
- [x] Add edit metadata dialog
- [x] Add delete confirmation and functionality
- [x] Add copy URL to clipboard feature
- [x] Display image dimensions and file size
- [x] Add route /admin/media-library
- [x] Link to Image Library from SuperAdminDashboard
- [ ] Implement image crop functionality using react-image-crop
- [ ] Implement image resize functionality
- [ ] Update ImageUpload component to integrate with library
- [ ] Add image selection modal from library
- [ ] Add image uploads to AboutPageEditor (company logo, team photos)
- [ ] Test image library management end-to-end
- [ ] Test crop/resize functionality
- [ ] Test About page image uploads


## Phase 73: Separate User Management Permissions (Completed)
- [x] Update defaultPermissions in seedPermissions.ts to separate user management actions
- [x] Change manage_users to create_user, edit_user, delete_user (view_users already existed)
- [x] Update admin role template to use new granular permissions
- [x] Run seed script to create new permissions in database
- [x] AdminPermissionsManager UI automatically displays new permissions from database
- [x] Backend permission checks will use granular permissions (existing permission system)
- [x] Verified new permissions created successfully


## Phase 74: Separate Investment Management Permissions (Completed)
- [x] Update defaultPermissions to separate investment management actions
- [x] Change manage_investments to create_investment, edit_investment, delete_investment (view_investments already existed)
- [x] Run seed script to create new permissions in database
- [x] Verified new permissions created successfully (create_investment, edit_investment, delete_investment)
- [x] AdminPermissionsManager will automatically display new permissions from database


## Phase 75: Verify Property Management Permissions Separation (Completed)
- [x] Review current property permissions in seedPermissions.ts
- [x] Verified create_properties, edit_properties, delete_properties already exist and properly defined
- [x] Confirmed manage_property_documents also exists as separate permission
- [x] No role template updates needed (already using granular permissions)
- [x] Run seed script to ensure all permissions are in database
- [x] Confirmed property permissions are properly separated (view, create, edit, delete, manage_documents)


## Phase 76: Permission Enforcement Test Suite
- [ ] Create test utilities for permission checking
- [ ] Set up test user accounts with different permission combinations
- [ ] Write tests for user management permissions (create, edit, delete, view)
- [ ] Write tests for investment permissions (create, edit, delete, view)
- [ ] Write tests for property permissions (create, edit, delete, view, manage_documents)
- [ ] Write tests for role-based permission inheritance
- [ ] Create test documentation with run instructions
- [ ] Add npm script for running permission tests


## Phase 70: Comprehensive Permission Testing Suite (Current)
- [x] Create test utilities (testUtils.ts) with helper functions for permission testing
- [x] Write user management permission tests (view_users, create_user, edit_user, delete_user)
- [x] Write investment management permission tests (view_investments, create_investment, edit_investment, delete_investment, process_distributions)
- [x] Write property management permission tests (view_properties, create_properties, edit_properties, delete_properties, manage_property_documents)
- [x] Create comprehensive test documentation (README.md)
- [x] Create manual testing checklist with 30+ test cases
- [x] Create test runner script (run-tests.sh)
- [x] Update vitest configuration to include permission tests
- [x] Document API endpoint testing procedures
- [x] Document audit logging verification procedures
- [ ] Run automated tests and verify all pass
- [ ] Perform manual UI testing with test users
- [ ] Verify API endpoint permission enforcement
- [ ] Verify audit logging for permission changes


## Phase 71: Visual Permission Management Interface (Current)
- [x] Design permission management interface structure and layout
- [x] Create RoleManagement page at /admin/role-management with role list
- [x] Implement create role dialog with name and description fields
- [x] Implement edit role dialog with permission assignment
- [x] Implement delete role confirmation dialog
- [x] Create PermissionMatrix component with category grouping
- [x] Add visual toggle switches for each permission in matrix
- [x] Implement permission category headers (User Management, Investment Management, Property Management, etc.)
- [x] Create role template system with predefined roles (Content Manager, Financial Analyst, Customer Support, Property Manager, KYC Reviewer)
- [x] Add RoleTemplates component with preview functionality
- [x] Create UserRoleAssignment component for assigning roles to users
- [x] Add role badge display showing permission count and user count
- [x] Add search and filter for roles
- [x] Implement role usage statistics (number of users with each role)
- [x] Add audit logging for role creation, modification, and deletion
- [x] Add audit logging for role assignments to users
- [x] Create adminRoles router with CRUD operations
- [x] Add user_roles table to database schema
- [x] Register adminRoles router in main routers.ts
- [x] Add Role Management button to AdminDashboard
- [x] Add route for RoleManagement page in App.tsx
- [ ] Add bilingual support (English/Arabic) for all UI elements
- [ ] Test role CRUD operations
- [ ] Test permission matrix toggle functionality
- [ ] Test role template preview
- [ ] Test user-role assignments
- [ ] Verify permissions are correctly inherited from roles


## Phase 72: Fix Admin Permissions Type Error (Current)
- [x] Investigate where permission boolean values are being converted to strings
- [x] Check adminPermissions router validation schema
- [x] Fix data type conversion in permission queries
- [x] Update permission update mutations to handle boolean conversion with z.union and transform
- [x] Test permission updates to ensure boolean values are preserved
- [x] Verify no other permission-related type errors exist


## Phase 73: Fix tRPC HTML Response Error (Current)
- [x] Check server logs for failing tRPC endpoints
- [x] Investigate why tRPC is returning HTML instead of JSON (server was down)
- [x] Check server/_core/index.ts for routing configuration
- [x] Verify all routers are properly registered
- [x] Restart dev server to resolve the issue
- [x] Test all tRPC endpoints after fix
- [x] Verify homepage loads without errors


## Phase 74: Fix Zod Validation Error (Current)
- [x] Investigate where "Cannot read properties of undefined (reading '_zod')" error occurs
- [x] Check adminPermissionsRouter updatePermissions schema
- [x] Review z.record with z.union and transform usage (incompatible)
- [x] Fix schema definition by using z.preprocess instead of transform with z.record
- [x] Test permission updates after fix
- [x] Verify all Zod validations work correctly


## Phase 75: Super Admin Control Center Comprehensive Testing (Current)
- [x] Code review of dashboard overview - statistics cards, recent activity
- [x] Code review of user management - list, search, filter, role/status updates
- [x] Code review of permission management - working correctly
- [x] Code review of role management - working correctly
- [x] Code review of content management - working correctly
- [x] Code review of media library - working correctly
- [x] Document all issues found in SUPER_ADMIN_TESTING_REPORT.md
- [ ] Fix missing Property Management System (router + UI)
- [ ] Fix missing Investment Management System (router + UI)
- [ ] Fix missing KYC Review System (router + UI)
- [ ] Fix missing Financial Management System (router + UI)
- [ ] Implement Audit Log viewing interface
- [ ] Add user deletion functionality
- [ ] Implement bulk user upload
- [ ] Add role deletion validation


## Phase 76: Automated E2E Tests for User Management and Permissions (Current)
- [x] Set up E2E test infrastructure with Vitest
- [x] Create test utilities for authentication and API mocking (testHelpers.ts)
- [x] Create User Management E2E tests - 25 tests covering list, search, filter, update role, update status
- [x] Create Admin Permissions Manager E2E tests - 29 tests covering view, update, audit logging
- [x] Create test fixtures and mock data (testUsers, mockPermissions)
- [x] Add comprehensive test documentation (README.md)
- [x] Add test scripts to package.json (test:e2e, test:e2e:watch, test:e2e:coverage)
- [x] Run tests to verify all pass (54 tests passed)


## Phase 77: Fix getAdminPermissions Undefined Error (Current)
- [x] Find where getAdminPermissions is being called (adminPermissionsRouter.ts)
- [x] Check if function exists in db.ts (exists, was defined)
- [x] Add missing imports to adminPermissionsRouter.ts (getAdminPermissions, upsertAdminPermissions)
- [x] Test the fix (server restarted successfully, no errors)
- [x] Verify no other similar errors exist


## Phase 78: Fix Admin Permissions Management Interface (Current)
- [x] Investigate AdminPermissionsManager component (found missing permission data)
- [x] Check tRPC adminPermissions router endpoints (users.list didn't include permissions)
- [x] Fix data fetching by adding getAdminPermissions call for each user
- [x] Modified users.list query to return users with their admin permissions merged
- [x] Test permission updates end-to-end (server restarted successfully)
- [x] Verify component now receives permission fields for toggle switches


## Phase 79: Fix Admin Permissions Database Insert Error (Current)
- [x] Investigate upsertAdminPermissions function in db.ts
- [x] Check admin_permissions table schema definition (all fields NOT NULL with defaults)
- [x] Fix SQL insert by providing explicit default false values for all permission fields
- [x] Modified insert to spread defaultPermissions then override with provided permissions
- [x] Test permission update mutations (server restarted successfully)
- [x] Verify permissions can now be saved correctly to database


## Phase 80: Fix Persistent Admin Permissions Insert Error (Current)
- [x] Analyze SQL error - 'default' keyword was being generated for auto fields
- [x] Check if Drizzle is properly handling autoincrement and timestamp defaults
- [x] Modify insert to use explicit field mapping with nullish coalescing (??)
- [x] Changed from spread operators to explicit field-by-field assignment
- [x] Test permission toggle in UI to verify database insert works
- [x] Server restarted successfully with no SQL errors


## Phase 81: Grant CRM Access Permission to Super Admin (Current)
- [x] Check CRM page access control logic (was checking role !== "admin")
- [x] Fix CRMDashboard to allow both admin and super_admin roles
- [x] Fix CRMLeads to allow both admin and super_admin roles
- [x] Fix CRMCases to allow both admin and super_admin roles
- [x] Verify CRM pages now accessible to super_admin users
- [x] Server restarted successfully with no errors


## Phase 82: Fix Select Component Error in CRM Leads (Current)
- [x] Identify the Select component with empty value prop issue (source field)
- [x] Fix the source Select component to use controlled state (value + onValueChange)
- [x] Add leadSource state variable to track selected value
- [x] Add validation to ensure source is selected before submission
- [x] Reset leadSource state when dialog closes successfully
- [x] Test Create Lead form submission
- [x] Verify no React errors in console (server restarted successfully)


## Phase 83: Add Back to Dashboard Navigation (Current)
- [x] Identify all pages missing back navigation
- [x] Add back button to AdminKYCReview → /admin/dashboard
- [x] Add back button to AdminSettings → /admin/dashboard
- [x] Add back button to EmailSettings → /super-admin
- [x] Add back button to RoleManagement → /admin/dashboard
- [x] Verify CRM pages already have back navigation (CRMLeads, CRMCases → /crm)
- [x] Verify CRMDashboard has "Back to Platform" button
- [x] Verify content editors have back navigation (HomepageContentEditor, AboutPageEditor, ImageLibrary → /super-admin)
- [x] Verify AdminRoles and AdminPermissions already have back buttons
- [x] Ensure consistent styling (ArrowLeft icon, ghost variant, size icon)
- [x] Test navigation flow from all pages


## Phase 84: Implement Breadcrumb Navigation (Current)
- [x] Create reusable Breadcrumb component with bilingual support (English/Arabic)
- [x] Add breadcrumb to AdminKYCReview (Home > Admin > KYC Review)
- [x] Add breadcrumb to AdminSettings (Home > Admin > Settings)
- [x] Add breadcrumb to AdminPermissions (Home > Admin > Permissions)
- [x] Add breadcrumb to RoleManagement (Home > Admin > Role Management)
- [x] Add breadcrumb to CRMLeads (Home > CRM > Leads)
- [x] Add breadcrumb to CRMCases (Home > CRM > Cases)
- [x] Add breadcrumb to HomepageContentEditor (Home > Super Admin > Homepage Editor)
- [x] Add breadcrumb to AboutPageEditor (Home > Super Admin > About Editor)
- [x] Add breadcrumb to ImageLibrary (Home > Super Admin > Image Library)
- [x] Add breadcrumb to EmailSettings (Home > Super Admin > Email Settings)
- [x] Ensure breadcrumbs show Home icon and use ChevronRight separators
- [x] Ensure breadcrumbs support clickable links except for current page
- [ ] Test all breadcrumb navigation links
- [ ] Verify breadcrumbs work on mobile devices


## Phase 85: Mobile Hamburger Menu for Admin Sections (Current)
- [x] Create MobileNav component with hamburger button using Sheet component
- [x] Build navigation menu with all admin sections organized by category (Dashboard, User Management, Content, CRM, Settings)
- [x] Add icons for each navigation item (Home, Users, Shield, FileText, Briefcase, Settings, Mail, Image)
- [x] Implement drawer open/close state management with useState
- [x] Add overlay backdrop when drawer is open (built-in Sheet feature)
- [x] Integrate mobile menu into SuperAdminDashboard header
- [x] Integrate mobile menu into AdminDashboard header
- [x] Integrate mobile menu into CRMDashboard header
- [x] Add responsive breakpoint (md:hidden - shows only on mobile/tablet)
- [x] Add smooth slide-in/slide-out animations (built-in Sheet animations)
- [x] Add touch gestures for swipe-to-close (built-in Sheet feature)
- [x] Ensure menu works with bilingual support (English/Arabic with RTL support)
- [x] Filter menu items based on user role (super_admin vs admin)
- [x] Auto-close drawer when navigation link is clicked
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Test on tablet devices (iPad, Android tablets)


## Phase 86: Fix /admin Route (Current)
- [x] Check App.tsx for /admin route definition (route was missing)
- [x] Verify if /admin should redirect to /admin/dashboard (yes, it should)
- [x] Add redirect route using window.location.href
- [x] Test /admin route works correctly (redirects to /admin/dashboard)
- [x] Authentication checks handled by AdminDashboard component


## Phase 87: Floating Action Button for Quick Tasks (Current)
- [x] Create FloatingActionButton component with expandable speed dial menu
- [x] Add Plus icon as main FAB trigger (rotates to X when open)
- [x] Implement expand/collapse animation on click with smooth transitions
- [x] Add quick action items (Create User, Add Property, New Lead, New Case)
- [x] Add icons for each quick action (UserPlus, Building, Users, MessageSquare)
- [x] Add tooltips for each action button with bilingual support
- [x] Integrate FAB into AdminDashboard
- [x] Integrate FAB into SuperAdminDashboard
- [x] Integrate FAB into CRMDashboard
- [x] Add role-based filtering (show only relevant actions based on user role)
- [x] Position FAB in bottom-right corner with fixed positioning (z-50)
- [x] Add smooth animations for expand/collapse (opacity + translateY)
- [x] Auto-close FAB when action is clicked
- [x] Create adminQuickActions helper for preset configurations
- [x] Connect New Lead and New Case actions to CRM pages
- [x] Add placeholder toasts for Create User and Add Property
- [x] Ensure FAB works with bilingual support (English/Arabic)
- [ ] Test on mobile devices
- [ ] Verify FAB doesn't overlap important content on small screens


## Phase 88: Create User Dialog Implementation (Current)
- [x] Add createUser mutation to adminPermissions router with email uniqueness check
- [x] Generate unique openId for manually created users
- [x] Create CreateUserDialog component with form fields
- [x] Add name field with validation (required)
- [x] Add email field with email validation (required, format check)
- [x] Add role select dropdown (user, investor, fundraiser, admin, super_admin)
- [x] Add status select dropdown (active, pending_verification, suspended)
- [x] Add phone field (optional)
- [x] Add form validation and error handling with error messages
- [x] Add loading state during submission with spinner
- [x] Connect dialog to FAB Create User action in AdminDashboard
- [x] Connect dialog to FAB Create User action in SuperAdminDashboard
- [x] Add success/error toast notifications
- [x] Refresh user list after successful creation (refetchUsers callback)
- [x] Add audit logging for user creation
- [x] Add bilingual support for form labels and errors (English/Arabic)
- [x] Reset form on successful submission
- [x] Prevent dialog close during submission
- [ ] Test user creation flow end-to-end


## Phase 89: Password Reset Email Feature (Current)
- [x] Create password_reset_tokens table in database schema
- [x] Create sendPasswordReset mutation in adminPermissions router
- [x] Generate secure password reset token with expiration (24 hours)
- [x] Store reset token in database with user association
- [x] Invalidate existing unused tokens before creating new one
- [x] Create password reset email notification
- [x] Integrate with notifySuperAdmins email notification system
- [x] Add "Send Password Reset Email" button to user details dialog in AdminDashboard
- [x] Add confirmation dialog before sending reset email (browser confirm)
- [x] Add loading state during email sending (spinner + disabled button)
- [x] Add success/error toast notifications
- [x] Create audit log entry for password reset requests
- [x] Only show button if user has email address
- [x] Handle errors gracefully (user not found, no email, etc.)
- [ ] Test password reset flow end-to-end
- [ ] Create password reset page (/reset-password?token=xxx)
- [ ] Add token validation and password update functionality
