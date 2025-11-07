-- Create help desk tables with translation support

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticketId` VARCHAR(50) NOT NULL UNIQUE,
  `userId` INT NOT NULL,
  `categoryId` INT,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' NOT NULL,
  `status` ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') DEFAULT 'open' NOT NULL,
  `assignedAgentId` INT,
  `internalNotes` TEXT,
  `resolution` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `resolvedAt` TIMESTAMP NULL,
  `closedAt` TIMESTAMP NULL,
  INDEX `user_id_idx` (`userId`),
  INDEX `category_id_idx` (`categoryId`),
  INDEX `assigned_agent_id_idx` (`assignedAgentId`),
  INDEX `status_idx` (`status`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assignedAgentId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `ticket_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `nameAr` VARCHAR(100),
  `description` TEXT,
  `isActive` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticketId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `message` TEXT NOT NULL,
  `isInternal` BOOLEAN DEFAULT FALSE NOT NULL,
  `attachments` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `ticket_id_idx` (`ticketId`),
  INDEX `sender_id_idx` (`senderId`),
  FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversationId` VARCHAR(50) NOT NULL UNIQUE,
  `userId` INT NOT NULL,
  `assignedAgentId` INT,
  `status` ENUM('waiting', 'active', 'resolved', 'closed') DEFAULT 'waiting' NOT NULL,
  `subject` VARCHAR(255),
  `lastMessageAt` TIMESTAMP NULL,
  `rating` INT,
  `feedback` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `closedAt` TIMESTAMP NULL,
  INDEX `user_id_idx` (`userId`),
  INDEX `assigned_agent_id_idx` (`assignedAgentId`),
  INDEX `status_idx` (`status`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assignedAgentId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversationId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `message` TEXT NOT NULL,
  `messageType` ENUM('text', 'file', 'system') DEFAULT 'text' NOT NULL,
  `attachments` JSON,
  `detectedLanguage` VARCHAR(10),
  `translations` JSON,
  `isRead` BOOLEAN DEFAULT FALSE NOT NULL,
  `readAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `conversation_id_idx` (`conversationId`),
  INDEX `sender_id_idx` (`senderId`),
  FOREIGN KEY (`conversationId`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `knowledge_base_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `nameAr` VARCHAR(100),
  `description` TEXT,
  `displayOrder` INT DEFAULT 0,
  `isActive` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `knowledge_base_articles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `categoryId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `titleAr` VARCHAR(255),
  `content` TEXT NOT NULL,
  `contentAr` TEXT,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `tags` JSON,
  `views` INT DEFAULT 0,
  `helpfulCount` INT DEFAULT 0,
  `notHelpfulCount` INT DEFAULT 0,
  `isPublished` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `category_id_idx` (`categoryId`),
  INDEX `slug_idx` (`slug`),
  FOREIGN KEY (`categoryId`) REFERENCES `knowledge_base_categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `canned_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `contentAr` TEXT,
  `shortcut` VARCHAR(50),
  `category` VARCHAR(100),
  `isActive` BOOLEAN DEFAULT TRUE NOT NULL,
  `usageCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
