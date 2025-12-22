-- Migration Script: Rename 'fundraiser' role to 'fund_manager'
-- Date: December 22, 2025
-- Description: Updates the user role enum and migrates existing fundraiser users to fund_manager role

-- Step 1: Alter the enum to add 'fund_manager' as a new value
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'investor', 'fundraiser', 'fund_manager', 'admin', 'super_admin') DEFAULT 'user' NOT NULL;

-- Step 2: Update all existing users with 'fundraiser' role to 'fund_manager'
UPDATE users SET role = 'fund_manager' WHERE role = 'fundraiser';

-- Step 3: Remove 'fundraiser' from the enum (keep only the new values)
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'investor', 'fund_manager', 'admin', 'super_admin') DEFAULT 'user' NOT NULL;

-- Verification query
SELECT role, COUNT(*) as count FROM users GROUP BY role;
