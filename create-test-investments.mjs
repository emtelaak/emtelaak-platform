/**
 * Create Test Investment Data
 * 
 * This script creates test investments in the old system (investments table)
 * so we can test the income distribution functionality.
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

async function createTestInvestments() {
  console.log('🚀 Creating test investment data...\n');

  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get first user ID
    const [users] = await connection.query('SELECT id FROM users LIMIT 3');
    
    if (users.length < 3) {
      console.error('❌ Need at least 3 users in database');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users`);
    
    // Get first property
    const [properties] = await connection.query('SELECT id, name, totalShares FROM properties LIMIT 1');
    
    if (properties.length === 0) {
      console.error('❌ No properties found in database');
      process.exit(1);
    }
    
    const property = properties[0];
    console.log(`✅ Using property: ${property.name} (ID: ${property.id})`);
    console.log(`   Total shares: ${property.totalShares}\n`);
    
    // Check if investments already exist for this property
    const [existing] = await connection.query(
      'SELECT COUNT(*) as count FROM investments WHERE propertyId = ?',
      [property.id]
    );
    
    if (existing[0].count > 0) {
      console.log(`⚠️  Property already has ${existing[0].count} investments`);
      console.log('   Skipping test data creation to avoid duplicates\n');
      
      // Show existing investments
      const [investments] = await connection.query(`
        SELECT 
          id,
          userId,
          shares,
          amount / 100.0 as amountDollars,
          ownershipPercentage / 10000.0 as ownershipPct,
          status
        FROM investments 
        WHERE propertyId = ?
        ORDER BY userId
      `, [property.id]);
      
      console.log('📊 Existing investments:');
      investments.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. User ${inv.userId}: ${inv.shares} shares (${inv.ownershipPct}%) - $${inv.amountDollars} - ${inv.status}`);
      });
      
      return;
    }
    
    // Create 3 test investments with different ownership percentages
    const testInvestments = [
      {
        userId: users[0].id,
        shares: 250,
        ownershipPct: 25, // 25%
      },
      {
        userId: users[1].id,
        shares: 500,
        ownershipPct: 50, // 50%
      },
      {
        userId: users[2].id,
        shares: 250,
        ownershipPct: 25, // 25%
      },
    ];
    
    console.log('📝 Creating test investments...\n');
    
    for (const inv of testInvestments) {
      const sharePrice = 10000; // $100 per share in cents
      const amount = inv.shares * sharePrice;
      const ownershipPercentage = inv.ownershipPct * 10000; // Store as integer × 10000
      
      await connection.query(`
        INSERT INTO investments (
          userId,
          propertyId,
          shares,
          amount,
          sharePrice,
          ownershipPercentage,
          status,
          distributionFrequency,
          investmentDate,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `, [
        inv.userId,
        property.id,
        inv.shares,
        amount,
        sharePrice,
        ownershipPercentage,
        'confirmed',
        'quarterly'
      ]);
      
      console.log(`✅ Created investment for User ${inv.userId}:`);
      console.log(`   - Shares: ${inv.shares}`);
      console.log(`   - Amount: $${(amount / 100).toFixed(2)}`);
      console.log(`   - Ownership: ${inv.ownershipPct}%`);
      console.log(`   - Status: confirmed\n`);
    }
    
    console.log('✅ Test investment data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Property: ${property.name}`);
    console.log(`   - Total investments: 3`);
    console.log(`   - Total ownership: 100%`);
    console.log(`   - Total invested: $${((250 + 500 + 250) * 100).toFixed(2)}`);
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Login as admin');
    console.log('   2. Visit /admin/income-distribution');
    console.log('   3. Select the property');
    console.log('   4. Enter distribution amount (e.g., $10,000)');
    console.log('   5. Click "Distribute Income"');
    console.log('   6. Verify 3 distribution records created');
    
  } catch (error) {
    console.error('\n❌ Failed to create test data:');
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createTestInvestments();
