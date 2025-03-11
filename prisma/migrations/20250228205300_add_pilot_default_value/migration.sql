/*
  Warnings:

  - You are about to drop the column `globalMaterialTVA` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `globalServiceTVA` on the `Devis` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Devis" DROP CONSTRAINT "Devis_catalogId_fkey";

-- DropIndex
DROP INDEX "Devis_reference_key";

-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "globalMaterialTVA",
DROP COLUMN "globalServiceTVA",
ADD COLUMN     "pilot" TEXT NOT NULL DEFAULT 'Noureddine MLAIEH',
ALTER COLUMN "catalogId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
