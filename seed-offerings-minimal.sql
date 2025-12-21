-- Minimal seed data for 3 sample offerings
-- Matches actual database schema exactly

-- Offering 1: Luxury Apartment Complex - Under Review  
INSERT INTO offerings (
  propertyId, fundraiserId, offeringType,
  totalOfferingAmount, minimumOfferingAmount, maximumOfferingAmount,
  totalShares, pricePerShare, availableShares, minimumSharePurchase, maximumSharePurchase,
  ownershipStructure, holdingPeriodMonths, exitStrategy,
  fundingStartDate, fundingEndDate, expectedClosingDate, expectedExitDate,
  status, createdAt, updatedAt
) VALUES (
  1, 750038, 'regulation_d_506c',
  500000000, 2500000, 50000000,
  10000, 50000, 10000, 50, 1000,
  'llc_membership', 60, 'property_sale',
  '2024-12-01', '2025-03-31', '2025-04-15', '2030-04-15',
  'under_review', NOW(), NOW()
);

SET @offering1Id = LAST_INSERT_ID();

-- Financial projections for Offering 1
INSERT INTO offering_financial_projections (
  offeringId, projectedIRR, projectedROI, projectedCashOnCash, projectedEquityMultiple,
  year1RentalYield, year2RentalYield, year3RentalYield, year4RentalYield, year5RentalYield,
  year1Appreciation, year2Appreciation, year3Appreciation, year4Appreciation, year5Appreciation,
  year1CashFlow, year2CashFlow, year3CashFlow, year4CashFlow, year5CashFlow,
  distributionFrequency, estimatedAnnualDistribution,
  bestCaseIRR, baseCaseIRR, worstCaseIRR,
  createdAt, updatedAt
) VALUES (
  @offering1Id,
  1250, 8500, 750, 185,
  650, 680, 710, 745, 780,
  300, 350, 400, 450, 500,
  25000000, 28000000, 31000000, 34000000, 37000000,
  'quarterly', 30000000,
  1850, 1250, 650,
  NOW(), NOW()
);

-- Fee structure for Offering 1
INSERT INTO offering_fees (
  offeringId, platformFeePercentage, managementFeePercentage, performanceFeePercentage,
  maintenanceFeePercentage, acquisitionFeePercentage, dispositionFeePercentage,
  platformFeeDescription, managementFeeDescription, performanceFeeDescription, maintenanceFeeDescription,
  createdAt, updatedAt
) VALUES (
  @offering1Id,
  200, 150, 2000, 50, 100, 100,
  'One-time platform fee for listing and investor management',
  'Annual management fee for property oversight and operations',
  'Performance fee on profits above 8% hurdle rate',
  'Annual maintenance reserve for property upkeep',
  NOW(), NOW()
);

-- Offering 2: Commercial Office Building - Approved
INSERT INTO offerings (
  propertyId, fundraiserId, offeringType,
  totalOfferingAmount, minimumOfferingAmount, maximumOfferingAmount,
  totalShares, pricePerShare, availableShares, minimumSharePurchase, maximumSharePurchase,
  ownershipStructure, holdingPeriodMonths, exitStrategy,
  fundingStartDate, fundingEndDate, expectedClosingDate, expectedExitDate,
  status, createdAt, updatedAt
) VALUES (
  1, 750038, 'regulation_d_506b',
  1000000000, 5000000, 100000000,
  20000, 50000, 20000, 100, 2000,
  'reit_shares', 84, 'refinance',
  '2025-01-15', '2025-06-30', '2025-07-15', '2032-07-15',
  'approved', NOW(), NOW()
);

SET @offering2Id = LAST_INSERT_ID();

-- Financial projections for Offering 2
INSERT INTO offering_financial_projections (
  offeringId, projectedIRR, projectedROI, projectedCashOnCash, projectedEquityMultiple,
  year1RentalYield, year2RentalYield, year3RentalYield, year4RentalYield, year5RentalYield,
  year1Appreciation, year2Appreciation, year3Appreciation, year4Appreciation, year5Appreciation,
  year1CashFlow, year2CashFlow, year3CashFlow, year4CashFlow, year5CashFlow,
  distributionFrequency, estimatedAnnualDistribution,
  bestCaseIRR, baseCaseIRR, worstCaseIRR,
  createdAt, updatedAt
) VALUES (
  @offering2Id,
  1450, 9200, 850, 192,
  700, 735, 770, 810, 850,
  350, 400, 450, 500, 550,
  50000000, 55000000, 60000000, 65000000, 70000000,
  'quarterly', 60000000,
  2100, 1450, 800,
  NOW(), NOW()
);

-- Fee structure for Offering 2
INSERT INTO offering_fees (
  offeringId, platformFeePercentage, managementFeePercentage, performanceFeePercentage,
  maintenanceFeePercentage, acquisitionFeePercentage, dispositionFeePercentage,
  platformFeeDescription, managementFeeDescription, performanceFeeDescription, maintenanceFeeDescription,
  createdAt, updatedAt
) VALUES (
  @offering2Id,
  250, 175, 2500, 75, 125, 125,
  'Platform fee for premium listing and enhanced investor services',
  'Annual management fee including property management and reporting',
  'Performance fee on profits above 10% hurdle rate',
  'Annual maintenance and capital reserve fund',
  NOW(), NOW()
);

-- Offering 3: Mixed-Use Development - Draft
INSERT INTO offerings (
  propertyId, fundraiserId, offeringType,
  totalOfferingAmount, minimumOfferingAmount, maximumOfferingAmount,
  totalShares, pricePerShare, availableShares, minimumSharePurchase, maximumSharePurchase,
  ownershipStructure, holdingPeriodMonths, exitStrategy,
  fundingStartDate, fundingEndDate, expectedClosingDate, expectedExitDate,
  status, createdAt, updatedAt
) VALUES (
  1, 750038, 'regulation_cf',
  250000000, 1000000, 10000000,
  5000, 50000, 5000, 20, 500,
  'corporation_stock', 48, 'property_sale',
  '2025-02-01', '2025-05-31', '2025-06-15', '2029-06-15',
  'draft', NOW(), NOW()
);

SET @offering3Id = LAST_INSERT_ID();

-- Financial projections for Offering 3
INSERT INTO offering_financial_projections (
  offeringId, projectedIRR, projectedROI, projectedCashOnCash, projectedEquityMultiple,
  year1RentalYield, year2RentalYield, year3RentalYield, year4RentalYield, year5RentalYield,
  year1Appreciation, year2Appreciation, year3Appreciation, year4Appreciation, year5Appreciation,
  year1CashFlow, year2CashFlow, year3CashFlow, year4CashFlow, year5CashFlow,
  distributionFrequency, estimatedAnnualDistribution,
  bestCaseIRR, baseCaseIRR, worstCaseIRR,
  createdAt, updatedAt
) VALUES (
  @offering3Id,
  1100, 7200, 650, 172,
  600, 630, 660, 690, 720,
  280, 320, 360, 400, 440,
  15000000, 17000000, 19000000, 21000000, 23000000,
  'monthly', 18000000,
  1600, 1100, 550,
  NOW(), NOW()
);

-- Fee structure for Offering 3
INSERT INTO offering_fees (
  offeringId, platformFeePercentage, managementFeePercentage, performanceFeePercentage,
  maintenanceFeePercentage,
  platformFeeDescription, managementFeeDescription, performanceFeeDescription, maintenanceFeeDescription,
  createdAt, updatedAt
) VALUES (
  @offering3Id,
  150, 125, 1500, 50,
  'Platform fee for crowdfunding listing and investor relations',
  'Annual management fee for property operations',
  'Performance fee on profits above 6% hurdle rate',
  'Annual maintenance and repair reserve',
  NOW(), NOW()
);

SELECT 'Seed data created successfully!' AS Status;
SELECT COUNT(*) AS 'Total Offerings' FROM offerings;
SELECT COUNT(*) AS 'Total Projections' FROM offering_financial_projections;
SELECT COUNT(*) AS 'Total Fee Structures' FROM offering_fees;
