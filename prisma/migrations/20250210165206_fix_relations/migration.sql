/*
  Warnings:

  - Added the required column `numero` to the `Devis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "numero" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';
