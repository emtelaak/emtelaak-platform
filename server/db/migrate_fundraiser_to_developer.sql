-- Migration Script: Rename 'fundraiser' role to 'developer'
-- Date: December 22, 2025
-- Description: Updates the user role enum and migrates existing fundraiser users to developer role

-- Step 1: Alter the enum to add 'developer' as a new value
-- Note: MySQL doesn't support direct enum value rename, so we need to modify the column
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'investor', 'fundraiser', 'developer', 'admin', 'super_admin') DEFAULT 'user' NOT NULL;

-- Step 2: Update all existing users with 'fundraiser' role to 'developer'
UPDATE users SET role = 'developer' WHERE role = 'fundraiser';

-- Step 3: Remove 'fundraiser' from the enum (keep only the new values)
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'investor', 'developer', 'admin', 'super_admin') DEFAULT 'user' NOT NULL;

-- Step 4: Update audit logs if they contain role references (optional - for data consistency)
-- UPDATE audit_logs SET details = REPLACE(details, '"fundraiser"', '"developer"') WHERE details LIKE '%fundraiser%';

-- Verification query
SELECT role, COUNT(*) as count FROM users GROUP BY role;
