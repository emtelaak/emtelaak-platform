-- Migration: Add email verification columns to users table
-- Date: 2025-01-23
-- Description: Adds email verification functionality to support email verification feature

-- Add emailVerified column (default FALSE for existing users)
ALTER TABLE `users` 
ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE AFTER `password`;

-- Add emailVerificationToken column (nullable, used temporarily during verification)
ALTER TABLE `users` 
ADD COLUMN `emailVerificationToken` VARCHAR(255) NULL AFTER `emailVerified`;

-- Add emailVerificationExpiry column (nullable, token expiration timestamp)
ALTER TABLE `users` 
ADD COLUMN `emailVerificationExpiry` TIMESTAMP NULL AFTER `emailVerificationToken`;

-- Add index on emailVerificationToken for faster lookups during verification
CREATE INDEX `idx_email_verification_token` ON `users` (`emailVerificationToken`);

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerificationExpiry');
