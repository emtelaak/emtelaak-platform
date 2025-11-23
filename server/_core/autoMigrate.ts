import { getDb } from "../db";

/**
 * Auto-migration script that runs on server startup
 * Checks if email verification columns exist and adds them if missing
 */
export async function runAutoMigrations() {
  console.log("[Auto-Migration] Starting database migration check...");
  
  const db = await getDb();
  if (!db) {
    console.warn("[Auto-Migration] Database not available, skipping migrations");
    return;
  }

  try {
    // Check if emailVerified column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerificationExpiry')
    `) as any;

    const existingColumns = new Set(columns.map((row: any) => row.COLUMN_NAME));
    
    console.log("[Auto-Migration] Existing email verification columns:", Array.from(existingColumns));

    // If all columns exist, skip migration
    if (existingColumns.has('emailVerified') && 
        existingColumns.has('emailVerificationToken') && 
        existingColumns.has('emailVerificationExpiry')) {
      console.log("[Auto-Migration] ✅ All email verification columns already exist, skipping migration");
      return;
    }

    console.log("[Auto-Migration] 🔧 Missing columns detected, running migration...");

    // Add emailVerified column if missing
    if (!existingColumns.has('emailVerified')) {
      console.log("[Auto-Migration] Adding emailVerified column...");
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN emailVerified BOOLEAN NOT NULL DEFAULT FALSE AFTER password
      `);
      console.log("[Auto-Migration] ✅ emailVerified column added");
    }

    // Add emailVerificationToken column if missing
    if (!existingColumns.has('emailVerificationToken')) {
      console.log("[Auto-Migration] Adding emailVerificationToken column...");
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN emailVerificationToken VARCHAR(255) NULL AFTER emailVerified
      `);
      console.log("[Auto-Migration] ✅ emailVerificationToken column added");
    }

    // Add emailVerificationExpiry column if missing
    if (!existingColumns.has('emailVerificationExpiry')) {
      console.log("[Auto-Migration] Adding emailVerificationExpiry column...");
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN emailVerificationExpiry TIMESTAMP NULL AFTER emailVerificationToken
      `);
      console.log("[Auto-Migration] ✅ emailVerificationExpiry column added");
    }

    // Add index if it doesn't exist
    try {
      console.log("[Auto-Migration] Adding index on emailVerificationToken...");
      await db.execute(`
        CREATE INDEX idx_email_verification_token ON users (emailVerificationToken)
      `);
      console.log("[Auto-Migration] ✅ Index added");
    } catch (error: any) {
      // Index might already exist, ignore duplicate key error
      if (error.code === 'ER_DUP_KEYNAME' || error.message?.includes('Duplicate key name')) {
        console.log("[Auto-Migration] ℹ️  Index already exists, skipping");
      } else {
        throw error;
      }
    }

    console.log("[Auto-Migration] ✅ Migration completed successfully!");

  } catch (error) {
    console.error("[Auto-Migration] ❌ Migration failed:", error);
    console.error("[Auto-Migration] The server will continue to start, but email verification features may not work correctly");
    console.error("[Auto-Migration] Please run the migration manually or check database permissions");
  }
}
