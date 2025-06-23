/*
  Warnings:

  - You are about to drop the column `dateTx` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `transactionDate` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `dateTx`,
    ADD COLUMN `transactionDate` DATETIME(3) NOT NULL;
