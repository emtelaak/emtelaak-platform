CREATE TABLE `platform_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `platform_settings` ADD CONSTRAINT `platform_settings_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;