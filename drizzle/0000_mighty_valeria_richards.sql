CREATE TABLE `connections` (
	`connection_id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`context` text NOT NULL,
	`location_where_met` text,
	`introduced_by` text,
	`details` text,
	`date_met` integer,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`person_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`introduced_by`) REFERENCES `people`(`person_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`contact_id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`normalized_value` text,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`person_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_type_normalized_value_unique` ON `contacts` (`type`,`normalized_value`) WHERE "contacts"."normalized_value" is not null;--> statement-breakpoint
CREATE TABLE `facts` (
	`fact_id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`category` text NOT NULL,
	`value` text NOT NULL,
	`details` text,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`person_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `people` (
	`person_id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`current_city` text,
	`current_country` text,
	`headline` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`type` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_normalized_name_unique` ON `organizations` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `person_organizations` (
	`person_organization_id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`relationship` text,
	`title` text,
	`is_current` integer,
	`known_year` integer,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`person_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`organization_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`interaction_id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`interaction_date` integer,
	`type` text,
	`summary` text NOT NULL,
	`follow_up` text,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`person_id`) ON UPDATE no action ON DELETE cascade
);
