CREATE TABLE `kyc_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`personalInfoData` text,
	`documentUploadData` text,
	`questionnaireData` text,
	`completionPercentage` int NOT NULL DEFAULT 0,
	`lastSavedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kyc_progress_id` PRIMARY KEY(`id`)
);
