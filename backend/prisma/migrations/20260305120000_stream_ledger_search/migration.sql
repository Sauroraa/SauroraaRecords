ALTER TABLE `Release`
  ADD COLUMN `previewDuration` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `isPaid` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `hlsFullPath` VARCHAR(191) NULL,
  ADD COLUMN `hlsPreviewPath` VARCHAR(191) NULL,
  ADD COLUMN `waveformPath` VARCHAR(191) NULL,
  ADD COLUMN `hlsReady` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `processingStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

CREATE TABLE `ReleaseFile` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `fileType` ENUM('MASTER', 'HLS_FULL_PLAYLIST', 'HLS_PREVIEW_PLAYLIST', 'HLS_SEGMENT', 'WAVEFORM') NOT NULL,
  `path` VARCHAR(191) NOT NULL,
  `bucket` VARCHAR(191) NULL,
  `objectKey` VARCHAR(191) NULL,
  `sizeBytes` BIGINT NULL,
  `mimeType` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ReleaseFile_releaseId_fileType_idx`(`releaseId`, `fileType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StreamEvent` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `scope` ENUM('PREVIEW', 'FULL') NOT NULL,
  `playlistPath` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `StreamEvent_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  INDEX `StreamEvent_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `StreamEvent_scope_createdAt_idx`(`scope`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Invoice` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `periodMonth` VARCHAR(191) NOT NULL,
  `grossAmount` DECIMAL(10, 2) NOT NULL,
  `commission` DECIMAL(10, 2) NOT NULL,
  `netAmount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
  `filePath` VARCHAR(191) NULL,
  `status` ENUM('DRAFT', 'ISSUED', 'PAID', 'FAILED') NOT NULL DEFAULT 'DRAFT',
  `externalRef` VARCHAR(191) NULL,
  `issuedAt` DATETIME(3) NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `Invoice_artistId_periodMonth_key`(`artistId`, `periodMonth`),
  UNIQUE INDEX `Invoice_externalRef_key`(`externalRef`),
  INDEX `Invoice_periodMonth_status_idx`(`periodMonth`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LedgerEntry` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NULL,
  `orderId` VARCHAR(191) NULL,
  `entryType` ENUM('SALE_GROSS', 'PLATFORM_COMMISSION', 'ARTIST_NET', 'PAYOUT', 'REFUND') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
  `description` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `eventDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `LedgerEntry_artistId_eventDate_idx`(`artistId`, `eventDate`),
  INDEX `LedgerEntry_entryType_eventDate_idx`(`entryType`, `eventDate`),
  INDEX `LedgerEntry_orderId_idx`(`orderId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Release_artistId_published_createdAt_idx` ON `Release`(`artistId`, `published`, `createdAt`);
CREATE INDEX `Release_published_genre_createdAt_idx` ON `Release`(`published`, `genre`, `createdAt`);
CREATE INDEX `Release_slug_published_idx` ON `Release`(`slug`, `published`);
CREATE INDEX `Order_userId_createdAt_idx` ON `Order`(`userId`, `createdAt`);
CREATE INDEX `Order_status_createdAt_idx` ON `Order`(`status`, `createdAt`);
CREATE INDEX `ArtistRevenue_month_idx` ON `ArtistRevenue`(`month`);
CREATE INDEX `Follow_artistId_createdAt_idx` ON `Follow`(`artistId`, `createdAt`);
CREATE INDEX `GateSubmission_releaseId_createdAt_idx` ON `GateSubmission`(`releaseId`, `createdAt`);
CREATE INDEX `GateSubmission_artistId_createdAt_idx` ON `GateSubmission`(`artistId`, `createdAt`);

ALTER TABLE `ReleaseFile`
  ADD CONSTRAINT `ReleaseFile_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `StreamEvent`
  ADD CONSTRAINT `StreamEvent_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `StreamEvent_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Invoice`
  ADD CONSTRAINT `Invoice_artistId_fkey`
    FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LedgerEntry`
  ADD CONSTRAINT `LedgerEntry_artistId_fkey`
    FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LedgerEntry_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `LedgerEntry_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
