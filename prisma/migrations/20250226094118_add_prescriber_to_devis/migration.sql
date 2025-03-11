-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "prescriberId" TEXT;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_prescriberId_fkey" FOREIGN KEY ("prescriberId") REFERENCES "Prescriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
