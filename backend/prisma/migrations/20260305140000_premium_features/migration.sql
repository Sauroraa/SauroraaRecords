ALTER TABLE `Release`
  ADD COLUMN `bpm` INTEGER NULL,
  ADD COLUMN `tags` JSON NULL,
  ADD COLUMN `mood` VARCHAR(191) NULL,
  ADD COLUMN `energy` INTEGER NULL,
  ADD COLUMN `earlyAccessAt` DATETIME(3) NULL;

CREATE TABLE `Playlist` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Playlist_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlaylistTrack` (
  `id` VARCHAR(191) NOT NULL,
  `playlistId` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL,
  `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PlaylistTrack_playlistId_releaseId_key`(`playlistId`, `releaseId`),
  UNIQUE INDEX `PlaylistTrack_playlistId_position_key`(`playlistId`, `position`),
  INDEX `PlaylistTrack_releaseId_idx`(`releaseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReleaseCollaborator` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `role` ENUM('PRIMARY', 'FEATURED', 'PRODUCER', 'REMIXER') NOT NULL DEFAULT 'FEATURED',
  `invitedById` VARCHAR(191) NULL,
  `accepted` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ReleaseCollaborator_releaseId_artistId_role_key`(`releaseId`, `artistId`, `role`),
  INDEX `ReleaseCollaborator_artistId_accepted_idx`(`artistId`, `accepted`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PrivateListeningLink` (
  `id` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `scope` ENUM('STREAM', 'DOWNLOAD') NOT NULL DEFAULT 'STREAM',
  `releaseId` VARCHAR(191) NOT NULL,
  `creatorId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `maxPlays` INTEGER NOT NULL DEFAULT 50,
  `playsCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastUsedAt` DATETIME(3) NULL,
  UNIQUE INDEX `PrivateListeningLink_token_key`(`token`),
  INDEX `PrivateListeningLink_releaseId_expiresAt_idx`(`releaseId`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Repost` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `message` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Repost_userId_releaseId_key`(`userId`, `releaseId`),
  INDEX `Repost_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FanScore` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `score` INTEGER NOT NULL DEFAULT 0,
  `streams` INTEGER NOT NULL DEFAULT 0,
  `purchases` INTEGER NOT NULL DEFAULT 0,
  `reposts` INTEGER NOT NULL DEFAULT 0,
  `comments` INTEGER NOT NULL DEFAULT 0,
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `FanScore_userId_artistId_key`(`userId`, `artistId`),
  INDEX `FanScore_artistId_score_idx`(`artistId`, `score`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PromotionCampaign` (
  `id` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NULL,
  `promotionType` ENUM('HOMEPAGE_FEATURE', 'FOLLOWER_PUSH', 'DISCOVERY_BOOST') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `budgetCents` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
  `startAt` DATETIME(3) NULL,
  `endAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `PromotionCampaign_artistId_status_createdAt_idx`(`artistId`, `status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AiTaggingJob` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `requestedBy` VARCHAR(191) NOT NULL,
  `status` ENUM('QUEUED', 'PROCESSING', 'DONE', 'FAILED') NOT NULL DEFAULT 'QUEUED',
  `result` JSON NULL,
  `errorMessage` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `AiTaggingJob_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `AiTaggingJob_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LeakFingerprint` (
  `id` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `fingerprintHash` VARCHAR(191) NOT NULL,
  `watermarkRef` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `LeakFingerprint_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
  INDEX `LeakFingerprint_fingerprintHash_idx`(`fingerprintHash`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Playlist`
  ADD CONSTRAINT `Playlist_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PlaylistTrack`
  ADD CONSTRAINT `PlaylistTrack_playlistId_fkey`
    FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PlaylistTrack_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ReleaseCollaborator`
  ADD CONSTRAINT `ReleaseCollaborator_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ReleaseCollaborator_artistId_fkey`
    FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PrivateListeningLink`
  ADD CONSTRAINT `PrivateListeningLink_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PrivateListeningLink_creatorId_fkey`
    FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Repost`
  ADD CONSTRAINT `Repost_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Repost_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `FanScore`
  ADD CONSTRAINT `FanScore_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FanScore_artistId_fkey`
    FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PromotionCampaign`
  ADD CONSTRAINT `PromotionCampaign_artistId_fkey`
    FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PromotionCampaign_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AiTaggingJob`
  ADD CONSTRAINT `AiTaggingJob_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `AiTaggingJob_requestedBy_fkey`
    FOREIGN KEY (`requestedBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LeakFingerprint`
  ADD CONSTRAINT `LeakFingerprint_releaseId_fkey`
    FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LeakFingerprint_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
