CREATE TABLE `astral_themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`birthDate` varchar(10) NOT NULL,
	`birthTime` varchar(8) NOT NULL,
	`birthPlace` varchar(255) NOT NULL,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`timezone` decimal(5,2) NOT NULL,
	`planetaryData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `astral_themes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compatibility_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme1Id` int NOT NULL,
	`theme2Id` int NOT NULL,
	`compatibilityScore` int NOT NULL,
	`compatibilityData` text NOT NULL,
	`interpretation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compatibility_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interpretations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`themeId` int NOT NULL,
	`elementName` varchar(50) NOT NULL,
	`interpretation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interpretations_id` PRIMARY KEY(`id`)
);
