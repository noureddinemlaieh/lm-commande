/*
  Warnings:

  - You are about to drop the column `categoryId` on the `DevisSection` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DevisSection" DROP CONSTRAINT "DevisSection_categoryId_fkey";

-- AlterTable
ALTER TABLE "DevisSection" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'DEFAULT';
