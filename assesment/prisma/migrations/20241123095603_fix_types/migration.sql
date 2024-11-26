/*
  Warnings:

  - You are about to alter the column `cost` on the `Trips` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `duration` on the `Trips` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Trips" ALTER COLUMN "cost" SET DATA TYPE INTEGER,
ALTER COLUMN "duration" SET DATA TYPE INTEGER;
