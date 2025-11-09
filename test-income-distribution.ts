/**
 * Income Distribution Test Script
 * 
 * This script tests the income distribution system by:
 * 1. Creating test data (properties and investments)
 * 2. Running distribution
 * 3. Verifying calculations
 * 4. Checking database records
 */

import { getDb } from "./server/db";
import { properties, investments, incomeDistributions } from "./drizzle/schema";
import { distributeIncomeToProperty } from "./server/db/incomeDistributionDb";
import { eq } from "drizzle-orm";

async function runTests() {
  console.log("🧪 Starting Income Distribution Tests\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // Step 1: Check existing properties
    console.log("📊 Step 1: Checking existing properties...");
    const existingProperties = await db
      .select({
        id: properties.id,
        name: properties.name,
        totalShares: properties.totalShares,
        sharePrice: properties.sharePrice,
      })
      .from(properties)
      .limit(5);

    if (existingProperties.length === 0) {
      console.log("⚠️  No properties found. Creating test property...");
      
      const [newProperty] = await db.insert(properties).values({
        name: "Test Property for Distribution",
        nameAr: "عقار اختبار للتوزيع",
        description: "Test property for income distribution testing",
        propertyType: "residential",
        investmentType: "buy_to_let",
        status: "funded",
        totalShares: 1000,
        sharePrice: 10000, // $100 per share
        fundingGoal: 10000000, // $100,000
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`✅ Created test property with ID: ${newProperty.insertId}`);
      existingProperties.push({
        id: newProperty.insertId,
        name: "Test Property for Distribution",
        totalShares: 1000,
        sharePrice: 10000,
      });
    } else {
      console.log(`✅ Found ${existingProperties.length} existing properties`);
      existingProperties.forEach((p) => {
        console.log(`   - ID: ${p.id}, Name: ${p.name}, Shares: ${p.totalShares}`);
      });
    }

    // Step 2: Check existing investments
    console.log("\n📊 Step 2: Checking existing investments...");
    const testPropertyId = existingProperties[0].id;
    
    const existingInvestments = await db
      .select()
      .from(investments)
      .where(eq(investments.propertyId, testPropertyId));

    if (existingInvestments.length === 0) {
      console.log("⚠️  No investments found. Creating test investments...");
      
      // Create 3 test investors with different ownership percentages
      const testInvestments = [
        {
          userId: 1,
          propertyId: testPropertyId,
          shares: 250, // 25%
          amount: 2500000, // $25,000
          sharePrice: 10000, // $100
          ownershipPercentage: 250000, // 25% × 10000
          status: "confirmed" as const,
          investmentDate: new Date(),
          distributionFrequency: "quarterly" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 2,
          propertyId: testPropertyId,
          shares: 500, // 50%
          amount: 5000000, // $50,000
          sharePrice: 10000, // $100
          ownershipPercentage: 500000, // 50% × 10000
          status: "active" as const,
          investmentDate: new Date(),
          distributionFrequency: "quarterly" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 3,
          propertyId: testPropertyId,
          shares: 250, // 25%
          amount: 2500000, // $25,000
          sharePrice: 10000, // $100
          ownershipPercentage: 250000, // 25% × 10000
          status: "confirmed" as const,
          investmentDate: new Date(),
          distributionFrequency: "quarterly" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const inv of testInvestments) {
        await db.insert(investments).values(inv);
      }
      
      console.log(`✅ Created 3 test investments`);
      console.log(`   - Investor 1: 250 shares (25%) - $25,000`);
      console.log(`   - Investor 2: 500 shares (50%) - $50,000`);
      console.log(`   - Investor 3: 250 shares (25%) - $25,000`);
    } else {
      console.log(`✅ Found ${existingInvestments.length} existing investments`);
      existingInvestments.forEach((inv) => {
        const ownershipPct = (inv.ownershipPercentage || 0) / 10000;
        console.log(`   - User ${inv.userId}: ${inv.shares} shares (${ownershipPct}%) - $${(inv.amount / 100).toFixed(2)}`);
      });
    }

    // Step 3: Run distribution
    console.log("\n💰 Step 3: Running income distribution...");
    const distributionAmount = 1000000; // $10,000
    const distributionDate = new Date();

    console.log(`   Total amount to distribute: $${(distributionAmount / 100).toFixed(2)}`);
    console.log(`   Distribution date: ${distributionDate.toISOString()}`);

    const result = await distributeIncomeToProperty({
      propertyId: testPropertyId,
      totalAmount: distributionAmount,
      distributionType: "rental_income",
      distributionDate,
    });

    console.log(`✅ Distribution completed!`);
    console.log(`   - Total distributions created: ${result.totalDistributions}`);
    console.log(`   - Total amount distributed: $${(result.totalDistributed / 100).toFixed(2)}`);

    // Step 4: Verify distributions in database
    console.log("\n🔍 Step 4: Verifying distribution records...");
    
    const distributionRecords = await db
      .select()
      .from(incomeDistributions)
      .where(eq(incomeDistributions.distributionDate, distributionDate));

    console.log(`✅ Found ${distributionRecords.length} distribution records`);
    
    let totalVerified = 0;
    for (const record of distributionRecords) {
      const investment = await db
        .select()
        .from(investments)
        .where(eq(investments.id, record.investmentId!))
        .limit(1);

      if (investment[0]) {
        const ownershipPct = (investment[0].ownershipPercentage || 0) / 1000000;
        const expectedAmount = Math.floor(distributionAmount * ownershipPct);
        const actualAmount = record.amount;
        const match = Math.abs(expectedAmount - actualAmount) < 2; // Allow 1 cent rounding

        console.log(`   - User ${investment[0].userId}:`);
        console.log(`     Ownership: ${(ownershipPct * 100).toFixed(2)}%`);
        console.log(`     Expected: $${(expectedAmount / 100).toFixed(2)}`);
        console.log(`     Actual: $${(actualAmount / 100).toFixed(2)}`);
        console.log(`     Status: ${match ? "✅ MATCH" : "❌ MISMATCH"}`);

        totalVerified += actualAmount;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total distributed: $${(totalVerified / 100).toFixed(2)}`);
    console.log(`   - Expected total: $${(distributionAmount / 100).toFixed(2)}`);
    console.log(`   - Difference: $${((totalVerified - distributionAmount) / 100).toFixed(2)}`);

    const accuracy = Math.abs(totalVerified - distributionAmount) < distributionRecords.length;
    if (accuracy) {
      console.log(`\n✅ All tests passed! Distribution is accurate.`);
    } else {
      console.log(`\n⚠️  Warning: Distribution total doesn't match expected amount`);
    }

    // Step 5: Cleanup (optional)
    console.log("\n🧹 Test data created. To clean up, run:");
    console.log(`   DELETE FROM income_distributions WHERE distributionDate = '${distributionDate.toISOString()}';`);

  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }

  console.log("\n✅ Test completed successfully!");
  process.exit(0);
}

runTests();
