/**
 * Phase 4: Migrate Historical Investment Data
 * 
 * This script migrates all existing investments from the old `investments` table
 * to the new `investmentTransactions` table while preserving all data and relationships.
 * 
 * Features:
 * - Dry-run mode for testing
 * - Field mapping with validation
 * - Progress logging
 * - Error handling
 * - Rollback support
 * 
 * Usage:
 *   node migrate-investments-phase4.mjs --dry-run    # Test without changes
 *   node migrate-investments-phase4.mjs              # Execute migration
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

console.log('🚀 Phase 4: Investment Data Migration');
console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '⚡ LIVE MIGRATION'}\n`);

async function migrateInvestments() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Step 1: Verify tables exist
    console.log('📊 Step 1: Verifying database tables...');
    
    const [oldTableCheck] = await connection.query(
      "SHOW TABLES LIKE 'investments'"
    );
    const [newTableCheck] = await connection.query(
      "SHOW TABLES LIKE 'investment_transactions'"
    );
    
    if (oldTableCheck.length === 0) {
      throw new Error('Old investments table not found');
    }
    if (newTableCheck.length === 0) {
      throw new Error('New investment_transactions table not found');
    }
    
    console.log('✅ Both tables exist\n');
    
    // Step 2: Count existing records
    console.log('📊 Step 2: Counting existing records...');
    
    const [oldCount] = await connection.query(
      'SELECT COUNT(*) as count FROM investments'
    );
    const [newCount] = await connection.query(
      'SELECT COUNT(*) as count FROM investment_transactions'
    );
    
    const oldRecords = oldCount[0].count;
    const newRecords = newCount[0].count;
    
    console.log(`   Old table (investments): ${oldRecords} records`);
    console.log(`   New table (investment_transactions): ${newRecords} records`);
    
    if (oldRecords === 0) {
      console.log('\n⚠️  No records to migrate. Exiting.');
      return;
    }
    
    console.log('');
    
    // Step 3: Fetch all investments from old table
    console.log('📊 Step 3: Fetching investments from old table...');
    
    const [investments] = await connection.query(`
      SELECT 
        id,
        userId,
        propertyId,
        amount,
        shares,
        sharePrice,
        ownershipPercentage,
        status,
        paymentMethod,
        paymentStatus,
        transactionId,
        distributionFrequency,
        investmentDate,
        confirmedAt,
        exitedAt,
        createdAt,
        updatedAt
      FROM investments
      ORDER BY id
    `);
    
    console.log(`✅ Found ${investments.length} investments to migrate\n`);
    
    // Step 4: Map and validate data
    console.log('📊 Step 4: Mapping and validating data...');
    
    const mappedData = [];
    const errors = [];
    
    for (const inv of investments) {
      try {
        // Calculate fees (old system had no fees, so set to 0)
        const platformFee = 0;
        const processingFee = 0;
        const totalAmount = inv.amount;
        const netAmount = inv.amount;
        
        // Map status
        const statusMap = {
          'pending': 'pending',
          'confirmed': 'completed',
          'active': 'completed',
          'exited': 'completed',
          'cancelled': 'cancelled',
        };
        const newStatus = statusMap[inv.status] || 'pending';
        
        // Validate required fields
        if (!inv.userId || !inv.propertyId) {
          throw new Error(`Missing required fields: userId=${inv.userId}, propertyId=${inv.propertyId}`);
        }
        
        mappedData.push({
          oldId: inv.id,
          userId: inv.userId,
          propertyId: inv.propertyId,
          numberOfShares: inv.shares || 0,
          totalAmount: totalAmount,
          platformFee: platformFee,
          processingFee: processingFee,
          netAmount: netAmount,
          status: newStatus,
          paymentMethod: inv.paymentMethod || null,
          transactionReference: inv.transactionId || null,
          distributionFrequency: inv.distributionFrequency || 'quarterly',
          ownershipPercentage: inv.ownershipPercentage || 0,
          exitedAt: inv.exitedAt || null,
          createdAt: inv.createdAt || inv.investmentDate || new Date(),
          updatedAt: inv.updatedAt || new Date(),
        });
        
      } catch (error) {
        errors.push({
          investmentId: inv.id,
          error: error.message,
        });
      }
    }
    
    console.log(`✅ Mapped ${mappedData.length} investments`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} validation errors:`);
      errors.forEach(err => {
        console.log(`   - Investment ID ${err.investmentId}: ${err.error}`);
      });
      console.log('');
    }
    
    if (mappedData.length === 0) {
      console.log('\n❌ No valid data to migrate. Exiting.');
      return;
    }
    
    console.log('');
    
    // Step 5: Insert into new table
    if (DRY_RUN) {
      console.log('🔍 DRY RUN: Skipping database insert');
      console.log(`   Would insert ${mappedData.length} records\n`);
      
      // Show sample mapping
      console.log('📋 Sample mapping (first record):');
      const sample = mappedData[0];
      console.log(`   Old ID: ${sample.oldId}`);
      console.log(`   User ID: ${sample.userId}`);
      console.log(`   Property ID: ${sample.propertyId}`);
      console.log(`   Shares: ${sample.numberOfShares}`);
      console.log(`   Amount: $${(sample.totalAmount / 100).toFixed(2)}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Distribution Frequency: ${sample.distributionFrequency}`);
      console.log(`   Ownership: ${(sample.ownershipPercentage / 10000).toFixed(4)}%\n`);
      
    } else {
      console.log('📊 Step 5: Inserting into new table...');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const data of mappedData) {
        try {
          await connection.query(`
            INSERT INTO investment_transactions (
              userId,
              propertyId,
              numberOfShares,
              totalAmount,
              platformFee,
              processingFee,
              netAmount,
              status,
              paymentMethod,
              transactionReference,
              distributionFrequency,
              ownershipPercentage,
              exitedAt,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            data.userId,
            data.propertyId,
            data.numberOfShares,
            data.totalAmount,
            data.platformFee,
            data.processingFee,
            data.netAmount,
            data.status,
            data.paymentMethod,
            data.transactionReference,
            data.distributionFrequency,
            data.ownershipPercentage,
            data.exitedAt,
            data.createdAt,
            data.updatedAt,
          ]);
          
          successCount++;
          
          if (successCount % 10 === 0) {
            console.log(`   Progress: ${successCount}/${mappedData.length} records inserted`);
          }
          
        } catch (error) {
          failCount++;
          console.error(`   ❌ Failed to insert investment ${data.oldId}: ${error.message}`);
        }
      }
      
      console.log(`\n✅ Migration complete:`);
      console.log(`   - Success: ${successCount} records`);
      console.log(`   - Failed: ${failCount} records\n`);
    }
    
    // Step 6: Verify migration
    console.log('📊 Step 6: Verification...');
    
    if (!DRY_RUN) {
      const [finalCount] = await connection.query(
        'SELECT COUNT(*) as count FROM investment_transactions'
      );
      const finalRecords = finalCount[0].count;
      
      console.log(`   Old table: ${oldRecords} records`);
      console.log(`   New table: ${finalRecords} records`);
      console.log(`   Difference: ${finalRecords - newRecords} new records added\n`);
      
      // Verify totals match
      const [oldTotal] = await connection.query(
        'SELECT SUM(amount) as total FROM investments'
      );
      const [newTotal] = await connection.query(
        'SELECT SUM(totalAmount) as total FROM investment_transactions'
      );
      
      const oldTotalAmount = oldTotal[0].total || 0;
      const newTotalAmount = newTotal[0].total || 0;
      
      console.log('💰 Amount verification:');
      console.log(`   Old table total: $${(oldTotalAmount / 100).toFixed(2)}`);
      console.log(`   New table total: $${(newTotalAmount / 100).toFixed(2)}`);
      
      if (Math.abs(oldTotalAmount - newTotalAmount) < 100) { // Allow $1 difference for rounding
        console.log(`   ✅ Totals match!\n`);
      } else {
        console.log(`   ⚠️  Totals differ by $${Math.abs((oldTotalAmount - newTotalAmount) / 100).toFixed(2)}\n`);
      }
    }
    
    // Final summary
    console.log('✅ Phase 4 Migration Complete!\n');
    
    if (DRY_RUN) {
      console.log('🔍 This was a DRY RUN - no changes were made');
      console.log('   Run without --dry-run flag to execute migration\n');
    } else {
      console.log('📋 Next steps:');
      console.log('   1. Verify Portfolio page shows all investments');
      console.log('   2. Test income distribution functionality');
      console.log('   3. Check for any data discrepancies');
      console.log('   4. Keep old table for 1-2 weeks as backup');
      console.log('   5. Proceed to Phase 5 when confident\n');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    
    if (!DRY_RUN) {
      console.error('\n⚠️  ROLLBACK REQUIRED');
      console.error('   Run: DELETE FROM investment_transactions WHERE createdAt > NOW() - INTERVAL 1 HOUR;');
    }
    
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateInvestments();
