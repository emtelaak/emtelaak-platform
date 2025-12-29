#!/usr/bin/env node

/**
 * Migration Script: Knowledge Test System
 * Applies Phase 1 Module 1 database schema to TiDB
 * 
 * Usage: node scripts/migrate-knowledge-test.js
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runMigration() {
  let connection;
  
  try {
    log('\n🚀 Starting Knowledge Test System Migration', 'cyan');
    log('=' .repeat(60), 'cyan');
    
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    log('\n📡 Connecting to TiDB database...', 'blue');
    
    // TiDB requires SSL connections
    const connectionConfig = {
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    };
    
    connection = await mysql.createConnection(connectionConfig);
    log('✅ Connected successfully', 'green');
    
    // Read migration file
    log('\n📄 Reading migration file...', 'blue');
    const migrationPath = join(projectRoot, 'drizzle', '0008_add_investor_qualification_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    log('✅ Migration file loaded', 'green');
    
    // Split SQL into individual statements (handle multi-line statements)
    log('\n⚙️  Executing migration statements...', 'blue');
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    for (const statement of statements) {
      try {
        await connection.query(statement);
        successCount++;
        
        // Extract table name from CREATE TABLE statement for better logging
        const tableMatch = statement.match(/CREATE TABLE.*?`([^`]+)`/i);
        if (tableMatch) {
          log(`  ✓ Created table: ${tableMatch[1]}`, 'green');
        }
      } catch (error) {
        // Check if error is "table already exists"
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          const tableMatch = statement.match(/CREATE TABLE.*?`([^`]+)`/i);
          if (tableMatch) {
            log(`  ⚠️  Table already exists: ${tableMatch[1]} (skipping)`, 'yellow');
          }
        } else {
          throw error;
        }
      }
    }
    
    log(`\n✅ Migration completed: ${successCount} statements executed`, 'green');
    
    // Read seed data file
    log('\n📄 Reading seed data file...', 'blue');
    const seedPath = join(projectRoot, 'drizzle', 'seed_knowledge_test_questions.sql');
    const seedSQL = readFileSync(seedPath, 'utf8');
    log('✅ Seed data file loaded', 'green');
    
    // Execute seed data
    log('\n⚙️  Seeding knowledge test questions...', 'blue');
    
    // Check if questions already exist
    const [existingQuestions] = await connection.query(
      'SELECT COUNT(*) as count FROM knowledge_test_questions'
    );
    
    if (existingQuestions[0].count > 0) {
      log(`  ⚠️  Found ${existingQuestions[0].count} existing questions`, 'yellow');
      log('  ℹ️  Skipping seed data to avoid duplicates', 'yellow');
      log('  💡 To reseed, delete existing questions first', 'yellow');
    } else {
      // Split and execute seed statements
      const seedStatements = seedSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of seedStatements) {
        await connection.query(statement);
      }
      
      // Count inserted questions
      const [newQuestions] = await connection.query(
        'SELECT COUNT(*) as count FROM knowledge_test_questions'
      );
      
      log(`  ✓ Seeded ${newQuestions[0].count} questions`, 'green');
    }
    
    // Verify tables were created
    log('\n🔍 Verifying migration...', 'blue');
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'knowledge_test%' 
      OR SHOW TABLES LIKE 'investor_qualification%'
      OR SHOW TABLES LIKE 'investment_limit%'
    `);
    
    const expectedTables = [
      'knowledge_test_questions',
      'knowledge_test_answers',
      'knowledge_test_attempts',
      'knowledge_test_responses',
      'investor_qualification_status',
      'investment_limit_tracking',
    ];
    
    const createdTables = tables.map(row => Object.values(row)[0]);
    
    log('\n📊 Created Tables:', 'cyan');
    expectedTables.forEach(tableName => {
      if (createdTables.includes(tableName)) {
        log(`  ✓ ${tableName}`, 'green');
      } else {
        log(`  ✗ ${tableName} (MISSING!)`, 'red');
      }
    });
    
    // Get row counts
    log('\n📈 Table Statistics:', 'cyan');
    for (const tableName of createdTables) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      log(`  ${tableName}: ${rows[0].count} rows`, 'blue');
    }
    
    log('\n' + '='.repeat(60), 'cyan');
    log('✅ Migration completed successfully!', 'green');
    log('=' .repeat(60), 'cyan');
    log('\n🎉 Knowledge Test System is now ready to use!', 'green');
    log('📍 Access at: https://emtelaak.com/knowledge-test\n', 'cyan');
    
  } catch (error) {
    log('\n❌ Migration failed!', 'red');
    log('=' .repeat(60), 'red');
    log(`Error: ${error.message}`, 'red');
    
    if (error.code) {
      log(`Error Code: ${error.code}`, 'red');
    }
    
    if (error.sql) {
      log(`\nFailed SQL:\n${error.sql.substring(0, 200)}...`, 'yellow');
    }
    
    log('\n💡 Troubleshooting:', 'yellow');
    log('  1. Ensure DATABASE_URL environment variable is set', 'yellow');
    log('  2. Check database connection and credentials', 'yellow');
    log('  3. Verify TiDB is accessible from this environment', 'yellow');
    log('  4. Check migration file exists at drizzle/0008_add_investor_qualification_system.sql\n', 'yellow');
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('🔌 Database connection closed\n', 'blue');
    }
  }
}

// Run migration
runMigration();
