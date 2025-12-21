-- Create investmentTransactions table manually
CREATE TABLE IF NOT EXISTS `investment_transactions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `propertyId` int NOT NULL,
  
  -- Investment Details
  `investmentAmount` int NOT NULL COMMENT 'Amount in cents',
  `numberOfShares` int NOT NULL,
  `pricePerShare` int NOT NULL COMMENT 'Price in cents',
  
  -- Fees
  `platformFee` int NOT NULL DEFAULT 0 COMMENT 'In cents',
  `processingFee` int NOT NULL DEFAULT 0 COMMENT 'In cents',
  `totalAmount` int NOT NULL COMMENT 'Investment + fees in cents',
  
  -- Status
  `status` enum('pending', 'reserved', 'processing', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  
  -- Reservation
  `reservationExpiresAt` timestamp NULL,
  `reservedAt` timestamp NULL,
  
  -- Payment
  `paymentMethod` varchar(50),
  `paymentStatus` enum('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  `paymentReference` varchar(255),
  `paidAt` timestamp NULL,
  
  -- Completion
  `completedAt` timestamp NULL,
  `certificateIssued` boolean DEFAULT false,
  `certificateIssuedAt` timestamp NULL,
  
  -- Metadata
  `ipAddress` varchar(45),
  `userAgent` text,
  `notes` text,
  
  -- Additional Fields (Phase 2 Migration)
  `distributionFrequency` enum('monthly', 'quarterly', 'annual'),
  `exitedAt` timestamp NULL,
  `ownershipPercentage` int COMMENT 'percentage * 10000 (e.g., 100 = 0.01%)',
  
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
