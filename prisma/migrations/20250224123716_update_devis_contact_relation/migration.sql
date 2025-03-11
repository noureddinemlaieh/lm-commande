-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "contactId" TEXT;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
