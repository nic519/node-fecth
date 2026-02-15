CREATE TABLE `dynamic` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`content` text NOT NULL,
	`traffic` text,
	`status` text NOT NULL,
	`msg` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
