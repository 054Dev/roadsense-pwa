CREATE TABLE `hazards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`severity` int NOT NULL,
	`type` enum('pothole','rough') NOT NULL,
	`timestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hazards_id` PRIMARY KEY(`id`)
);
