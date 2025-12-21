-- Manual Database Migration Script
-- Run this script directly on your production database to fix login and logo upload issues
-- This creates all missing tables that the auto-migration should have created

-- ============================================
-- 1. Create blocked_ips table
-- ============================================
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
);

-- ============================================
-- 2. Create user_sessions table (FIXES LOGIN)
-- ============================================
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
);

-- ============================================
-- 3. Create platform_settings table (FIXES LOGO UPLOAD)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settingKey VARCHAR(255) NOT NULL UNIQUE,
  settingValue TEXT NOT NULL,
  description TEXT,
  updatedBy INT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify tables were created successfully:

-- Check if blocked_ips table exists
SELECT COUNT(*) as blocked_ips_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'blocked_ips';

-- Check if user_sessions table exists
SELECT COUNT(*) as user_sessions_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'user_sessions';

-- Check if platform_settings table exists
SELECT COUNT(*) as platform_settings_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'platform_settings';

-- ============================================
-- Expected Results:
-- All three queries should return 1
-- ============================================
