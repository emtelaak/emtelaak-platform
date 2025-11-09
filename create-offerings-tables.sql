-- Phase 1: Core Offering Management
-- Database Migration Script for Offerings System

-- ============================================
-- OFFERINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offerings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `propertyId` INT NOT NULL,
  `fundraiserId` INT NOT NULL,
  
  -- Offering Structure
  `offeringType` ENUM(
    'regulation_d_506b',
    'regulation_d_506c',
    'regulation_a_tier1',
    'regulation_a_tier2',
    'regulation_cf',
    'private_placement',
    'other'
  ) NOT NULL,
  
  -- Offering Amounts (in cents)
  `totalOfferingAmount` INT NOT NULL,
  `minimumOfferingAmount` INT,
  `maximumOfferingAmount` INT,
  `currentFundedAmount` INT DEFAULT 0 NOT NULL,
  
  -- Share/Token Structure
  `shareType` VARCHAR(100),
  `totalShares` INT NOT NULL,
  `pricePerShare` INT NOT NULL,
  `availableShares` INT NOT NULL,
  `minimumSharePurchase` INT DEFAULT 1 NOT NULL,
  `maximumSharePurchase` INT,
  
  -- Ownership Structure
  `ownershipStructure` ENUM(
    'llc_membership',
    'corporation_stock',
    'limited_partnership',
    'reit_shares',
    'tokenized_ownership',
    'other'
  ) NOT NULL,
  `ownershipStructureDetails` TEXT,
  
  -- Holding Period and Exit
  `holdingPeriodMonths` INT,
  `lockupPeriodMonths` INT,
  `exitStrategy` ENUM(
    'property_sale',
    'refinance',
    'buyback',
    'secondary_market',
    'ipo',
    'other'
  ),
  `exitStrategyDetails` TEXT,
  `expectedExitDate` TIMESTAMP NULL,
  
  -- Lifecycle Status
  `status` ENUM(
    'draft',
    'under_review',
    'approved',
    'active',
    'funding',
    'fully_funded',
    'closed',
    'cancelled'
  ) DEFAULT 'draft' NOT NULL,
  
  -- Timeline
  `fundingStartDate` TIMESTAMP NULL,
  `fundingEndDate` TIMESTAMP NULL,
  `expectedClosingDate` TIMESTAMP NULL,
  `actualClosingDate` TIMESTAMP NULL,
  
  -- Investor Count
  `currentInvestorCount` INT DEFAULT 0,
  `maximumInvestors` INT,
  
  -- Metadata
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `submittedForReviewAt` TIMESTAMP NULL,
  `approvedAt` TIMESTAMP NULL,
  `publishedAt` TIMESTAMP NULL,
  
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fundraiserId`) REFERENCES `users`(`id`),
  
  INDEX `offering_property_id_idx` (`propertyId`),
  INDEX `offering_fundraiser_id_idx` (`fundraiserId`),
  INDEX `offering_status_idx` (`status`),
  INDEX `offering_type_idx` (`offeringType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFERING FINANCIAL PROJECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offering_financial_projections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `offeringId` INT NOT NULL,
  
  -- Return Metrics (percentage * 10000)
  `projectedIRR` INT,
  `projectedROI` INT,
  `projectedCashOnCash` INT,
  `projectedEquityMultiple` INT,
  
  -- Rental Yield Projections
  `year1RentalYield` INT,
  `year2RentalYield` INT,
  `year3RentalYield` INT,
  `year4RentalYield` INT,
  `year5RentalYield` INT,
  `annualYieldGrowthRate` INT,
  
  -- Appreciation Projections
  `year1Appreciation` INT,
  `year2Appreciation` INT,
  `year3Appreciation` INT,
  `year4Appreciation` INT,
  `year5Appreciation` INT,
  `annualAppreciationRate` INT,
  
  -- Cash Flow Projections (in cents)
  `year1CashFlow` INT,
  `year2CashFlow` INT,
  `year3CashFlow` INT,
  `year4CashFlow` INT,
  `year5CashFlow` INT,
  
  -- Distribution Schedule
  `distributionFrequency` ENUM('monthly', 'quarterly', 'semi_annual', 'annual'),
  `firstDistributionDate` TIMESTAMP NULL,
  `estimatedAnnualDistribution` INT,
  
  -- Assumptions
  `assumptionsNotes` TEXT,
  
  -- Sensitivity Analysis
  `bestCaseIRR` INT,
  `baseCaseIRR` INT,
  `worstCaseIRR` INT,
  
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE CASCADE,
  INDEX `financial_projection_offering_id_idx` (`offeringId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFERING FEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offering_fees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `offeringId` INT NOT NULL,
  
  -- Platform Fees
  `platformFeePercentage` INT DEFAULT 0 NOT NULL,
  `platformFeeFixed` INT DEFAULT 0 NOT NULL,
  `platformFeeDescription` TEXT,
  
  -- Management Fees
  `managementFeePercentage` INT DEFAULT 0 NOT NULL,
  `managementFeeFixed` INT DEFAULT 0 NOT NULL,
  `managementFeeDescription` TEXT,
  
  -- Performance Fees
  `performanceFeePercentage` INT DEFAULT 0 NOT NULL,
  `performanceFeeHurdleRate` INT,
  `performanceFeeDescription` TEXT,
  
  -- Maintenance Fees
  `maintenanceFeePercentage` INT DEFAULT 0 NOT NULL,
  `maintenanceFeeFixed` INT DEFAULT 0 NOT NULL,
  `maintenanceFeeDescription` TEXT,
  
  -- Acquisition Fees
  `acquisitionFeePercentage` INT DEFAULT 0 NOT NULL,
  `acquisitionFeeFixed` INT DEFAULT 0 NOT NULL,
  `acquisitionFeeDescription` TEXT,
  
  -- Disposition Fees
  `dispositionFeePercentage` INT DEFAULT 0 NOT NULL,
  `dispositionFeeFixed` INT DEFAULT 0 NOT NULL,
  `dispositionFeeDescription` TEXT,
  
  -- Other Fees
  `otherFeesDescription` TEXT,
  `otherFeesAmount` INT DEFAULT 0 NOT NULL,
  
  -- Total Impact
  `totalEstimatedAnnualFees` INT,
  `feeImpactOnReturns` INT,
  
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE CASCADE,
  INDEX `offering_fees_offering_id_idx` (`offeringId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFERING DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offering_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `offeringId` INT NOT NULL,
  
  -- Document Classification
  `documentCategory` ENUM('legal', 'financial', 'compliance', 'marketing', 'other') NOT NULL,
  `documentType` ENUM(
    'offering_memorandum',
    'subscription_agreement',
    'operating_agreement',
    'ppm',
    'risk_disclosure',
    'terms_and_conditions',
    'financial_model',
    'historical_financials',
    'pro_forma_statements',
    'tax_documents',
    'audit_report',
    'regulatory_approval',
    'certification',
    'compliance_report',
    'kyc_aml_policy',
    'presentation_deck',
    'property_brochure',
    'executive_summary',
    'other'
  ) NOT NULL,
  
  -- Document Details
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  
  -- File Information
  `fileUrl` TEXT NOT NULL,
  `fileKey` TEXT NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `mimeType` VARCHAR(100),
  `fileSize` INT,
  
  -- Version Control
  `version` INT DEFAULT 1 NOT NULL,
  `isLatestVersion` BOOLEAN DEFAULT TRUE NOT NULL,
  `previousVersionId` INT,
  
  -- Access Control
  `isPublic` BOOLEAN DEFAULT FALSE NOT NULL,
  `requiresAccreditedInvestor` BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Metadata
  `uploadedBy` INT NOT NULL,
  `uploadedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`),
  FOREIGN KEY (`previousVersionId`) REFERENCES `offering_documents`(`id`),
  
  INDEX `offering_document_offering_id_idx` (`offeringId`),
  INDEX `offering_document_category_idx` (`documentCategory`),
  INDEX `offering_document_type_idx` (`documentType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFERING TIMELINE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offering_timeline` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `offeringId` INT NOT NULL,
  
  `milestoneType` ENUM(
    'offering_created',
    'submitted_for_review',
    'approved',
    'funding_started',
    '25_percent_funded',
    '50_percent_funded',
    '75_percent_funded',
    'fully_funded',
    'funding_closed',
    'property_acquired',
    'first_distribution',
    'property_sold',
    'offering_closed',
    'custom'
  ) NOT NULL,
  
  `milestoneName` VARCHAR(255) NOT NULL,
  `milestoneDescription` TEXT,
  
  `targetDate` TIMESTAMP NULL,
  `actualDate` TIMESTAMP NULL,
  
  `isCompleted` BOOLEAN DEFAULT FALSE NOT NULL,
  `completedBy` INT,
  
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`),
  
  INDEX `offering_timeline_offering_id_idx` (`offeringId`),
  INDEX `offering_timeline_milestone_type_idx` (`milestoneType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFERING STATUS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offering_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `offeringId` INT NOT NULL,
  
  `previousStatus` ENUM(
    'draft',
    'under_review',
    'approved',
    'active',
    'funding',
    'fully_funded',
    'closed',
    'cancelled'
  ),
  
  `newStatus` ENUM(
    'draft',
    'under_review',
    'approved',
    'active',
    'funding',
    'fully_funded',
    'closed',
    'cancelled'
  ) NOT NULL,
  
  `changedBy` INT NOT NULL,
  `changeReason` TEXT,
  `changeNotes` TEXT,
  
  `changedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`),
  
  INDEX `offering_status_history_offering_id_idx` (`offeringId`),
  INDEX `offering_status_history_changed_at_idx` (`changedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OFFERING APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `offering_approvals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `offeringId` INT NOT NULL,
  
  `reviewerId` INT NOT NULL,
  `reviewerRole` ENUM(
    'admin',
    'compliance_officer',
    'legal_reviewer',
    'financial_reviewer',
    'executive_approver'
  ) NOT NULL,
  
  `decision` ENUM(
    'pending',
    'approved',
    'rejected',
    'changes_requested'
  ) DEFAULT 'pending' NOT NULL,
  
  `comments` TEXT,
  `reviewedAt` TIMESTAMP NULL,
  
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`),
  
  INDEX `offering_approval_offering_id_idx` (`offeringId`),
  INDEX `offering_approval_reviewer_id_idx` (`reviewerId`),
  INDEX `offering_approval_decision_idx` (`decision`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
