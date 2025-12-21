-- ============================================
-- Emtelaak Platform - Database Migration SQL
-- Run this in TiDB Cloud SQL Editor
-- ============================================

-- Use the emtelaak database
USE emtelaak;

-- ============================================
-- 1. Add password column to users table (if not exists)
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) COMMENT 'Hashed password for standard authentication';

-- ============================================
-- 2. Create password_reset_tokens table
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt)
) COMMENT='Password reset tokens with 1-hour expiry';

-- ============================================
-- 3. Update user_profiles table (add profilePicture if not exists)
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profilePicture TEXT COMMENT 'S3 URL of profile picture';

-- ============================================
-- 4. Add indexes for better performance
-- ============================================

-- Index on users email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on users password for authentication queries
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password);

-- ============================================
-- 5. Update existing users to support new auth system
-- ============================================

-- Set default openId for users who don't have one (for backward compatibility)
UPDATE users 
SET openId = CONCAT('legacy_', id) 
WHERE openId IS NULL OR openId = '';

-- ============================================
-- 6. Verify tables were created
-- ============================================

-- Check if password_reset_tokens table exists
SELECT 'password_reset_tokens table created' AS status
FROM information_schema.tables 
WHERE table_schema = 'emtelaak' 
AND table_name = 'password_reset_tokens';

-- Check if password column exists in users table
SELECT 'password column exists in users table' AS status
FROM information_schema.columns 
WHERE table_schema = 'emtelaak' 
AND table_name = 'users' 
AND column_name = 'password';

-- Check if profilePicture column exists in user_profiles table
SELECT 'profilePicture column exists in user_profiles table' AS status
FROM information_schema.columns 
WHERE table_schema = 'emtelaak' 
AND table_name = 'user_profiles' 
AND column_name = 'profilePicture';

-- ============================================
-- 7. Show table structure
-- ============================================

-- Show users table structure
DESCRIBE users;

-- Show password_reset_tokens table structure
DESCRIBE password_reset_tokens;

-- Show user_profiles table structure
DESCRIBE user_profiles;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Migration completed successfully!' AS status;
