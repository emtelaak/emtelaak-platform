-- Migration: Add Investor Qualification System (FRA Compliance)
-- Date: 2025-12-28
-- Description: Creates tables for knowledge test, investor classification, and investment limits

-- ============================================
-- KNOWLEDGE TEST SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS `knowledge_test_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `questionText` TEXT NOT NULL,
  `questionTextAr` TEXT,
  `category` VARCHAR(255) NOT NULL,
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `knowledge_test_questions_category_idx` (`category`),
  INDEX `knowledge_test_questions_difficulty_idx` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_test_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `questionId` INT NOT NULL,
  `answerText` TEXT NOT NULL,
  `answerTextAr` TEXT,
  `isCorrect` BOOLEAN NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `knowledge_test_answers_question_id_idx` (`questionId`),
  FOREIGN KEY (`questionId`) REFERENCES `knowledge_test_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_test_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `score` INT NOT NULL,
  `totalQuestions` INT NOT NULL,
  `correctAnswers` INT NOT NULL,
  `passed` BOOLEAN NOT NULL,
  `certificateId` VARCHAR(255) UNIQUE,
  `expiresAt` TIMESTAMP NULL,
  `attemptedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `knowledge_test_attempts_user_id_idx` (`userId`),
  INDEX `knowledge_test_attempts_certificate_id_idx` (`certificateId`),
  INDEX `knowledge_test_attempts_passed_idx` (`passed`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_test_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attemptId` INT NOT NULL,
  `questionId` INT NOT NULL,
  `selectedAnswerId` INT,
  `isCorrect` BOOLEAN NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `knowledge_test_responses_attempt_id_idx` (`attemptId`),
  FOREIGN KEY (`attemptId`) REFERENCES `knowledge_test_attempts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`questionId`) REFERENCES `knowledge_test_questions`(`id`),
  FOREIGN KEY (`selectedAnswerId`) REFERENCES `knowledge_test_answers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVESTOR CLASSIFICATION & LIMITS
-- ============================================

CREATE TABLE IF NOT EXISTS `investor_qualification_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL UNIQUE,
  `classification` ENUM('retail', 'qualified', 'accredited') NOT NULL,
  `annualIncome` DECIMAL(15, 2),
  `netWorth` DECIMAL(15, 2),
  `liquidAssets` DECIMAL(15, 2),
  `investmentExperience` ENUM('none', 'beginner', 'intermediate', 'advanced'),
  `perOfferingLimit` DECIMAL(15, 2) NOT NULL,
  `totalPortfolioLimit` DECIMAL(15, 2) NOT NULL,
  `annualInvestmentLimit` DECIMAL(15, 2) NOT NULL,
  `knowledgeTestAttemptId` INT,
  `status` ENUM('pending', 'active', 'suspended', 'expired') NOT NULL DEFAULT 'pending',
  `lastReviewedAt` TIMESTAMP NULL,
  `reviewedBy` INT,
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `investor_qualification_status_user_id_idx` (`userId`),
  INDEX `investor_qualification_status_classification_idx` (`classification`),
  INDEX `investor_qualification_status_status_idx` (`status`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`knowledgeTestAttemptId`) REFERENCES `knowledge_test_attempts`(`id`),
  FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVESTMENT LIMIT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS `investment_limit_tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `currentYearTotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `currentYearStart` TIMESTAMP NOT NULL,
  `currentYearEnd` TIMESTAMP NOT NULL,
  `totalInvested` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `activeInvestmentsCount` INT NOT NULL DEFAULT 0,
  `lastCalculatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `investment_limit_tracking_user_id_idx` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
