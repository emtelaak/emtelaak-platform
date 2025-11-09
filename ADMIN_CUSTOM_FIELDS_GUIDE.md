# Admin User Management: Custom Fields Guide

## How to Edit User Custom Fields from Admin Panel

This guide demonstrates how administrators can view and edit custom fields for any user directly from the Admin User Management page.

---

## Prerequisites

Before you can edit user custom fields, you need to:

1. **Create custom fields for the "users" module**
   - Navigate to `/admin/custom-fields`
   - Click "Create Custom Field"
   - Set **Module** to "users"
   - Configure field type, labels, and options
   - Set **Show in Context** to include "admin" or "both"
   - Save the field

2. **Have admin access**
   - Your account must have the "admin" role
   - Access the Admin User Management page at `/admin/users`

---

## Step-by-Step Guide

### Step 1: Navigate to Admin User Management

1. Log in as an administrator
2. Go to the Admin Dashboard
3. Click on **"User Management"** in the sidebar
4. Or navigate directly to: `/admin/users`

### Step 2: Find the User

On the Admin User Management page, you'll see a table with all users:

- **Search**: Use the search bar at the top to filter users by name or email
- **Table Columns**:
  - User (name)
  - Email
  - Role (admin/user badge)
  - 2FA Status (enabled/disabled)
  - 2FA Actions (toggle switch and reset button)
  - **Manage** (Details button)

### Step 3: Open User Details Dialog

1. Locate the user you want to edit
2. Click the **"Details"** button in the "Manage" column
3. A large dialog will open with the user's information

### Step 4: Navigate to Custom Fields Tab

The User Details dialog has two tabs:

1. **Basic Information** (default tab)
   - Shows: Name, Email, Role, 2FA Status, User ID, Open ID
   - This is read-only information

2. **Custom Fields** tab
   - Click this tab to access custom fields
   - Shows all custom fields configured for the "users" module
   - Only shows fields where "Show in Context" includes "admin"

### Step 5: Edit Custom Fields

In the Custom Fields tab:

1. **View existing values**
   - All custom fields are displayed based on their display order
   - Fields show their configured labels (English or Arabic based on language)
   - Current values are pre-filled if the user has previously entered them

2. **Edit field values**
   - **Text fields**: Type directly into the input
   - **Number fields**: Enter numeric values
   - **Date fields**: Use the date picker
   - **Dropdown fields**: Select from predefined options
   - **Multi-select**: Choose multiple options
   - **Country field**: Search and select from 180+ countries
   - **Boolean fields**: Toggle switch or checkbox
   - **File fields**: Upload files (if configured)
   - **Email/Phone/URL**: Enter with automatic format validation

3. **Field validation**
   - Required fields are marked with an asterisk (*)
   - Validation rules apply automatically:
     - Min/max length for text
     - Min/max value for numbers
     - Regex patterns for custom validation
     - Email, phone, URL format validation
   - Error messages appear below fields if validation fails

4. **Conditional fields**
   - Some fields may show/hide based on other field values
   - This is configured through field dependencies
   - Example: "Other Details" text field only appears when "User Type" dropdown is set to "Other"

### Step 6: Save Changes

1. After editing the custom fields, changes are **automatically saved**
2. The CustomFieldsForm component saves each field value as you edit
3. No explicit "Save" button is needed
4. A success toast notification appears when values are saved

### Step 7: Close the Dialog

1. Click the **"Close"** button at the bottom of the dialog
2. Or click outside the dialog
3. Or press the ESC key
4. The dialog closes and you return to the user list

---

## Tips and Best Practices

### For Administrators

1. **Create fields before editing**
   - Make sure custom fields exist for the "users" module before trying to edit them
   - Configure fields with clear labels and descriptions

2. **Set appropriate context**
   - Use "admin" context for fields that only admins should see/edit
   - Use "user" context for fields users can edit themselves
   - Use "both" for fields visible to both admins and users

3. **Use field templates**
   - Apply the "KYC Extended" template for user verification fields
   - Templates create multiple related fields at once

4. **Organize with display order**
   - Set display order numbers to control field sequence
   - Group related fields together

5. **Add validation rules**
   - Use min/max length to ensure data quality
   - Add regex patterns for specific formats
   - Set custom error messages for better user experience

### For Users

Users can edit their own custom fields from their profile page:

1. Navigate to `/profile`
2. Click the **"Additional"** tab
3. Fill in custom fields marked for "user" or "both" context
4. Changes save automatically

---

## Custom Fields Management

### Creating Custom Fields for Users

1. Go to `/admin/custom-fields`
2. Click **"Create Custom Field"**
3. Fill in the form:
   - **Module**: Select "users"
   - **Field Key**: Unique identifier (e.g., "phone_number")
   - **Field Type**: Choose from 13 types
   - **Label (English)**: Display name in English
   - **Label (Arabic)**: Display name in Arabic
   - **Show in Context**: Select "admin", "user", or "both"
   - **Required**: Toggle if field is mandatory
   - **Display Order**: Number for sorting (lower = first)
   - **Configuration**: JSON options for dropdown/multi-select
   - **Dependencies**: Conditional visibility rules
   - **Validation Rules**: Min/max, regex, custom error messages

4. Click **"Create Field"**

### Using Field Templates

1. Go to `/admin/custom-fields`
2. Click **"Templates"** button
3. Select a template:
   - **Real Estate Basics**: For properties module
   - **KYC Extended**: For users module (5 verification fields)
   - **Lead Qualification**: For leads module
4. Click **"Apply Template"**
5. Fields are created automatically

### Editing Custom Fields

1. Go to `/admin/custom-fields`
2. Find the field in the list
3. Click **"Edit"** button
4. Modify any settings
5. Click **"Update Field"**

### Deleting Custom Fields

1. Go to `/admin/custom-fields`
2. Find the field in the list
3. Click **"Delete"** button
4. Confirm deletion
5. **Note**: This deletes the field definition and all stored values

---

## Supported Field Types

| Field Type | Description | Use Case |
|------------|-------------|----------|
| **text** | Single-line text input | Name, title, short answers |
| **textarea** | Multi-line text input | Comments, descriptions, notes |
| **number** | Numeric input | Age, quantity, scores |
| **date** | Date picker | Birth date, registration date |
| **dropdown** | Single selection from list | Status, category, type |
| **multi-select** | Multiple selections from list | Skills, interests, tags |
| **country** | Country selector with search | Nationality, residence |
| **file** | File upload | Documents, images, PDFs |
| **boolean** | Yes/No toggle | Agreements, preferences |
| **email** | Email input with validation | Secondary email, work email |
| **phone** | Phone number input | Mobile, office phone |
| **url** | URL input with validation | Website, social media |
| **color** | Color picker | Theme preference, branding |

---

## Troubleshooting

### Custom Fields Not Showing

**Problem**: Custom Fields tab is empty

**Solutions**:
1. Check if custom fields exist for "users" module in `/admin/custom-fields`
2. Verify "Show in Context" includes "admin" or "both"
3. Ensure you're logged in as an admin
4. Refresh the page

### Cannot Save Custom Fields

**Problem**: Values don't save or show errors

**Solutions**:
1. Check validation rules - ensure values meet requirements
2. Fill in all required fields (marked with *)
3. Check browser console for errors
4. Verify field configuration in Custom Fields Management

### Fields Not Appearing for Users

**Problem**: Users can't see custom fields in their profile

**Solutions**:
1. Set "Show in Context" to "user" or "both"
2. Ensure fields are not admin-only
3. Tell users to check the "Additional" tab in their profile

---

## Advanced Features

### Conditional Field Visibility

Create fields that only appear based on other field values:

1. Edit a custom field
2. Scroll to **"Dependencies"** section
3. Use the visual dependency builder:
   - Select the **field** to depend on
   - Choose an **operator** (equals, notEquals, contains, etc.)
   - Enter the **value** to match
4. The field will only show when the condition is met

**Example**: Show "Company Name" field only when "User Type" equals "Business"

### Validation Rules

Add validation to ensure data quality:

1. Edit a custom field
2. Scroll to **"Validation Rules"** section
3. Use the visual validation builder:
   - **Min Length**: Minimum characters (for text)
   - **Max Length**: Maximum characters (for text)
   - **Min Value**: Minimum number (for numbers)
   - **Max Value**: Maximum number (for numbers)
   - **Regex Pattern**: Custom pattern matching
   - **Custom Error Message**: User-friendly error text

### Field Templates

Quickly create multiple related fields:

1. **KYC Extended** template creates:
   - Date of Birth (date field)
   - Nationality (country field)
   - ID Number (text field)
   - ID Type (dropdown: passport, national_id, driver_license)
   - Occupation (text field)

2. Apply template and customize individual fields as needed

---

## Security and Permissions

### Admin-Only Fields

Fields with "Show in Context" set to "admin" are:
- ✅ Visible to administrators in Admin User Management
- ✅ Editable by administrators
- ❌ Hidden from users in their profile
- ❌ Not editable by users

### User-Editable Fields

Fields with "Show in Context" set to "user" or "both" are:
- ✅ Visible to users in their profile
- ✅ Editable by users
- ✅ Visible to administrators (if "both")
- ✅ Editable by administrators (if "both")

### Data Privacy

- Custom field values are stored per user
- Only admins can view other users' custom fields
- Users can only view/edit their own custom fields
- Field values are not shared between users

---

## Summary

**To edit user custom fields as an admin:**

1. Go to `/admin/users`
2. Click **"Details"** on any user
3. Switch to **"Custom Fields"** tab
4. Edit field values
5. Changes save automatically
6. Click **"Close"**

**Key Points:**
- Custom fields must be created first at `/admin/custom-fields`
- Set "Show in Context" to "admin" or "both" for admin visibility
- Validation rules and dependencies apply automatically
- Changes save in real-time
- Users can edit their own fields from `/profile` → "Additional" tab
