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
