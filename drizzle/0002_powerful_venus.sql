CREATE TABLE `hazardValidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hazardId` int NOT NULL,
	`userId` int NOT NULL,
	`validationType` enum('confirmed','fixed') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hazardValidations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hazardId` int NOT NULL,
	`userId` int,
	`title` varchar(255) NOT NULL,
	`message` text,
	`readStatus` int NOT NULL DEFAULT 0,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
