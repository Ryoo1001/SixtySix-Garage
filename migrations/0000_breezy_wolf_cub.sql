CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`expiresAt` integer,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `booking_oli` (
	`id` text PRIMARY KEY NOT NULL,
	`bookingId` text NOT NULL,
	`oliId` text NOT NULL,
	`harga_saat_booking` integer NOT NULL,
	FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`oliId`) REFERENCES `oli`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `booking_services` (
	`id` text PRIMARY KEY NOT NULL,
	`bookingId` text NOT NULL,
	`serviceId` text NOT NULL,
	FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serviceId`) REFERENCES `jenis_service`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `booking_spareparts` (
	`id` text PRIMARY KEY NOT NULL,
	`bookingId` text NOT NULL,
	`sparepartId` text NOT NULL,
	`qty` integer NOT NULL,
	`harga_saat_booking` integer NOT NULL,
	FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sparepartId`) REFERENCES `spareparts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`kendaraanId` text NOT NULL,
	`tanggal` text NOT NULL,
	`waktu` text NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`catatan` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kendaraanId`) REFERENCES `kendaraan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`tanggal` text NOT NULL,
	`kapasitas_max` integer DEFAULT 5 NOT NULL,
	`kapasitas_terpakai` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_slots_tanggal_unique` ON `daily_slots` (`tanggal`);--> statement-breakpoint
CREATE TABLE `jenis_service` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`deskripsi` text,
	`harga_estimasi` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kendaraan` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`jenis` text DEFAULT 'Motor' NOT NULL,
	`transmisi` text NOT NULL,
	`merek` text NOT NULL,
	`model` text NOT NULL,
	`tahun` integer,
	`cc` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `oli` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`merek` text NOT NULL,
	`tipe_transmisi` text NOT NULL,
	`viskositas` text NOT NULL,
	`cc_min` integer DEFAULT 0 NOT NULL,
	`cc_max` integer DEFAULT 9999 NOT NULL,
	`harga` integer NOT NULL,
	`grade_api` text,
	`rating` real
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `spareparts` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`kode` text NOT NULL,
	`kategori` text,
	`harga` integer NOT NULL,
	`stok` integer DEFAULT 0 NOT NULL,
	`kompatibilitas` text
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`phone` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
