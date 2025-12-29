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
      multipleStatements: true,  // Allow multiple SQL statements in one query
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
    
    // Execute all SQL as a single multi-statement query
    log('\n⚙️  Executing migration statements...', 'blue');
    
    try {
      // Enable multi-statement queries and execute all at once
      await connection.query(migrationSQL);
      
      // Count tables created
      const tableMatches = migrationSQL.match(/CREATE TABLE.*?`([^`]+)`/gi);
      if (tableMatches) {
        tableMatches.forEach(match => {
          const tableName = match.match(/`([^`]+)`/)[1];
          log(`  ✓ Created table: ${tableName}`, 'green');
        });
      }
      
      log(`\n✅ Migration completed successfully`, 'green');
    } catch (error) {
      // Check if error is "table already exists"
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        log(`  ⚠️  Some tables already exist (skipping)`, 'yellow');
      } else {
        throw error;
      }
    }
    
     // Seed data programmatically (avoids variable issues)
    log('\n⚙️  Seeding knowledge test questions...', 'blue');
    
    const sampleQuestions = [
      {
        questionText: 'What is the primary purpose of diversification in an investment portfolio?',
        questionTextAr: 'ما هو الغرض الأساسي من التنويع في محفظة الاستثمار؟',
        category: 'Risk Management',
        difficulty: 'easy',
        answers: [
          { answerText: 'To maximize returns by investing in a single asset', answerTextAr: 'لتعظيم العوائد من خلال الاستثمار في أصل واحد', isCorrect: false },
          { answerText: 'To reduce risk by spreading investments across different assets', answerTextAr: 'لتقليل المخاطر من خلال توزيع الاستثمارات عبر أصول مختلفة', isCorrect: true },
          { answerText: 'To avoid paying taxes on investment gains', answerTextAr: 'لتجنب دفع الضرائب على أرباح الاستثمار', isCorrect: false },
          { answerText: 'To guarantee profits in all market conditions', answerTextAr: 'لضمان الأرباح في جميع ظروف السوق', isCorrect: false }
        ]
      },
      {
        questionText: 'In real estate crowdfunding, what does "fractional ownership" mean?',
        questionTextAr: 'في التمويل الجماعي العقاري، ماذا تعني "الملكية الجزئية"؟',
        category: 'Real Estate Basics',
        difficulty: 'easy',
        answers: [
          { answerText: 'Owning a complete property', answerTextAr: 'امتلاك عقار كامل', isCorrect: false },
          { answerText: 'Owning a portion or share of a property', answerTextAr: 'امتلاك جزء أو حصة من عقار', isCorrect: true },
          { answerText: 'Renting a property for a fraction of the year', answerTextAr: 'استئجار عقار لجزء من السنة', isCorrect: false },
          { answerText: 'Buying property at a discounted price', answerTextAr: 'شراء عقار بسعر مخفض', isCorrect: false }
        ]
      }
    ];
    
    for (const question of sampleQuestions) {
      // Insert question
      const [result] = await connection.query(
        'INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES (?, ?, ?, ?)',
        [question.questionText, question.questionTextAr, question.category, question.difficulty]
      );
      
      const questionId = result.insertId;
      
      // Insert answers
      for (const answer of question.answers) {
        await connection.query(
          'INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES (?, ?, ?, ?)',
          [questionId, answer.answerText, answer.answerTextAr, answer.isCorrect]
        );
      }
    }
    
    log(`  ✓ Seeded ${sampleQuestions.length} questions`, 'green');
    
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
