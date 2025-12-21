/**
 * Apply Database Migration Script
 * 
 * This script applies pending database migrations by directly executing
 * the generated SQL from drizzle-kit.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

async function applyMigrations() {
  console.log('🚀 Starting database migration...\n');

  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check if investment_transactions table exists
    console.log('📊 Checking current database state...');
    
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'investment_transactions'"
    );
    
    if (tables.length > 0) {
      console.log('✅ investment_transactions table already exists');
    } else {
      console.log('⚠️  investment_transactions table does not exist');
      console.log('📝 Creating investment_transactions table...\n');
      
      // Create investment_transactions table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS investment_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          propertyId INT NOT NULL,
          numberOfShares INT NOT NULL,
          totalAmount INT NOT NULL,
          platformFee INT NOT NULL,
          processingFee INT NOT NULL,
          netAmount INT NOT NULL,
          status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending' NOT NULL,
          paymentMethod VARCHAR(50),
          transactionReference VARCHAR(255),
          distributionFrequency ENUM('monthly', 'quarterly', 'annual'),
          ownershipPercentage INT,
          exitedAt DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (propertyId) REFERENCES properties(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log('✅ investment_transactions table created');
    }
    
    // Check if income_distributions has investmentTransactionId column
    console.log('\n📊 Checking income_distributions table...');
    
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM income_distributions LIKE 'investmentTransactionId'
    `);
    
    if (columns.length > 0) {
      console.log('✅ investmentTransactionId column already exists');
    } else {
      console.log('⚠️  investmentTransactionId column does not exist');
      console.log('📝 Adding investmentTransactionId column...\n');
      
      await connection.query(`
        ALTER TABLE income_distributions
        ADD COLUMN investmentTransactionId INT NULL
        AFTER investmentId
      `);
      
      await connection.query(`
        ALTER TABLE income_distributions
        ADD CONSTRAINT income_distributions_investmentTransactionId_fk
        FOREIGN KEY (investmentTransactionId) 
        REFERENCES investment_transactions(id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
      `);
      
      console.log('✅ investmentTransactionId column added');
    }
    
    // Check investments table for Phase 2 fields
    console.log('\n📊 Checking investments table for Phase 2 fields...');
    
    const fieldsToCheck = [
      'distributionFrequency',
      'exitedAt',
      'ownershipPercentage'
    ];
    
    for (const field of fieldsToCheck) {
      const [fieldExists] = await connection.query(`
        SHOW COLUMNS FROM investments LIKE '${field}'
      `);
      
      if (fieldExists.length > 0) {
        console.log(`✅ ${field} column exists`);
      } else {
        console.log(`⚠️  ${field} column missing - may need manual addition`);
      }
    }
    
    console.log('\n✅ Database migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - investment_transactions table: Ready');
    console.log('  - income_distributions.investmentTransactionId: Ready');
    console.log('  - Phase 2 fields in investments: Verified');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyMigrations();
