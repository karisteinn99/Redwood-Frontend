CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`hashed_password` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`answer_lat` real NOT NULL,
	`answer_lng` real NOT NULL,
	`distance_km` real NOT NULL,
	`answered_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text,
	`total_score` real DEFAULT 0,
	`questions_answered` integer DEFAULT 0,
	`is_completed` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()),
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`correct_lat` real NOT NULL,
	`correct_lng` real NOT NULL,
	`difficulty` text DEFAULT 'medium',
	`category` text DEFAULT 'geography',
	`created_at` integer DEFAULT (unixepoch())
);
