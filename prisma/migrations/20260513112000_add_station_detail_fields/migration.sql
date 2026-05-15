ALTER TABLE `Station`
    ADD COLUMN `highlight` VARCHAR(191) NULL,
    ADD COLUMN `ambience` TEXT NULL,
    ADD COLUMN `practicalInfo` JSON NULL,
    ADD COLUMN `nearbyHighlights` JSON NULL;
