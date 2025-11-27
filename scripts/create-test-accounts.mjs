import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { users } from "../drizzle/schema.ts";

/**
 * Create Test Accounts Script
 * 
 * Creates test accounts for authentication testing:
 * 1. Admin account: admin@emtelaak-test.com
 * 2. Investor 1: investor1@emtelaak-test.com
 * 3. Investor 2: investor2@emtelaak-test.com
 */

const TEST_PASSWORD = "TestPassword123!";

async function createTestAccounts() {
  console.log("🚀 Creating test accounts...\n");

  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log("✅ Password hashed\n");

    // Test accounts to create
    const testAccounts = [
      {
        openId: "test_admin_001",
        email: "admin@emtelaak-test.com",
        name: "Test Admin",
        password: hashedPassword,
        role: "admin",
        status: "active",
        emailVerified: true,
        loginMethod: "email",
      },
      {
        openId: "test_investor_001",
        email: "investor1@emtelaak-test.com",
        name: "Test Investor 1",
        password: hashedPassword,
        role: "user",
        status: "active",
        emailVerified: true,
        loginMethod: "email",
      },
      {
        openId: "test_investor_002",
        email: "investor2@emtelaak-test.com",
        name: "Test Investor 2",
        password: hashedPassword,
        role: "user",
        status: "active",
        emailVerified: true,
        loginMethod: "email",
      },
    ];

    // Create each account
    for (const account of testAccounts) {
      try {
        await db.insert(users).values(account);
        console.log(`✅ Created: ${account.email} (${account.role})`);
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          console.log(`⚠️  Already exists: ${account.email}`);
        } else {
          console.error(`❌ Failed to create ${account.email}:`, error.message);
        }
      }
    }

    console.log("\n📋 Test Account Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email: admin@emtelaak-test.com");
    console.log("Password: TestPassword123!");
    console.log("Role: Admin");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email: investor1@emtelaak-test.com");
    console.log("Password: TestPassword123!");
    console.log("Role: Investor");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email: investor2@emtelaak-test.com");
    console.log("Password: TestPassword123!");
    console.log("Role: Investor");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("✅ Test accounts setup complete!");
  } catch (error) {
    console.error("❌ Error creating test accounts:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
createTestAccounts()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
