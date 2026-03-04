CREATE TABLE `SupportTicket` (
  `id` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `userId` VARCHAR(191) NOT NULL,
  `assignedToId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `closedAt` DATETIME(3) NULL,

  INDEX `SupportTicket_userId_idx`(`userId`),
  INDEX `SupportTicket_assignedToId_idx`(`assignedToId`),
  INDEX `SupportTicket_status_updatedAt_idx`(`status`, `updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SupportMessage` (
  `id` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NOT NULL,
  `authorType` ENUM('USER', 'AGENT', 'BOT') NOT NULL DEFAULT 'USER',
  `authorId` VARCHAR(191) NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `SupportMessage_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
  INDEX `SupportMessage_authorId_idx`(`authorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SupportTicket`
  ADD CONSTRAINT `SupportTicket_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SupportTicket`
  ADD CONSTRAINT `SupportTicket_assignedToId_fkey`
    FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `SupportMessage`
  ADD CONSTRAINT `SupportMessage_ticketId_fkey`
    FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SupportMessage`
  ADD CONSTRAINT `SupportMessage_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

