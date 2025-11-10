import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * SEED SCRIPT FOR SAMPLE OFFERINGS
 * 
 * Creates 3 comprehensive sample offerings with:
 * - Complete offering details
 * - Financial projections
 * - Fee structures
 * - Timeline milestones
 * - Status history
 * - Different statuses for testing workflow
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function main() {
  console.log("🌱 Starting seed process for sample offerings...\n");

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // First, get the first property ID and user ID for testing
    const [properties] = await connection.execute("SELECT id FROM properties LIMIT 1");
    const [users] = await connection.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    if (!properties || properties.length === 0) {
      console.error("❌ No properties found. Please create at least one property first.");
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.error("❌ No admin users found. Please create an admin user first.");
      process.exit(1);
    }

    const propertyId = properties[0].id;
    const userId = users[0].id;

    console.log(`✅ Found property ID: ${propertyId}`);
    console.log(`✅ Found user ID: ${userId}\n`);

    // Offering 1: Luxury Apartment Complex - Under Review
    console.log("📝 Creating Offering 1: Luxury Apartment Complex (Under Review)...");
    
    const [offering1Result] = await connection.execute(
      `INSERT INTO offerings (
        propertyId, fundraiserId, offeringType,
        totalOfferingAmount, minimumOfferingAmount, maximumOfferingAmount,
        totalShares, pricePerShare, availableShares, minimumSharePurchase, maximumSharePurchase,
        ownershipStructure, holdingPeriodMonths, exitStrategy,
        fundingStartDate, fundingEndDate, expectedClosingDate, expectedExitDate,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        propertyId, userId, 'regulation_d_506c',
        500000000, 2500000, 50000000, // $5M total, $25K min, $500K max
        10000, 50000, 50, 1000, // 10K shares @ $500/share
        'llc', 60, 'sale_of_property',
        new Date('2024-12-01'), new Date('2025-03-31'), new Date('2025-04-15'), new Date('2030-04-15'),
        'under_review'
      ]
    );

    const offering1Id = offering1Result.insertId;

    // Add financial projections for Offering 1
    await connection.execute(
      `INSERT INTO offering_financial_projections (
        offeringId, projectedIRR, projectedROI, projectedCashOnCash, projectedEquityMultiple,
        year1RentalYield, year2RentalYield, year3RentalYield, year4RentalYield, year5RentalYield,
        year1Appreciation, year2Appreciation, year3Appreciation, year4Appreciation, year5Appreciation,
        year1CashFlow, year2CashFlow, year3CashFlow, year4CashFlow, year5CashFlow,
        distributionFrequency, estimatedAnnualDistribution,
        bestCaseIRR, baseCaseIRR, worstCaseIRR,
        assumptions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        offering1Id,
        1250, 8500, 750, 185, // 12.5% IRR, 85% ROI, 7.5% CoC, 1.85x EM
        650, 680, 710, 745, 780, // Rental yields
        300, 350, 400, 450, 500, // Appreciation
        25000000, 28000000, 31000000, 34000000, 37000000, // Cash flows ($250K-$370K)
        'quarterly', 30000000,
        1850, 1250, 650, // Best/Base/Worst IRR
        JSON.stringify({
          occupancyRate: 95,
          annualRentGrowth: 3,
          propertyAppreciation: 4,
          maintenanceReserve: 5,
          vacancyRate: 5
        })
      ]
    );

    // Add fee structure for Offering 1
    await connection.execute(
      `INSERT INTO offering_fees (
        offeringId, platformFeePercentage, platformFeeFixed,
        managementFeePercentage, managementFeeFixed,
        performanceFeePercentage,
        maintenanceFeePercentage, maintenanceFeeFixed,
        acquisitionFeePercentage, acquisitionFeeFixed,
        dispositionFeePercentage, dispositionFeeFixed,
        platformFeeDescription, managementFeeDescription,
        performanceFeeDescription, maintenanceFeeDescription,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        offering1Id,
        200, 0, // 2% platform fee
        150, 0, // 1.5% management fee
        2000, // 20% performance fee
        50, 0, // 0.5% maintenance fee
        100, 0, // 1% acquisition fee
        100, 0, // 1% disposition fee
        'One-time platform fee for listing and investor management',
        'Annual management fee for property oversight and operations',
        'Performance fee on profits above 8% hurdle rate',
        'Annual maintenance reserve for property upkeep'
      ]
    );

    // Add timeline for Offering 1
    await connection.execute(
      `INSERT INTO offering_timeline (
        offeringId, milestoneType, milestoneDate, description, isCompleted, createdAt, updatedAt
      ) VALUES 
        (?, 'funding_start', ?, 'Offering opens for investment', 0, NOW(), NOW()),
        (?, 'funding_milestone_25', ?, '25% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_milestone_50', ?, '50% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_milestone_75', ?, '75% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_end', ?, 'Offering closes', 0, NOW(), NOW()),
        (?, 'closing', ?, 'Property acquisition closes', 0, NOW(), NOW())`,
      [
        offering1Id, new Date('2024-12-01'), offering1Id, new Date('2025-01-15'),
        offering1Id, new Date('2025-02-15'), offering1Id, new Date('2025-03-15'),
        offering1Id, new Date('2025-03-31'), offering1Id, new Date('2025-04-15')
      ]
    );

    // Add status history for Offering 1
    await connection.execute(
      `INSERT INTO offering_status_history (
        offeringId, oldStatus, newStatus, changedBy, notes, changedAt
      ) VALUES 
        (?, 'draft', 'under_review', ?, 'Offering submitted for admin review', NOW())`,
      [offering1Id, userId]
    );

    console.log(`✅ Created Offering 1 (ID: ${offering1Id})\n`);

    // Offering 2: Commercial Office Building - Approved
    console.log("📝 Creating Offering 2: Commercial Office Building (Approved)...");
    
    const [offering2Result] = await connection.execute(
      `INSERT INTO offerings (
        propertyId, fundraiserId, offeringType,
        totalOfferingAmount, minimumOfferingAmount, maximumOfferingAmount,
        totalShares, pricePerShare, availableShares, minimumSharePurchase, maximumSharePurchase,
        ownershipStructure, holdingPeriodMonths, exitStrategy,
        fundingStartDate, fundingEndDate, expectedClosingDate, expectedExitDate,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        propertyId, userId, 'regulation_d_506b',
        1000000000, 5000000, 100000000, // $10M total, $50K min, $1M max
        20000, 50000, 100, 2000, // 20K shares @ $500/share
        'reit', 84, 'refinance',
        new Date('2025-01-15'), new Date('2025-06-30'), new Date('2025-07-15'), new Date('2032-07-15'),
        'approved'
      ]
    );

    const offering2Id = offering2Result.insertId;

    // Add financial projections for Offering 2
    await connection.execute(
      `INSERT INTO offering_financial_projections (
        offeringId, projectedIRR, projectedROI, projectedCashOnCash, projectedEquityMultiple,
        year1RentalYield, year2RentalYield, year3RentalYield, year4RentalYield, year5RentalYield,
        year1Appreciation, year2Appreciation, year3Appreciation, year4Appreciation, year5Appreciation,
        year1CashFlow, year2CashFlow, year3CashFlow, year4CashFlow, year5CashFlow,
        distributionFrequency, estimatedAnnualDistribution,
        bestCaseIRR, baseCaseIRR, worstCaseIRR,
        assumptions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        offering2Id,
        1450, 9200, 850, 192, // 14.5% IRR, 92% ROI, 8.5% CoC, 1.92x EM
        700, 735, 770, 810, 850, // Rental yields
        350, 400, 450, 500, 550, // Appreciation
        50000000, 55000000, 60000000, 65000000, 70000000, // Cash flows ($500K-$700K)
        'quarterly', 60000000,
        2100, 1450, 800, // Best/Base/Worst IRR
        JSON.stringify({
          occupancyRate: 92,
          annualRentGrowth: 3.5,
          propertyAppreciation: 4.5,
          maintenanceReserve: 6,
          vacancyRate: 8
        })
      ]
    );

    // Add fee structure for Offering 2
    await connection.execute(
      `INSERT INTO offering_fees (
        offeringId, platformFeePercentage, platformFeeFixed,
        managementFeePercentage, managementFeeFixed,
        performanceFeePercentage,
        maintenanceFeePercentage, maintenanceFeeFixed,
        acquisitionFeePercentage, acquisitionFeeFixed,
        dispositionFeePercentage, dispositionFeeFixed,
        platformFeeDescription, managementFeeDescription,
        performanceFeeDescription, maintenanceFeeDescription,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        offering2Id,
        250, 0, // 2.5% platform fee
        175, 0, // 1.75% management fee
        2500, // 25% performance fee
        75, 0, // 0.75% maintenance fee
        125, 0, // 1.25% acquisition fee
        125, 0, // 1.25% disposition fee
        'Platform fee for premium listing and enhanced investor services',
        'Annual management fee including property management and reporting',
        'Performance fee on profits above 10% hurdle rate',
        'Annual maintenance and capital reserve fund'
      ]
    );

    // Add timeline for Offering 2
    await connection.execute(
      `INSERT INTO offering_timeline (
        offeringId, milestoneType, milestoneDate, description, isCompleted, createdAt, updatedAt
      ) VALUES 
        (?, 'funding_start', ?, 'Offering opens for investment', 0, NOW(), NOW()),
        (?, 'funding_milestone_25', ?, '25% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_milestone_50', ?, '50% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_milestone_75', ?, '75% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_end', ?, 'Offering closes', 0, NOW(), NOW()),
        (?, 'closing', ?, 'Property acquisition closes', 0, NOW(), NOW())`,
      [
        offering2Id, new Date('2025-01-15'), offering2Id, new Date('2025-03-01'),
        offering2Id, new Date('2025-04-15'), offering2Id, new Date('2025-06-01'),
        offering2Id, new Date('2025-06-30'), offering2Id, new Date('2025-07-15')
      ]
    );

    // Add status history for Offering 2
    await connection.execute(
      `INSERT INTO offering_status_history (
        offeringId, oldStatus, newStatus, changedBy, notes, changedAt
      ) VALUES 
        (?, 'draft', 'under_review', ?, 'Offering submitted for review', DATE_SUB(NOW(), INTERVAL 5 DAY)),
        (?, 'under_review', 'approved', ?, 'All compliance checks passed. Offering approved for funding.', DATE_SUB(NOW(), INTERVAL 2 DAY))`,
      [offering2Id, userId, offering2Id, userId]
    );

    // Add approval record for Offering 2
    await connection.execute(
      `INSERT INTO offering_approvals (
        offeringId, reviewerId, decision, comments, decidedAt, createdAt, updatedAt
      ) VALUES (?, ?, 'approved', ?, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW())`,
      [offering2Id, userId, 'Excellent offering structure. Financial projections are realistic and well-documented. All legal documents are in order. Approved for funding.']
    );

    console.log(`✅ Created Offering 2 (ID: ${offering2Id})\n`);

    // Offering 3: Mixed-Use Development - Draft
    console.log("📝 Creating Offering 3: Mixed-Use Development (Draft)...");
    
    const [offering3Result] = await connection.execute(
      `INSERT INTO offerings (
        propertyId, fundraiserId, offeringType,
        totalOfferingAmount, minimumOfferingAmount, maximumOfferingAmount,
        totalShares, pricePerShare, availableShares, minimumSharePurchase, maximumSharePurchase,
        ownershipStructure, holdingPeriodMonths, exitStrategy,
        fundingStartDate, fundingEndDate, expectedClosingDate, expectedExitDate,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        propertyId, userId, 'regulation_cf',
        250000000, 1000000, 10000000, // $2.5M total, $10K min, $100K max
        5000, 50000, 20, 500, // 5K shares @ $500/share
        'tenancy_in_common', 48, 'sale_of_property',
        new Date('2025-02-01'), new Date('2025-05-31'), new Date('2025-06-15'), new Date('2029-06-15'),
        'draft'
      ]
    );

    const offering3Id = offering3Result.insertId;

    // Add financial projections for Offering 3
    await connection.execute(
      `INSERT INTO offering_financial_projections (
        offeringId, projectedIRR, projectedROI, projectedCashOnCash, projectedEquityMultiple,
        year1RentalYield, year2RentalYield, year3RentalYield, year4RentalYield, year5RentalYield,
        year1Appreciation, year2Appreciation, year3Appreciation, year4Appreciation, year5Appreciation,
        year1CashFlow, year2CashFlow, year3CashFlow, year4CashFlow, year5CashFlow,
        distributionFrequency, estimatedAnnualDistribution,
        bestCaseIRR, baseCaseIRR, worstCaseIRR,
        assumptions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        offering3Id,
        1100, 7200, 650, 172, // 11% IRR, 72% ROI, 6.5% CoC, 1.72x EM
        600, 630, 660, 690, 720, // Rental yields
        280, 320, 360, 400, 440, // Appreciation
        15000000, 17000000, 19000000, 21000000, 23000000, // Cash flows ($150K-$230K)
        'monthly', 18000000,
        1600, 1100, 550, // Best/Base/Worst IRR
        JSON.stringify({
          occupancyRate: 90,
          annualRentGrowth: 2.5,
          propertyAppreciation: 3.5,
          maintenanceReserve: 4,
          vacancyRate: 10
        })
      ]
    );

    // Add fee structure for Offering 3
    await connection.execute(
      `INSERT INTO offering_fees (
        offeringId, platformFeePercentage, platformFeeFixed,
        managementFeePercentage, managementFeeFixed,
        performanceFeePercentage,
        maintenanceFeePercentage, maintenanceFeeFixed,
        platformFeeDescription, managementFeeDescription,
        performanceFeeDescription, maintenanceFeeDescription,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        offering3Id,
        150, 0, // 1.5% platform fee
        125, 0, // 1.25% management fee
        1500, // 15% performance fee
        50, 0, // 0.5% maintenance fee
        'Platform fee for crowdfunding listing and investor relations',
        'Annual management fee for property operations',
        'Performance fee on profits above 6% hurdle rate',
        'Annual maintenance and repair reserve'
      ]
    );

    // Add timeline for Offering 3
    await connection.execute(
      `INSERT INTO offering_timeline (
        offeringId, milestoneType, milestoneDate, description, isCompleted, createdAt, updatedAt
      ) VALUES 
        (?, 'funding_start', ?, 'Offering opens for investment', 0, NOW(), NOW()),
        (?, 'funding_milestone_25', ?, '25% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_milestone_50', ?, '50% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_milestone_75', ?, '75% funding milestone', 0, NOW(), NOW()),
        (?, 'funding_end', ?, 'Offering closes', 0, NOW(), NOW()),
        (?, 'closing', ?, 'Property acquisition closes', 0, NOW(), NOW())`,
      [
        offering3Id, new Date('2025-02-01'), offering3Id, new Date('2025-03-15'),
        offering3Id, new Date('2025-04-15'), offering3Id, new Date('2025-05-15'),
        offering3Id, new Date('2025-05-31'), offering3Id, new Date('2025-06-15')
      ]
    );

    console.log(`✅ Created Offering 3 (ID: ${offering3Id})\n`);

    console.log("🎉 Seed process completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Offering 1 (ID: ${offering1Id}): Luxury Apartment Complex - Under Review`);
    console.log(`   - Offering 2 (ID: ${offering2Id}): Commercial Office Building - Approved`);
    console.log(`   - Offering 3 (ID: ${offering3Id}): Mixed-Use Development - Draft`);
    console.log("\n✅ All offerings have complete financial projections, fee structures, and timelines");
    console.log("\n🔗 Access the platform to test:");
    console.log("   - Fundraiser Dashboard: /offerings");
    console.log("   - Admin Approvals: /admin/offering-approvals");
    console.log("   - Offering Details: /offerings/[id]");

  } catch (error) {
    console.error("❌ Error during seed process:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
