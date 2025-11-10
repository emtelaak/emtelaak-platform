-- Add Missing Columns to Offerings Table
-- Generated based on schema comparison

-- Basic Information
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS description TEXT;

-- Regulation Type
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS regulationType VARCHAR(100);

-- Funding (backward compatibility)
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS fundingGoal INT NOT NULL DEFAULT 0;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS currentFunding INT DEFAULT 0;

-- Share Structure (renamed columns)
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS minimumShares INT;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS maximumShares INT;

-- Ownership Rights
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS votingRights TEXT;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS distributionRights TEXT;

-- Financial Projections Summary
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS projectedIRR INT COMMENT 'percentage * 100';
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS projectedROI INT COMMENT 'percentage * 100';
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS cashOnCashReturn INT COMMENT 'percentage * 100';
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS equityMultiple INT COMMENT 'multiplier * 100';
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS annualDistribution INT COMMENT 'in cents';
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS distributionFrequency ENUM('monthly', 'quarterly', 'semi_annually', 'annually');

-- Status & Workflow
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS rejectionReason TEXT;

-- Timestamps
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS submittedAt TIMESTAMP NULL;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS approvedBy INT NULL;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS closedAt TIMESTAMP NULL;

-- Add foreign key for approvedBy
ALTER TABLE offerings ADD CONSTRAINT IF NOT EXISTS fk_offerings_approved_by 
  FOREIGN KEY (approvedBy) REFERENCES users(id);
