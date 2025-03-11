-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "prescriberId" TEXT;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_prescriberId_fkey" FOREIGN KEY ("prescriberId") REFERENCES "Prescriber"("id") ON DELETE SET NULL ON UPDATE CASCADE; 