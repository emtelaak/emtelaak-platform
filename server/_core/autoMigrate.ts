import { getDb } from "../db";

/**
 * Auto-migration script that runs on server startup
 * Checks if email verification columns exist and adds them if missing
 */
export async function runAutoMigrations() {
  console.log("[Auto-Migration] ========================================");
  console.log("[Auto-Migration] Starting database migration check...");
  console.log("[Auto-Migration] This may take a few moments...");
  console.log("[Auto-Migration] DATABASE_URL present:", !!process.env.DATABASE_URL);
  
  const db = await getDb();
  if (!db) {
    console.error("[Auto-Migration] ❌ Database connection failed - getDb() returned null");
    console.error("[Auto-Migration] DATABASE_URL:", process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    return;
  }
  
  console.log("[Auto-Migration] ✅ Database connection established");

  try {
    // First, create blocked_ips table if it doesn't exist
    console.log("[Auto-Migration] Checking blocked_ips table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        reason TEXT,
        blocked_by INT,
        blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NULL,
        is_active INT DEFAULT 1 NOT NULL,
        block_type ENUM('manual', 'automatic') DEFAULT 'manual' NOT NULL,
        INDEX idx_ip_address (ip_address),
        FOREIGN KEY (blocked_by) REFERENCES users(id)
      )
    `);
    console.log("[Auto-Migration] ✅ blocked_ips table ready");

    // Create user_sessions table if it doesn't exist
    console.log("[Auto-Migration] Checking user_sessions table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sessionId VARCHAR(255) NOT NULL UNIQUE,
        userId INT NOT NULL,
        deviceInfo TEXT,
        ipAddress VARCHAR(45),
        location VARCHAR(255) DEFAULT NULL,
        browser VARCHAR(100),
        loginTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX user_sessions_user_id_idx (userId),
        INDEX user_sessions_session_id_idx (sessionId),
        INDEX user_sessions_expires_at_idx (expiresAt),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("[Auto-Migration] ✅ user_sessions table ready");

    // Create platform_settings table if it doesn't exist
    console.log("[Auto-Migration] Checking platform_settings table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settingKey VARCHAR(255) NOT NULL UNIQUE,
        settingValue TEXT NOT NULL,
        description TEXT,
        updatedBy INT,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("[Auto-Migration] ✅ platform_settings table ready");

    // Check if emailVerified column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerificationExpiry', 'lastLoginAt')
    `) as any;

    const existingColumns = new Set(columns.map((row: any) => row.COLUMN_NAME));
    
    console.log("[Auto-Migration] Existing email verification columns:", Array.from(existingColumns));

    // If all columns exist, skip migration
    if (existingColumns.has('emailVerified') && 
        existingColumns.has('emailVerificationToken') && 
        existingColumns.has('emailVerificationExpiry') &&
        existingColumns.has('lastLoginAt')) {
      console.log("[Auto-Migration] ✅ All required columns already exist, skipping migration");
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

    // Add lastLoginAt column if missing
    if (!existingColumns.has('lastLoginAt')) {
      console.log("[Auto-Migration] Adding lastLoginAt column...");
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN lastLoginAt TIMESTAMP NULL AFTER lastSignedIn
      `);
      console.log("[Auto-Migration] ✅ lastLoginAt column added");
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
    console.error("[Auto-Migration] The server will continue to start, but some features may not work correctly");
    console.error("[Auto-Migration] Please run the migration manually or check database permissions");
  }
  
  console.log("[Auto-Migration] ========================================");
}
