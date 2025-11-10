/**
 * Schema Column Checker
 * Compares Drizzle schema definition with actual database columns
 */

import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function checkSchemaColumns() {
  console.log("🔍 Checking schema columns...\n");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Get actual database columns
    const [dbColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'offerings' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);

    console.log(`📊 Database has ${dbColumns.length} columns:\n`);
    
    const dbColumnNames = dbColumns.map(col => col.COLUMN_NAME);
    dbColumnNames.forEach((name, idx) => {
      console.log(`${idx + 1}. ${name}`);
    });

    // Expected columns from Drizzle schema (based on schema.ts lines 447-507)
    const expectedColumns = [
      'id', 'fundraiserId', 'propertyId',
      'title', 'description',
      'offeringType', 'regulationType',
      'totalOfferingAmount', 'minimumOfferingAmount', 'maximumOfferingAmount',
      'fundingGoal', 'currentFunding',
      'totalShares', 'availableShares', 'pricePerShare', 'minimumShares', 'maximumShares',
      'ownershipStructure', 'votingRights', 'distributionRights',
      'holdingPeriodMonths', 'exitStrategy', 'exitStrategyDetails',
      'fundingStartDate', 'fundingEndDate', 'expectedClosingDate', 'expectedExitDate',
      'projectedIRR', 'projectedROI', 'cashOnCashReturn', 'equityMultiple',
      'annualDistribution', 'distributionFrequency',
      'status', 'rejectionReason',
      'createdAt', 'updatedAt', 'submittedAt', 'approvedAt', 'approvedBy', 'closedAt'
    ];

    console.log(`\n📋 Expected ${expectedColumns.length} columns from schema\n`);

    // Find missing columns
    const missingColumns = expectedColumns.filter(col => !dbColumnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`❌ Missing ${missingColumns.length} columns in database:\n`);
      missingColumns.forEach((col, idx) => {
        console.log(`${idx + 1}. ${col}`);
      });
    } else {
      console.log("✅ All expected columns exist in database!");
    }

    // Find extra columns (in DB but not in schema)
    const extraColumns = dbColumnNames.filter(col => !expectedColumns.includes(col));
    
    if (extraColumns.length > 0) {
      console.log(`\n⚠️  Extra ${extraColumns.length} columns in database (not in schema):\n`);
      extraColumns.forEach((col, idx) => {
        console.log(`${idx + 1}. ${col}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("Summary:");
    console.log(`  Database columns: ${dbColumns.length}`);
    console.log(`  Expected columns: ${expectedColumns.length}`);
    console.log(`  Missing columns: ${missingColumns.length}`);
    console.log(`  Extra columns: ${extraColumns.length}`);
    console.log("=".repeat(60) + "\n");

    return { dbColumnNames, expectedColumns, missingColumns, extraColumns };

  } catch (error) {
    console.error("❌ Check failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run check
checkSchemaColumns()
  .then(() => {
    console.log("✅ Schema check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Schema check failed:", error);
    process.exit(1);
  });
