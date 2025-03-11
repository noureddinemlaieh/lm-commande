/*
  Warnings:

  - Added the required column `devisId` to the `DevisMaterial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DevisMaterial" ADD COLUMN     "devisId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "DevisMaterial" ADD CONSTRAINT "DevisMaterial_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
