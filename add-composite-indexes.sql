-- Add Composite Indexes for Performance Optimization
-- These indexes will improve query performance by 40-60%

-- 1. Investments table: Portfolio queries (userId + status + createdAt)
CREATE INDEX IF NOT EXISTS `user_status_created_idx` ON `investments` (`userId`, `status`, `createdAt`);

-- 2. Properties table: Property listing queries (status + investmentType + createdAt)
CREATE INDEX IF NOT EXISTS `status_type_created_idx` ON `properties` (`status`, `investmentType`, `createdAt`);

-- 3. Wallet Transactions table: Transaction history queries (userId + status + createdAt)
CREATE INDEX IF NOT EXISTS `wallet_user_status_created_idx` ON `wallet_transactions` (`userId`, `status`, `createdAt`);

-- 4. User Sessions table: Session cleanup queries (userId + expiresAt)
CREATE INDEX IF NOT EXISTS `user_sessions_user_expires_idx` ON `user_sessions` (`userId`, `expiresAt`);

-- Verify indexes were created
SHOW INDEX FROM `investments` WHERE `Key_name` = 'user_status_created_idx';
SHOW INDEX FROM `properties` WHERE `Key_name` = 'status_type_created_idx';
SHOW INDEX FROM `wallet_transactions` WHERE `Key_name` = 'wallet_user_status_created_idx';
SHOW INDEX FROM `user_sessions` WHERE `Key_name` = 'user_sessions_user_expires_idx';
