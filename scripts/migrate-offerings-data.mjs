/**
 * Data Migration Script: Populate New Offering Fields
 * 
 * This script migrates existing offering data to the new expanded schema
 * by adding default values for all new fields added in Phase A.
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function migrateOfferingsData() {
  console.log("🚀 Starting offerings data migration...\n");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Get all existing offerings
    const [offerings] = await connection.query("SELECT * FROM offerings");
    
    console.log(`📊 Found ${offerings.length} offerings to migrate\n`);

    for (const offering of offerings) {
      console.log(`Migrating Offering #${offering.id}...`);

      // Prepare update data with default values for new fields (using lowercase column names)
      const updates = [];
      const values = [];

      // Helper to add update if column is null/empty
      const addUpdate = (column, value) => {
        if (offering[column] === null || offering[column] === undefined) {
          updates.push(`${column} = ?`);
          values.push(value);
        }
      };

      // Offering type defaults
      addUpdate('regulationtype', 'regulation_d');
      addUpdate('offeringtype', 'reg_d_506c');
      
      // Share structure defaults
      addUpdate('totalshares', 1000);
      addUpdate('availableshares', 1000);
      addUpdate('shareprice', Math.floor(offering.totalofferingamount / 1000));
      addUpdate('mininvestmentshares', 1);
      addUpdate('maxinvestmentshares', 100);
      
      // Ownership structure defaults
      addUpdate('ownershipstructure', 'fractional');
      addUpdate('votingrights', false);
      addUpdate('distributionrights', true);
      
      // Holding period defaults
      addUpdate('minimumholdingperiod', 12);
      addUpdate('expectedholdingperiod', 60);
      addUpdate('exitstrategy', 'property_sale');
      
      // Timeline defaults
      addUpdate('fundingstartdate', new Date());
      addUpdate('fundingenddate', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
      addUpdate('expectedclosingdate', new Date(Date.now() + 120 * 24 * 60 * 60 * 1000));
      addUpdate('expectedexitdate', new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000));
      
      // Financial projections defaults
      addUpdate('projectedirr', 12.0);
      addUpdate('projectedroi', 60.0);
      addUpdate('cashoncashreturn', 8.0);
      addUpdate('equitymultiple', 1.6);
      
      // Amounts
      addUpdate('minimumofferingamount', Math.floor(offering.totalofferingamount * 0.5));
      addUpdate('maximumofferingamount', offering.totalofferingamount);

      if (updates.length > 0) {
        values.push(offering.id); // Add ID for WHERE clause
        
        await connection.query(
          `UPDATE offerings SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        console.log(`✅ Migrated Offering #${offering.id} - Updated ${updates.length} fields`);
      } else {
        console.log(`⏭️  Offering #${offering.id} already has all fields populated`);
      }
    }

    console.log(`\n✨ Successfully migrated ${offerings.length} offerings!`);
    console.log("\n📋 Migration Summary:");
    console.log("  - Set default regulation type: Regulation D");
    console.log("  - Set default offering type: 506(c)");
    console.log("  - Calculated share structure based on offering amount");
    console.log("  - Set fractional ownership with distribution rights");
    console.log("  - Set 12-month minimum holding period");
    console.log("  - Set conservative financial projections (12% IRR)");
    console.log("  - Set 90-day funding period");
    console.log("  - Set 5-year expected holding period\n");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
migrateOfferingsData()
  .then(() => {
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
