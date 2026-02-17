CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`user_id` text,
	`resource_type` text,
	`resource_id` text,
	`request_id` text,
	`meta` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
