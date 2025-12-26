-- Migration: Add updatedAt timestamp to kyc_questionnaires table
-- This allows tracking when users update their KYC submissions

ALTER TABLE `kyc_questionnaires` 
ADD COLUMN `updatedAt` TIMESTAMP NULL 
ON UPDATE CURRENT_TIMESTAMP;

-- Set initial updatedAt value to submittedAt for existing records
UPDATE `kyc_questionnaires` 
SET `updatedAt` = `submittedAt` 
WHERE `updatedAt` IS NULL;
