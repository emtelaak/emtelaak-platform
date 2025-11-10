# Phase 1 Fundraiser Workflow Testing Guide

## Overview

This guide will walk you through testing the complete Phase 1 Offering Management system, from creating an offering as a fundraiser to approving it as an admin.

**Estimated Testing Time:** 30-45 minutes  
**Test Account:** fundraiser@emtelaak.com  
**Dev Server URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer

---

## Prerequisites

Before starting, ensure you have:
- ✅ Access to the dev server URL
- ✅ Test account credentials (fundraiser@emtelaak.com)
- ✅ Admin account access (for approval testing)
- ✅ Sample documents ready for upload (optional)

---

## Part 1: Fundraiser Workflow Testing

### Step 1: Login as Fundraiser

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer

**Actions:**
1. Click "Login" or navigate to the login page
2. Use the Manus OAuth system to authenticate
3. Login with test account: fundraiser@emtelaak.com
4. Verify you're redirected to the dashboard

**Expected Results:**
- ✅ Successful login
- ✅ Dashboard displays with user profile
- ✅ Navigation sidebar shows "Fundraiser Dashboard" section
- ✅ "My Offerings" menu item is visible

---

### Step 2: View Offerings Dashboard

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings

**Actions:**
1. Click "My Offerings" in the sidebar, OR
2. Navigate directly to `/offerings`
3. Review the dashboard layout

**Expected Results:**
- ✅ Offerings dashboard loads successfully
- ✅ Summary statistics displayed (Total Offerings, Active, Under Review, etc.)
- ✅ List of existing offerings (should see 3 test offerings)
- ✅ "Create New Offering" button visible
- ✅ Filter and search functionality available
- ✅ Status badges showing different offering states (Draft, Under Review, Approved)

**Test Offerings You Should See:**
1. **Luxury Apartment Complex** - Status: Under Review
2. **Commercial Office Building** - Status: Approved
3. **Mixed-Use Development** - Status: Draft

---

### Step 3: View Offering Details

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/:id

**Actions:**
1. Click on any offering from the dashboard
2. Explore all 6 tabs in the detail view

**Expected Results:**

**Tab 1: Overview**
- ✅ Offering title and description
- ✅ Funding goal and current funding
- ✅ Funding progress bar
- ✅ Key offering details (type, shares, minimum investment)
- ✅ Ownership structure and holding period
- ✅ Exit strategy information

**Tab 2: Financials**
- ✅ Financial projections summary
- ✅ IRR, ROI, Cash-on-Cash Return, Equity Multiple
- ✅ Distribution schedule
- ✅ Sensitivity analysis (Best/Base/Worst case scenarios)
- ✅ Charts and visualizations (if implemented)

**Tab 3: Fees**
- ✅ Complete fee structure breakdown
- ✅ Platform fee, Management fee, Performance fee
- ✅ Other applicable fees
- ✅ Fee impact on returns
- ✅ Total fee percentage

**Tab 4: Documents**
- ✅ List of uploaded documents
- ✅ Document categories (Legal, Financial, Compliance)
- ✅ Upload date and file information
- ✅ Download functionality

**Tab 5: Timeline**
- ✅ Key dates and milestones
- ✅ Funding period dates
- ✅ Expected closing date
- ✅ Expected exit date

**Tab 6: History**
- ✅ Status change history
- ✅ Audit trail of all modifications
- ✅ Timestamps and user information

---

### Step 4: Create New Offering (5-Step Wizard)

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/create

**Actions:**
1. Click "Create New Offering" button from dashboard
2. Complete the 5-step wizard

#### **Step 1: Basic Information**

**Fields to Fill:**
- Offering Title: "Test Offering - Residential Complex"
- Description: "A modern residential complex with 50 units in prime location"
- Offering Type: Select "Regulation D 506(c)"
- Property Selection: Choose existing property or create new

**Validation:**
- ✅ Title is required
- ✅ Description is required
- ✅ Offering type must be selected
- ✅ "Next" button enabled when valid

#### **Step 2: Offering Structure**

**Fields to Fill:**
- Total Offering Amount: $3,000,000
- Minimum Investment: $15,000
- Maximum Investment: $250,000
- Share Price: $500
- Total Shares: 6,000 (auto-calculated)
- Ownership Structure: "LLC Membership"

**Validation:**
- ✅ All amounts must be positive numbers
- ✅ Minimum < Maximum investment
- ✅ Total shares calculated correctly
- ✅ Share price validation

#### **Step 3: Timeline & Exit Strategy**

**Fields to Fill:**
- Holding Period: 60 months (5 years)
- Exit Strategy: "Property Sale"
- Funding Start Date: Select future date
- Funding End Date: Select date after start
- Expected Closing Date: Select date after funding end
- Expected Exit Date: Select date based on holding period

**Validation:**
- ✅ Dates must be in logical order
- ✅ Holding period must be positive
- ✅ Exit strategy must be selected

#### **Step 4: Financial Projections (Preview)**

**Information Displayed:**
- Projected IRR: Enter 11.5%
- Projected ROI: Enter 75%
- Cash-on-Cash Return: Enter 7.0%
- Equity Multiple: Enter 1.75x
- Annual Distribution: $210,000

**Note:** Full financial projections can be edited after creation

#### **Step 5: Review & Submit**

**Actions:**
- Review all entered information
- Check for any errors or warnings
- Click "Create Offering" to save as draft

**Expected Results:**
- ✅ Offering created successfully
- ✅ Redirected to offering detail page
- ✅ Status shows "Draft"
- ✅ Success notification displayed
- ✅ All entered data is saved correctly

---

### Step 5: Add Financial Projections

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/:id/financial-projections

**Actions:**
1. From the offering detail page, click "Edit Financial Projections" or navigate to financial projections page
2. Complete the 4-tab financial projection form

#### **Tab 1: Return Metrics**

**Fields to Fill:**
- Projected IRR: 11.5%
- Projected ROI: 75%
- Cash-on-Cash Return: 7.0%
- Equity Multiple: 1.75x
- Investment Period: 60 months

**Expected Results:**
- ✅ All metrics accept decimal values
- ✅ Percentages formatted correctly
- ✅ Real-time validation

#### **Tab 2: Cash Flow Projections**

**Fields to Fill:**
- Year 1-5 Rental Income
- Year 1-5 Operating Expenses
- Year 1-5 Net Operating Income
- Year 1-5 Distributions

**Expected Results:**
- ✅ Multi-year input fields
- ✅ Auto-calculation of NOI
- ✅ Distribution calculation based on NOI

#### **Tab 3: Distribution Schedule**

**Configuration:**
- Distribution Frequency: Quarterly
- Distribution Start Date: Select date
- Distribution Method: Pro-rata based on ownership
- Annual Distribution Amount: $210,000

**Expected Results:**
- ✅ Frequency options available (Monthly, Quarterly, Annual)
- ✅ Distribution schedule generated
- ✅ Per-share distribution calculated

#### **Tab 4: Sensitivity Analysis**

**Scenarios to Configure:**
- **Best Case:** IRR 17%, ROI 95%
- **Base Case:** IRR 11.5%, ROI 75%
- **Worst Case:** IRR 6%, ROI 45%

**Expected Results:**
- ✅ Three scenario inputs
- ✅ Scenario comparison visualization
- ✅ Range analysis displayed

**Final Action:**
- Click "Save Financial Projections"
- Verify success message
- Return to offering detail page

---

### Step 6: Configure Fee Structure

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/:id/fee-structure

**Actions:**
1. Navigate to fee structure editor
2. Configure all applicable fees

#### **Fee Types to Configure:**

**1. Platform Fee**
- Type: Percentage
- Amount: 2.0%
- Applied To: Total Investment
- Description: "Platform usage and transaction processing"

**2. Management Fee**
- Type: Percentage
- Amount: 1.5%
- Applied To: Annual Revenue
- Frequency: Annual
- Description: "Property management and administration"

**3. Performance Fee**
- Type: Percentage
- Amount: 20%
- Applied To: Returns above hurdle
- Hurdle Rate: 8%
- Description: "Performance-based incentive fee"

**4. Maintenance Fee**
- Type: Percentage
- Amount: 0.5%
- Applied To: Property Value
- Frequency: Annual
- Description: "Property maintenance and repairs reserve"

**5. Acquisition Fee**
- Type: Percentage
- Amount: 1.0%
- Applied To: Purchase Price
- One-time: Yes
- Description: "Property acquisition and due diligence"

**6. Disposition Fee**
- Type: Percentage
- Amount: 1.0%
- Applied To: Sale Price
- One-time: Yes
- Description: "Property sale and closing costs"

**Expected Results:**
- ✅ All fee types can be added
- ✅ Fee calculations displayed
- ✅ Total fee impact shown
- ✅ Fee disclosure preview available
- ✅ Save functionality works
- ✅ Fee structure appears in offering detail

---

### Step 7: Upload Documents

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/:id/documents

**Actions:**
1. Navigate to documents page
2. Upload sample documents (or create dummy files)

#### **Document Categories:**

**Legal Documents:**
- Operating Agreement (PDF)
- Subscription Agreement (PDF)
- Risk Disclosure (PDF)

**Financial Documents:**
- Financial Model (Excel/PDF)
- Pro Forma Statements (PDF)

**Compliance Documents:**
- Regulatory Approvals (PDF)
- Certifications (PDF)

**Upload Process:**
1. Click "Upload Document" or use drag-and-drop
2. Select file from computer
3. Choose document category
4. Enter document title
5. Add description (optional)
6. Click "Upload"

**Expected Results:**
- ✅ Drag-and-drop functionality works
- ✅ File upload to S3 successful
- ✅ Document appears in list immediately
- ✅ Document metadata saved correctly
- ✅ Download functionality works
- ✅ Document categorization correct
- ✅ File size and type validation

**Note:** If you don't have actual documents, you can create dummy PDF files or skip this step.

---

### Step 8: Submit for Admin Approval

**URL:** Offering Detail Page

**Actions:**
1. Return to offering detail page
2. Review all sections (Overview, Financials, Fees, Documents)
3. Click "Submit for Review" button

**Pre-Submission Checklist:**
- ✅ All required fields completed
- ✅ Financial projections added
- ✅ Fee structure configured
- ✅ At least one document uploaded (recommended)
- ✅ Timeline dates set

**Submission Process:**
1. Click "Submit for Review"
2. Confirm submission in dialog
3. Add optional submission notes
4. Click "Confirm"

**Expected Results:**
- ✅ Status changes from "Draft" to "Under Review"
- ✅ Submission timestamp recorded
- ✅ Status history updated
- ✅ Success notification displayed
- ✅ Edit capabilities restricted (offering locked for review)
- ✅ Notification sent to admin reviewers

---

## Part 2: Admin Approval Workflow Testing

### Step 9: Login as Admin

**Actions:**
1. Logout from fundraiser account
2. Login with admin account (your main account or waleed@emtelaak.com)
3. Verify admin role and permissions

**Expected Results:**
- ✅ Admin dashboard accessible
- ✅ "Admin" menu items visible in sidebar
- ✅ "Offering Approvals" link available

---

### Step 10: View Pending Approvals

**URL:** https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/admin/offering-approvals

**Actions:**
1. Navigate to admin offering approvals page
2. Review pending offerings list

**Expected Results:**
- ✅ Approvals dashboard loads
- ✅ List of offerings awaiting review
- ✅ Your test offering appears with "Under Review" status
- ✅ Filter options available (by status, date, fundraiser)
- ✅ Search functionality works
- ✅ Summary statistics displayed

**Information Displayed:**
- Offering title
- Fundraiser name
- Submission date
- Status
- Review actions available

---

### Step 11: Review Offering

**Actions:**
1. Click on the test offering you submitted
2. Thoroughly review all tabs

#### **Review Checklist:**

**Overview Tab:**
- ✅ Offering structure is complete and logical
- ✅ Funding goal is reasonable
- ✅ Investment minimums/maximums appropriate
- ✅ Ownership structure clearly defined
- ✅ Exit strategy is viable

**Financials Tab:**
- ✅ IRR and ROI projections are realistic
- ✅ Cash flow projections are detailed
- ✅ Distribution schedule is clear
- ✅ Sensitivity analysis shows reasonable scenarios
- ✅ Financial assumptions are documented

**Fees Tab:**
- ✅ All fees are disclosed transparently
- ✅ Fee percentages are within acceptable ranges
- ✅ Fee structure is competitive
- ✅ Total fee impact is reasonable
- ✅ Fee descriptions are clear

**Documents Tab:**
- ✅ Required documents are uploaded
- ✅ Documents are properly categorized
- ✅ Documents are accessible and downloadable
- ✅ Document versions are tracked

**Timeline Tab:**
- ✅ Key dates are realistic
- ✅ Funding period is appropriate
- ✅ Milestones are achievable

**History Tab:**
- ✅ Audit trail is complete
- ✅ All changes are logged
- ✅ Submission recorded correctly

---

### Step 12: Add Review Comments

**Actions:**
1. In the admin approval interface, locate the comments section
2. Add review feedback

**Sample Comments:**
- "Financial projections reviewed - IRR assumptions appear conservative and well-supported."
- "Fee structure is transparent and competitive with market standards."
- "Recommend approval - all documentation complete and compliant."

**Expected Results:**
- ✅ Comment input field available
- ✅ Comments save successfully
- ✅ Comments appear in history
- ✅ Timestamp and reviewer name recorded

---

### Step 13: Approve or Reject Offering

#### **Option A: Approve Offering**

**Actions:**
1. Click "Approve" button
2. Confirm approval decision
3. Add approval notes (optional)
4. Submit approval

**Expected Results:**
- ✅ Status changes to "Approved"
- ✅ Approval timestamp recorded
- ✅ Approver name saved
- ✅ Offering becomes active
- ✅ Fundraiser receives notification
- ✅ Offering appears in approved offerings list
- ✅ Audit trail updated

#### **Option B: Reject Offering**

**Actions:**
1. Click "Reject" button
2. Enter rejection reason (required)
3. Provide detailed feedback for fundraiser
4. Submit rejection

**Sample Rejection Reasons:**
- "Financial projections require additional supporting documentation"
- "Fee structure needs clarification on performance fee calculation"
- "Missing required legal documents"

**Expected Results:**
- ✅ Status changes to "Rejected"
- ✅ Rejection timestamp recorded
- ✅ Rejection reason saved
- ✅ Offering returned to fundraiser for revision
- ✅ Fundraiser receives notification with feedback
- ✅ Offering can be edited and resubmitted
- ✅ Audit trail updated

---

### Step 14: Verify Status Changes

**Actions:**
1. Return to offering detail page
2. Check History tab
3. Verify status transition

**Expected Results:**
- ✅ Status history shows complete timeline
- ✅ Draft → Under Review → Approved/Rejected
- ✅ All timestamps accurate
- ✅ User information recorded
- ✅ Comments and feedback visible

---

## Part 3: Post-Approval Testing

### Step 15: View Approved Offering (Public View)

**Actions:**
1. Logout from admin account
2. View offering as public user or investor
3. Verify all information is accessible

**Expected Results:**
- ✅ Approved offering is publicly visible
- ✅ All tabs display correctly
- ✅ Financial projections visible
- ✅ Fee structure transparent
- ✅ Documents downloadable
- ✅ Investment action available (if implemented)

---

### Step 16: Fundraiser View After Approval

**Actions:**
1. Login as fundraiser again
2. Navigate to offerings dashboard
3. View the approved offering

**Expected Results:**
- ✅ Status badge shows "Approved"
- ✅ Offering is no longer editable (locked)
- ✅ Funding tracking begins
- ✅ Analytics available
- ✅ Investor activity visible (when investments occur)

---

## Testing Summary Checklist

### ✅ Fundraiser Workflow
- [ ] Login successful
- [ ] Dashboard displays correctly
- [ ] View existing offerings
- [ ] Create new offering (5-step wizard)
- [ ] Add financial projections
- [ ] Configure fee structure
- [ ] Upload documents
- [ ] Submit for approval
- [ ] Receive status notifications

### ✅ Admin Workflow
- [ ] Access admin approval interface
- [ ] View pending approvals
- [ ] Review offering details
- [ ] Add review comments
- [ ] Approve offering
- [ ] Reject offering (optional)
- [ ] Verify status changes

### ✅ System Functionality
- [ ] All routes accessible
- [ ] Navigation works correctly
- [ ] Forms validate properly
- [ ] Data saves successfully
- [ ] Status transitions work
- [ ] Audit trail complete
- [ ] Notifications sent
- [ ] Documents upload to S3
- [ ] Financial calculations accurate
- [ ] Fee calculations correct

---

## Known Issues / Notes

1. **Server Stability:** Server may occasionally restart due to memory constraints. If you encounter errors, wait 30 seconds and refresh.

2. **Authentication:** Uses Manus OAuth system. Ensure you have valid credentials.

3. **Test Data:** The 3 sample offerings are pre-populated for testing different statuses.

4. **Document Upload:** Requires actual files or you can create dummy PDFs for testing.

5. **Notifications:** Email notifications may go to owner notification system rather than actual email.

---

## Troubleshooting

**Issue:** Page not loading
- **Solution:** Check server status, wait for restart, refresh browser

**Issue:** Cannot submit offering
- **Solution:** Verify all required fields are completed, check validation errors

**Issue:** Documents not uploading
- **Solution:** Check file size (<10MB), verify file type (PDF recommended), check S3 connection

**Issue:** Status not changing
- **Solution:** Verify you have correct permissions, check audit trail for errors

**Issue:** Financial calculations incorrect
- **Solution:** Verify input values, check for decimal vs percentage formatting

---

## Next Steps After Testing

1. **Report Issues:** Document any bugs or unexpected behavior
2. **Provide Feedback:** Share UX improvements or feature requests
3. **Performance Notes:** Report any slow pages or operations
4. **Enhancement Ideas:** Suggest improvements for Phase 2

---

## Support

If you encounter any issues during testing, please note:
- Exact steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser console errors (if any)

I'll be here to assist with any questions or issues during your testing session!

---

**Happy Testing! 🚀**
