-- ============================================
-- Minimal Authentication Tables for Emtelaak Platform
-- Run this in TiDB Cloud SQL Editor first
-- ============================================

USE emtelaak;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE,
  `name` TEXT,
  `email` VARCHAR(320),
  `phone` VARCHAR(20),
  `password` VARCHAR(255),
  `loginMethod` VARCHAR(64),
  `role` ENUM('user', 'investor', 'fundraiser', 'admin', 'super_admin') DEFAULT 'user' NOT NULL,
  `status` ENUM('active', 'suspended', 'pending_verification') DEFAULT 'pending_verification' NOT NULL,
  `preferredLanguage` VARCHAR(10) DEFAULT 'en',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `lastSignedIn` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expiresAt` TIMESTAMP NOT NULL,
  `used` BOOLEAN DEFAULT FALSE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `password_reset_user_id_idx` (`userId`),
  INDEX `password_reset_token_idx` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_profiles table (for profile pictures)
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `profilePicture` TEXT,
  `firstNameEn` VARCHAR(100),
  `lastNameEn` VARCHAR(100),
  `firstNameAr` VARCHAR(100),
  `lastNameAr` VARCHAR(100),
  `dateOfBirth` TIMESTAMP NULL,
  `nationality` VARCHAR(100),
  `countryOfResidence` VARCHAR(100),
  `city` VARCHAR(100),
  `address` TEXT,
  `postalCode` VARCHAR(20),
  `bio` TEXT,
  `linkedinUrl` VARCHAR(500),
  `twitterUrl` VARCHAR(500),
  `websiteUrl` VARCHAR(500),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE INDEX `user_profiles_user_id_unique` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SELECT 'Tables created successfully!' AS status;
SHOW TABLES;

-- ============================================
-- Next Step: Insert your admin account
-- ============================================
-- After running this, run the CREATE_ADMIN_ACCOUNT.sql script
