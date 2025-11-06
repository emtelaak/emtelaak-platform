CREATE TABLE `developer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyNameAr` varchar(255),
	`logoUrl` text,
	`description` text,
	`descriptionAr` text,
	`website` varchar(255),
	`establishedYear` int,
	`totalProjects` int DEFAULT 0,
	`totalFunding` int DEFAULT 0,
	`verified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developer_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `developer_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fee_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionType` enum('pay_in','withdrawal','investment','payout') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`feeType` enum('addition','deduction') NOT NULL,
	`percentageFee` int DEFAULT 0,
	`fixedFee` int DEFAULT 0,
	`useHigherAmount` boolean DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fee_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `fee_settings_transactionType_unique` UNIQUE(`transactionType`)
);
--> statement-breakpoint
CREATE TABLE `income_distributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investmentId` int NOT NULL,
	`amount` int NOT NULL,
	`distributionType` enum('rental_income','capital_gain','exit_proceeds') NOT NULL,
	`distributionDate` timestamp NOT NULL,
	`status` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `income_distributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`amount` int NOT NULL,
	`shares` int NOT NULL,
	`sharePrice` int NOT NULL,
	`ownershipPercentage` int NOT NULL,
	`status` enum('pending','confirmed','active','exited','cancelled') NOT NULL DEFAULT 'pending',
	`distributionFrequency` enum('monthly','quarterly','annual'),
	`paymentMethod` varchar(50),
	`paymentStatus` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`transactionId` varchar(255),
	`investmentDate` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	`exitedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kyc_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('id_card','passport','proof_of_address','income_verification','accreditation') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(100),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`verifiedBy` int,
	CONSTRAINT `kyc_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kyc_questionnaires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`investmentExperience` varchar(50),
	`riskTolerance` varchar(50),
	`financialCapacity` varchar(50),
	`investmentGoals` text,
	`isAccreditedInvestor` boolean DEFAULT false,
	`accreditationDetails` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	CONSTRAINT `kyc_questionnaires_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('investment','distribution','kyc','property','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`actionUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offering_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` int NOT NULL,
	`documentType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offering_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fundraiserId` int NOT NULL,
	`propertyId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`fundingGoal` int NOT NULL,
	`currentFunding` int DEFAULT 0,
	`status` enum('draft','pending_approval','approved','rejected','active','funded','closed') NOT NULL DEFAULT 'draft',
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`approvedBy` int,
	`closedAt` timestamp,
	CONSTRAINT `offerings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_wallet` (
	`id` int AUTO_INCREMENT NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`currency` enum('USD','EGP') NOT NULL DEFAULT 'USD',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_wallet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`description` text,
	`descriptionAr` text,
	`propertyType` enum('residential','commercial','administrative','hospitality','education','logistics','medical') NOT NULL,
	`investmentType` enum('buy_to_let','buy_to_sell') NOT NULL,
	`status` enum('draft','available','funded','exited','cancelled') NOT NULL DEFAULT 'draft',
	`addressLine1` text,
	`addressLine2` text,
	`city` varchar(100),
	`country` varchar(100),
	`gpsLatitude` varchar(50),
	`gpsLongitude` varchar(50),
	`propertySize` int,
	`numberOfUnits` int,
	`constructionYear` int,
	`propertyCondition` varchar(100),
	`amenities` text,
	`totalValue` int NOT NULL,
	`availableValue` int NOT NULL,
	`minimumInvestment` int NOT NULL DEFAULT 10000,
	`sharePrice` int NOT NULL,
	`totalShares` int NOT NULL,
	`availableShares` int NOT NULL,
	`rentalYield` int,
	`annualYieldIncrease` int,
	`managementFee` int,
	`otherCosts` int,
	`projectedNetYield` int,
	`fundTermMonths` int,
	`projectedSalePrice` int,
	`expectedAppreciation` int,
	`distributionFrequency` enum('monthly','quarterly','annual'),
	`firstDistributionDate` timestamp,
	`fundingDeadline` timestamp,
	`acquisitionDate` timestamp,
	`completionDate` timestamp,
	`expectedExitDate` timestamp,
	`vrTourUrl` text,
	`videoTourUrl` text,
	`fundraiserId` int,
	`waitlistEnabled` boolean DEFAULT false,
	`waitlistCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`documentType` enum('legal','financial','technical','regulatory','insurance') NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(100),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`mediaType` enum('image','video','floor_plan') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`caption` text,
	`displayOrder` int DEFAULT 0,
	`isFeatured` boolean DEFAULT false,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`notified` boolean DEFAULT false,
	`notifiedAt` timestamp,
	CONSTRAINT `property_waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `property_user_unique` UNIQUE(`propertyId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int,
	`referralCode` varchar(50) NOT NULL,
	`status` enum('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
	`rewardAmount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `secondary_market_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`shares` int NOT NULL,
	`pricePerShare` int NOT NULL,
	`totalPrice` int NOT NULL,
	`status` enum('pending','approved','settled','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`approvedBy` int,
	`settledAt` timestamp,
	CONSTRAINT `secondary_market_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `secondary_market_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`investmentId` int NOT NULL,
	`shares` int NOT NULL,
	`pricePerShare` int NOT NULL,
	`totalPrice` int NOT NULL,
	`status` enum('active','pending','sold','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`soldAt` timestamp,
	CONSTRAINT `secondary_market_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('pay_in','withdrawal','investment','payout','fee') NOT NULL,
	`amount` int NOT NULL,
	`currency` enum('USD','EGP') NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paymentGateway` varchar(50),
	`transactionId` varchar(255),
	`referenceId` varchar(255),
	`relatedInvestmentId` int,
	`feeAmount` int DEFAULT 0,
	`netAmount` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstNameEn` varchar(100),
	`lastNameEn` varchar(100),
	`firstNameAr` varchar(100),
	`lastNameAr` varchar(100),
	`dateOfBirth` timestamp,
	`nationality` varchar(100),
	`addressLine1` text,
	`addressLine2` text,
	`city` varchar(100),
	`country` varchar(100),
	`postalCode` varchar(20),
	`employmentStatus` varchar(50),
	`employmentInfo` text,
	`annualIncomeRange` varchar(50),
	`investorType` enum('individual','institutional'),
	`preferredLanguage` enum('en','ar') DEFAULT 'en',
	`preferredCurrency` enum('USD','EGP') DEFAULT 'USD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` enum('level_0','level_1','level_2') NOT NULL DEFAULT 'level_0',
	`emailVerified` boolean DEFAULT false,
	`phoneVerified` boolean DEFAULT false,
	`documentsVerified` boolean DEFAULT false,
	`questionnaireCompleted` boolean DEFAULT false,
	`canViewProperties` boolean DEFAULT true,
	`canInvest` boolean DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_status_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','investor','fundraiser','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended','pending_verification') DEFAULT 'pending_verification' NOT NULL;--> statement-breakpoint
ALTER TABLE `developer_profiles` ADD CONSTRAINT `developer_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `income_distributions` ADD CONSTRAINT `income_distributions_investmentId_investments_id_fk` FOREIGN KEY (`investmentId`) REFERENCES `investments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investments` ADD CONSTRAINT `investments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investments` ADD CONSTRAINT `investments_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_questionnaires` ADD CONSTRAINT `kyc_questionnaires_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_questionnaires` ADD CONSTRAINT `kyc_questionnaires_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offering_documents` ADD CONSTRAINT `offering_documents_offeringId_offerings_id_fk` FOREIGN KEY (`offeringId`) REFERENCES `offerings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_fundraiserId_users_id_fk` FOREIGN KEY (`fundraiserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_fundraiserId_users_id_fk` FOREIGN KEY (`fundraiserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_documents` ADD CONSTRAINT `property_documents_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_media` ADD CONSTRAINT `property_media_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_waitlist` ADD CONSTRAINT `property_waitlist_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_waitlist` ADD CONSTRAINT `property_waitlist_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerId_users_id_fk` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredUserId_users_id_fk` FOREIGN KEY (`referredUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `secondary_market_deals` ADD CONSTRAINT `secondary_market_deals_listingId_secondary_market_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `secondary_market_listings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `secondary_market_deals` ADD CONSTRAINT `secondary_market_deals_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `secondary_market_deals` ADD CONSTRAINT `secondary_market_deals_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `secondary_market_deals` ADD CONSTRAINT `secondary_market_deals_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `secondary_market_listings` ADD CONSTRAINT `secondary_market_listings_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `secondary_market_listings` ADD CONSTRAINT `secondary_market_listings_investmentId_investments_id_fk` FOREIGN KEY (`investmentId`) REFERENCES `investments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_relatedInvestmentId_investments_id_fk` FOREIGN KEY (`relatedInvestmentId`) REFERENCES `investments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_status` ADD CONSTRAINT `verification_status_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `investment_id_idx` ON `income_distributions` (`investmentId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `income_distributions` (`status`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `investments` (`userId`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `investments` (`propertyId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `investments` (`status`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `kyc_documents` (`userId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `kyc_questionnaires` (`userId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `read_idx` ON `notifications` (`read`);--> statement-breakpoint
CREATE INDEX `offering_id_idx` ON `offering_documents` (`offeringId`);--> statement-breakpoint
CREATE INDEX `fundraiser_id_idx` ON `offerings` (`fundraiserId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `offerings` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `properties` (`status`);--> statement-breakpoint
CREATE INDEX `property_type_idx` ON `properties` (`propertyType`);--> statement-breakpoint
CREATE INDEX `investment_type_idx` ON `properties` (`investmentType`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_documents` (`propertyId`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_media` (`propertyId`);--> statement-breakpoint
CREATE INDEX `referrer_id_idx` ON `referrals` (`referrerId`);--> statement-breakpoint
CREATE INDEX `buyer_id_idx` ON `secondary_market_deals` (`buyerId`);--> statement-breakpoint
CREATE INDEX `seller_id_idx` ON `secondary_market_deals` (`sellerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `secondary_market_deals` (`status`);--> statement-breakpoint
CREATE INDEX `seller_id_idx` ON `secondary_market_listings` (`sellerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `secondary_market_listings` (`status`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_profiles` (`userId`);