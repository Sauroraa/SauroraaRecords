ALTER TABLE `Comment`
  ADD COLUMN `timestampSec` INTEGER NULL;

CREATE TABLE `DmcaClaim` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `reporterId` VARCHAR(191) NOT NULL,
  `claimantName` VARCHAR(191) NOT NULL,
  `claimantEmail` VARCHAR(191) NOT NULL,
  `evidenceUrl` VARCHAR(191) NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('OPEN', 'UNDER_REVIEW', 'SUSPENDED_CONTENT', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
  `resolutionNote` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `DmcaClaim_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `DmcaClaim_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentReport` (
  `id` VARCHAR(191) NOT NULL,
  `reporterId` VARCHAR(191) NOT NULL,
  `targetType` ENUM('RELEASE', 'COMMENT', 'USER') NOT NULL,
  `releaseId` VARCHAR(191) NULL,
  `commentId` VARCHAR(191) NULL,
  `reportedUserId` VARCHAR(191) NULL,
  `reason` VARCHAR(191) NOT NULL,
  `details` TEXT NULL,
  `botScore` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('OPEN', 'BOT_REVIEWED', 'STAFF_REVIEW', 'ACTION_TAKEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ContentReport_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `ContentReport_targetType_createdAt_idx`(`targetType`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AiModerationFlag` (
  `id` VARCHAR(191) NOT NULL,
  `reportId` VARCHAR(191) NULL,
  `releaseId` VARCHAR(191) NULL,
  `targetType` ENUM('RELEASE', 'COMMENT', 'USER') NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `score` INTEGER NOT NULL,
  `textSnippet` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AiModerationFlag_score_createdAt_idx`(`score`, `createdAt`),
  INDEX `AiModerationFlag_targetType_createdAt_idx`(`targetType`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ModerationAction` (
  `id` VARCHAR(191) NOT NULL,
  `reportId` VARCHAR(191) NOT NULL,
  `staffId` VARCHAR(191) NOT NULL,
  `actionType` ENUM('WARNING', 'REMOVE_CONTENT', 'SUSPEND_USER', 'REINSTATE_CONTENT', 'BAN_USER') NOT NULL,
  `note` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ModerationAction_staffId_createdAt_idx`(`staffId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DuplicateAudioAlert` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `matchedReleaseId` VARCHAR(191) NULL,
  `audioHash` VARCHAR(191) NOT NULL,
  `similarityScore` INTEGER NOT NULL,
  `status` ENUM('NEW', 'CONFIRMED', 'FALSE_POSITIVE', 'IGNORED') NOT NULL DEFAULT 'NEW',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `DuplicateAudioAlert_audioHash_idx`(`audioHash`),
  INDEX `DuplicateAudioAlert_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArtistTrustScore` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `score` INTEGER NOT NULL DEFAULT 50,
  `factors` JSON NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ArtistTrustScore_artistId_key`(`artistId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReleaseSchedule` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `scheduledAt` DATETIME(3) NOT NULL,
  `timezone` VARCHAR(191) NOT NULL,
  `autoPublish` BOOLEAN NOT NULL DEFAULT true,
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ReleaseSchedule_releaseId_key`(`releaseId`),
  INDEX `ReleaseSchedule_scheduledAt_autoPublish_idx`(`scheduledAt`, `autoPublish`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ViralShareCard` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `imagePath` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ViralShareCard_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FanBadge` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `FanBadge_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserFanBadge` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `badgeId` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NULL,
  `awardedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `UserFanBadge_userId_badgeId_artistId_key`(`userId`, `badgeId`, `artistId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PremiereEvent` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NULL,
  `isLive` BOOLEAN NOT NULL DEFAULT false,
  `chatEnabled` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PremiereEvent_releaseId_key`(`releaseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PremiereChatMessage` (
  `id` VARCHAR(191) NOT NULL,
  `premiereId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `PremiereChatMessage_premiereId_createdAt_idx`(`premiereId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArtistBroadcast` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArtistBroadcastRecipient` (
  `id` VARCHAR(191) NOT NULL,
  `broadcastId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ArtistBroadcastRecipient_broadcastId_userId_key`(`broadcastId`, `userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayoutAccount` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `provider` ENUM('STRIPE_CONNECT', 'PAYPAL', 'SEPA') NOT NULL,
  `accountRef` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PayoutAccount_artistId_key`(`artistId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayoutTransaction` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `invoiceId` VARCHAR(191) NULL,
  `provider` ENUM('STRIPE_CONNECT', 'PAYPAL', 'SEPA') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
  `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `providerRef` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `paidAt` DATETIME(3) NULL,
  INDEX `PayoutTransaction_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AccountingExport` (
  `id` VARCHAR(191) NOT NULL,
  `requestedBy` VARCHAR(191) NOT NULL,
  `format` ENUM('CSV', 'PDF') NOT NULL,
  `periodFrom` DATETIME(3) NOT NULL,
  `periodTo` DATETIME(3) NOT NULL,
  `filePath` VARCHAR(191) NULL,
  `status` ENUM('QUEUED', 'DONE', 'FAILED') NOT NULL DEFAULT 'QUEUED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SmartTagSuggestion` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `suggestedGenre` VARCHAR(191) NULL,
  `suggestedBpm` INTEGER NULL,
  `suggestedTags` JSON NULL,
  `confidence` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `SmartTagSuggestion_releaseId_key`(`releaseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ListeningHeatmap` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `secondMark` INTEGER NOT NULL,
  `listeners` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ListeningHeatmap_releaseId_secondMark_key`(`releaseId`, `secondMark`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReleaseAssetPack` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `assetType` ENUM('STEM', 'SAMPLE_PACK', 'PRESET_PACK') NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ReleaseAssetPack_releaseId_assetType_idx`(`releaseId`, `assetType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmbedWidget` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `theme` VARCHAR(191) NULL,
  `allowDownload` BOOLEAN NOT NULL DEFAULT false,
  `createdBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `EmbedWidget_token_key`(`token`),
  INDEX `EmbedWidget_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TrackVersion` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `versionLabel` VARCHAR(191) NOT NULL,
  `audioPath` VARCHAR(191) NOT NULL,
  `changelog` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `TrackVersion_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SecurityRecoveryToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `SecurityRecoveryToken_userId_expiresAt_idx`(`userId`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserTwoFactor` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `secret` VARCHAR(191) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `recoveryCodes` JSON NULL,
  `lastVerifiedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `UserTwoFactor_userId_key`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoginAlert` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `ip` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `location` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `LoginAlert_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PublicApiClient` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `keyHash` VARCHAR(191) NOT NULL,
  `scopes` JSON NULL,
  `rateLimit` INTEGER NOT NULL DEFAULT 120,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PublicApiClient_keyHash_key`(`keyHash`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PushDevice` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `endpoint` VARCHAR(191) NOT NULL,
  `p256dh` VARCHAR(191) NOT NULL,
  `auth` VARCHAR(191) NOT NULL,
  `platform` VARCHAR(191) NULL,
  `locale` VARCHAR(191) NULL,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PushDevice_userId_endpoint_key`(`userId`, `endpoint`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DmcaClaim`
  ADD CONSTRAINT `DmcaClaim_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DmcaClaim_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ContentReport`
  ADD CONSTRAINT `ContentReport_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ContentReport_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ContentReport_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ContentReport_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AiModerationFlag`
  ADD CONSTRAINT `AiModerationFlag_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `ContentReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `AiModerationFlag_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ModerationAction`
  ADD CONSTRAINT `ModerationAction_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `ContentReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ModerationAction_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `DuplicateAudioAlert`
  ADD CONSTRAINT `DuplicateAudioAlert_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DuplicateAudioAlert_matchedReleaseId_fkey` FOREIGN KEY (`matchedReleaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ArtistTrustScore`
  ADD CONSTRAINT `ArtistTrustScore_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ReleaseSchedule`
  ADD CONSTRAINT `ReleaseSchedule_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ViralShareCard`
  ADD CONSTRAINT `ViralShareCard_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserFanBadge`
  ADD CONSTRAINT `UserFanBadge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserFanBadge_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `FanBadge`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserFanBadge_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PremiereEvent`
  ADD CONSTRAINT `PremiereEvent_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PremiereEvent_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PremiereChatMessage`
  ADD CONSTRAINT `PremiereChatMessage_premiereId_fkey` FOREIGN KEY (`premiereId`) REFERENCES `PremiereEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PremiereChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ArtistBroadcast`
  ADD CONSTRAINT `ArtistBroadcast_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ArtistBroadcastRecipient`
  ADD CONSTRAINT `ArtistBroadcastRecipient_broadcastId_fkey` FOREIGN KEY (`broadcastId`) REFERENCES `ArtistBroadcast`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ArtistBroadcastRecipient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PayoutAccount`
  ADD CONSTRAINT `PayoutAccount_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PayoutTransaction`
  ADD CONSTRAINT `PayoutTransaction_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PayoutTransaction_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AccountingExport`
  ADD CONSTRAINT `AccountingExport_requestedBy_fkey` FOREIGN KEY (`requestedBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SmartTagSuggestion`
  ADD CONSTRAINT `SmartTagSuggestion_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ListeningHeatmap`
  ADD CONSTRAINT `ListeningHeatmap_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ReleaseAssetPack`
  ADD CONSTRAINT `ReleaseAssetPack_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `EmbedWidget`
  ADD CONSTRAINT `EmbedWidget_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `EmbedWidget_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TrackVersion`
  ADD CONSTRAINT `TrackVersion_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SecurityRecoveryToken`
  ADD CONSTRAINT `SecurityRecoveryToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserTwoFactor`
  ADD CONSTRAINT `UserTwoFactor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LoginAlert`
  ADD CONSTRAINT `LoginAlert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PublicApiClient`
  ADD CONSTRAINT `PublicApiClient_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PushDevice`
  ADD CONSTRAINT `PushDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
