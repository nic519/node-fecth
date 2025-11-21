CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`access_token` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
