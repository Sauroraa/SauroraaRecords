-- Add missing columns to Artist and Release tables

-- Add bannerUrl column to Artist
ALTER TABLE `Artist`
  ADD COLUMN `bannerUrl` VARCHAR(191) NULL;

-- Add musicalKey column to Release
ALTER TABLE `Release`
  ADD COLUMN `musicalKey` VARCHAR(191) NULL;
