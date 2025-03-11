/*
  Warnings:

  - Added the required column `catalogId` to the `Devis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "catalogId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
