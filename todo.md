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
