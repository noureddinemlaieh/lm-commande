/*
  Warnings:

  - You are about to drop the column `contactId` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `contactId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[reference]` on the table `Devis` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_prescriberId_fkey";

-- DropForeignKey
ALTER TABLE "Devis" DROP CONSTRAINT "Devis_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_contactId_fkey";

-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "contactId",
ADD COLUMN     "clientId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DevisService" ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "contactId",
ADD COLUMN     "clientId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Contact";

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prescriberId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devis_reference_key" ON "Devis"("reference");

-- CreateIndex
CREATE INDEX "Devis_status_idx" ON "Devis"("status");

-- CreateIndex
CREATE INDEX "Devis_clientId_idx" ON "Devis"("clientId");

-- CreateIndex
CREATE INDEX "Devis_catalogId_idx" ON "Devis"("catalogId");

-- CreateIndex
CREATE INDEX "Devis_year_idx" ON "Devis"("year");

-- CreateIndex
CREATE INDEX "DevisMaterial_serviceId_idx" ON "DevisMaterial"("serviceId");

-- CreateIndex
CREATE INDEX "DevisMaterial_reference_idx" ON "DevisMaterial"("reference");

-- CreateIndex
CREATE INDEX "DevisSection_devisId_idx" ON "DevisSection"("devisId");

-- CreateIndex
CREATE INDEX "DevisSection_category_idx" ON "DevisSection"("category");

-- CreateIndex
CREATE INDEX "DevisService_sectionId_idx" ON "DevisService"("sectionId");

-- CreateIndex
CREATE INDEX "DevisService_category_idx" ON "DevisService"("category");

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_prescriberId_fkey" FOREIGN KEY ("prescriberId") REFERENCES "Prescriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
