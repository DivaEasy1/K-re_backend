-- DropForeignKey
ALTER TABLE `Activity` DROP FOREIGN KEY `Activity_stationId_fkey`;

-- DropIndex
DROP INDEX `Activity_stationId_idx` ON `Activity`;

-- AlterTable
ALTER TABLE `Activity` DROP COLUMN `stationId`;
