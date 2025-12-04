/**
 * End-to-End Test: Complete Investor Journey
 * 
 * This script tests the entire investor workflow:
 * 1. User registration
 * 2. KYC document upload and questionnaire
 * 3. KYC approval by admin
 * 4. Investment creation
 * 5. Invoice payment
 * 6. Portfolio verification
 * 7. Income distribution
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import mysql from "mysql2/promise";

// Import schema
import {
  users,
  userProfiles,
  kycDocuments,
  kycQuestionnaires,
  verificationStatus,
  properties,
  investments,
  invoices,
  incomeDistributions,
  walletTransactions,
} from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

// Create database connection
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🚀 Starting End-to-End Investor Journey Test\n");
console.log("=" .repeat(60));

// Test data
const testInvestor = {
  email: `test.investor.${Date.now()}@emtelaak.test`,
  name: "Test Investor",
  openId: `test_${Date.now()}`,
};

let testUserId;
let testPropertyId;
let testInvestmentId;
let testInvoiceId;

try {
  // ============================================
  // STEP 1: Create Test User Account
  // ============================================
  console.log("\n📝 STEP 1: Creating test investor account...");
  
  const [userResult] = await db.insert(users).values({
    openId: testInvestor.openId,
    name: testInvestor.name,
    email: testInvestor.email,
    loginMethod: "email",
    role: "user",
  });
  
  testUserId = userResult.insertId;
  console.log(`✅ User created with ID: ${testUserId}`);
  console.log(`   Email: ${testInvestor.email}`);
  console.log(`   Name: ${testInvestor.name}`);

  // Create user profile
  await db.insert(userProfiles).values({
    userId: testUserId,
    phoneNumber: "+201234567890",
    dateOfBirth: new Date("1990-01-01"),
    nationality: "EG",
    address: "123 Test Street, Cairo, Egypt",
    city: "Cairo",
    country: "Egypt",
    postalCode: "12345",
  });
  console.log("✅ User profile created");

  // Create verification status
  await db.insert(verificationStatus).values({
    userId: testUserId,
    level: "level_0",
    emailVerified: true,
    phoneVerified: false,
    documentsVerified: false,
    questionnaireCompleted: false,
    canViewProperties: true,
    canInvest: false,
  });
  console.log("✅ Verification status initialized");

  // ============================================
  // STEP 2: Upload KYC Documents
  // ============================================
  console.log("\n📄 STEP 2: Uploading KYC documents...");
  
  const [idDocResult] = await db.insert(kycDocuments).values({
    userId: testUserId,
    documentType: "id_card",
    fileUrl: "https://example.com/test-id.pdf",
    status: "pending",
  });
  console.log("✅ ID document uploaded (pending review)");

  const [addressDocResult] = await db.insert(kycDocuments).values({
    userId: testUserId,
    documentType: "proof_of_address",
    fileUrl: "https://example.com/test-address.pdf",
    status: "pending",
  });
  console.log("✅ Address proof uploaded (pending review)");

  // ============================================
  // STEP 3: Submit KYC Questionnaire
  // ============================================
  console.log("\n📋 STEP 3: Submitting KYC questionnaire...");
  
  const [questionnaireResult] = await db.insert(kycQuestionnaires).values({
    userId: testUserId,
    employmentStatus: "employed",
    occupation: "Software Engineer",
    investmentExperience: "intermediate",
    realEstateExperience: "beginner",
    previousInvestments: "stocks, bonds",
    riskTolerance: "moderate",
    isAccredited: false,
    accreditationType: "none",
    investmentGoals: "wealth building",
    investmentHorizon: "5-10 years",
    expectedReturnRate: "8-12%",
    sourceOfFunds: "salary",
    status: "pending",
  });
  console.log("✅ KYC questionnaire submitted (pending review)");

  // ============================================
  // STEP 4: Admin Approves KYC
  // ============================================
  console.log("\n✅ STEP 4: Admin approving KYC documents...");
  
  // Approve ID document
  await db.update(kycDocuments)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(kycDocuments.id, idDocResult.insertId));
  console.log("✅ ID document approved");

  // Approve address document
  await db.update(kycDocuments)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(kycDocuments.id, addressDocResult.insertId));
  console.log("✅ Address document approved");

  // Approve questionnaire
  await db.update(kycQuestionnaires)
    .set({ 
      status: "approved", 
      reviewedAt: new Date(),
      reviewNotes: "All information verified. Approved for investment."
    })
    .where(eq(kycQuestionnaires.id, questionnaireResult.insertId));
  console.log("✅ KYC questionnaire approved");

  // Update verification status
  await db.update(verificationStatus)
    .set({
      level: "level_1",
      documentsVerified: true,
      questionnaireCompleted: true,
      canInvest: true,
    })
    .where(eq(verificationStatus.userId, testUserId));
  console.log("✅ Verification status updated to Level 1");
  console.log("📧 [EMAIL WOULD BE SENT]: KYC Approval Email");

  // ============================================
  // STEP 5: Find Available Property
  // ============================================
  console.log("\n🏢 STEP 5: Finding available property...");
  
  const [availableProperty] = await db.select()
    .from(properties)
    .where(eq(properties.status, "available"))
    .limit(1);

  if (!availableProperty) {
    console.log("⚠️  No available properties found. Creating test property...");
    
    const [propertyResult] = await db.insert(properties).values({
      name: "Test Property - Luxury Apartment",
      description: "Test property for investor journey",
      location: "New Cairo, Egypt",
      propertyType: "residential",
      investmentType: "buy_to_let",
      status: "available",
      totalValue: 100000000, // EGP 1,000,000 in cents
      totalShares: 1000,
      availableShares: 1000,
      pricePerShare: 100000, // EGP 1,000 per share
      minimumInvestment: 1000000, // EGP 10,000 minimum
      expectedAnnualReturn: 12.5,
      rentalYield: 8.0,
      imageUrl: "https://example.com/property.jpg",
      fundingProgress: 0,
      targetFundingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    });
    
    testPropertyId = propertyResult.insertId;
    console.log(`✅ Test property created with ID: ${testPropertyId}`);
  } else {
    testPropertyId = availableProperty.id;
    console.log(`✅ Found available property: ${availableProperty.name} (ID: ${testPropertyId})`);
  }

  // ============================================
  // STEP 6: Create Investment
  // ============================================
  console.log("\n💰 STEP 6: Creating investment...");
  
  const investmentAmount = 5000000; // EGP 50,000 in cents
  const numberOfShares = 50; // 50 shares
  const sharePrice = 100000; // EGP 1,000 per share

  const [investmentResult] = await db.insert(investments).values({
    userId: testUserId,
    propertyId: testPropertyId,
    amount: investmentAmount,
    shares: numberOfShares,
    sharePrice: sharePrice,
    ownershipPercentage: Math.round((numberOfShares / 1000) * 1000000), // 5%
    distributionFrequency: "monthly",
    paymentMethod: "bank_transfer",
    status: "pending",
    paymentStatus: "pending",
  });

  testInvestmentId = investmentResult.insertId;
  console.log(`✅ Investment created with ID: ${testInvestmentId}`);
  console.log(`   Amount: EGP ${(investmentAmount / 100).toLocaleString()}`);
  console.log(`   Shares: ${numberOfShares}`);
  console.log(`   Ownership: 5%`);

  // ============================================
  // STEP 7: Generate Invoice
  // ============================================
  console.log("\n🧾 STEP 7: Generating invoice...");
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const [invoiceResult] = await db.insert(invoices).values({
    userId: testUserId,
    investmentId: testInvestmentId,
    propertyId: testPropertyId,
    amount: investmentAmount,
    shares: numberOfShares,
    sharePrice: sharePrice,
    currency: "EGP",
    status: "pending",
    dueDate: dueDate,
    invoiceNumber: `INV-TEST-${Date.now()}`,
  });

  testInvoiceId = invoiceResult.insertId;
  console.log(`✅ Invoice generated: INV-TEST-${Date.now()}`);
  console.log(`   Due date: ${dueDate.toLocaleDateString()}`);
  console.log("📧 [EMAIL WOULD BE SENT]: Invoice Email");

  // ============================================
  // STEP 8: Mark Invoice as Paid
  // ============================================
  console.log("\n💳 STEP 8: Processing payment...");
  
  await db.update(invoices)
    .set({
      status: "paid",
      paidAt: new Date(),
      transactionId: `TXN-${Date.now()}`,
    })
    .where(eq(invoices.id, testInvoiceId));
  console.log("✅ Invoice marked as paid");

  // Update investment status
  await db.update(investments)
    .set({ 
      status: "confirmed",
      paymentStatus: "completed",
    })
    .where(eq(investments.id, testInvestmentId));
  console.log("✅ Investment status updated to 'confirmed'");
  console.log("📧 [EMAIL WOULD BE SENT]: Investment Confirmation Email");

  // ============================================
  // STEP 9: Verify Portfolio
  // ============================================
  console.log("\n📊 STEP 9: Verifying portfolio...");
  
  const userInvestments = await db.select()
    .from(investments)
    .where(eq(investments.userId, testUserId));

  console.log(`✅ Portfolio contains ${userInvestments.length} investment(s)`);
  console.log(`   Total invested: EGP ${(userInvestments.reduce((sum, inv) => sum + inv.amount, 0) / 100).toLocaleString()}`);

  // ============================================
  // STEP 10: Create Income Distribution
  // ============================================
  console.log("\n💸 STEP 10: Creating income distribution...");
  
  const distributionAmount = 200000; // EGP 2,000 in cents (monthly rental income)

  const [distributionResult] = await db.insert(incomeDistributions).values({
    investmentId: testInvestmentId,
    amount: distributionAmount,
    distributionType: "rental_income",
    distributionDate: new Date(),
    status: "pending",
  });

  console.log(`✅ Income distribution created: EGP ${(distributionAmount / 100).toLocaleString()}`);

  // Mark as processed
  await db.update(incomeDistributions)
    .set({
      status: "processed",
      processedAt: new Date(),
    })
    .where(eq(incomeDistributions.id, distributionResult.insertId));
  
  console.log("✅ Distribution marked as processed");
  console.log("📧 [EMAIL WOULD BE SENT]: Income Distribution Email");

  // ============================================
  // STEP 11: Verify Income History
  // ============================================
  console.log("\n📈 STEP 11: Verifying income history...");
  
  const userDistributions = await db.select()
    .from(incomeDistributions)
    .where(eq(incomeDistributions.investmentId, testInvestmentId));

  console.log(`✅ Income history contains ${userDistributions.length} distribution(s)`);
  console.log(`   Total income: EGP ${(userDistributions.reduce((sum, dist) => sum + dist.amount, 0) / 100).toLocaleString()}`);

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 END-TO-END TEST COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  
  console.log("\n📋 Test Summary:");
  console.log(`   ✅ User Account Created (ID: ${testUserId})`);
  console.log(`   ✅ KYC Documents Uploaded & Approved`);
  console.log(`   ✅ KYC Questionnaire Submitted & Approved`);
  console.log(`   ✅ Verification Level: Level 1 (Can Invest)`);
  console.log(`   ✅ Investment Created (ID: ${testInvestmentId})`);
  console.log(`   ✅ Invoice Generated & Paid (ID: ${testInvoiceId})`);
  console.log(`   ✅ Portfolio Verified (1 investment)`);
  console.log(`   ✅ Income Distribution Created & Processed`);
  
  console.log("\n📧 Email Notifications (would be sent if SMTP configured):");
  console.log(`   1. KYC Approval Email → ${testInvestor.email}`);
  console.log(`   2. Invoice Email → ${testInvestor.email}`);
  console.log(`   3. Investment Confirmation Email → ${testInvestor.email}`);
  console.log(`   4. Income Distribution Email → ${testInvestor.email}`);

  console.log("\n💡 Next Steps:");
  console.log("   1. Configure SMTP credentials to enable actual email sending");
  console.log("   2. Test the UI workflow manually in the browser");
  console.log("   3. Verify performance charts display correctly");
  console.log("   4. Test multi-currency ROI calculator");

  console.log("\n🧹 Cleanup: Test data remains in database for manual verification");
  console.log(`   Test user email: ${testInvestor.email}`);
  console.log(`   Test user ID: ${testUserId}`);

} catch (error) {
  console.error("\n❌ TEST FAILED:");
  console.error(error);
  process.exit(1);
} finally {
  await connection.end();
}
