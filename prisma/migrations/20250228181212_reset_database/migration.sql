/*
  Warnings:

  - Made the column `contactId` on table `Devis` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Devis" DROP CONSTRAINT "Devis_contactId_fkey";

-- DropIndex
DROP INDEX "Devis_year_number_key";

-- AlterTable
ALTER TABLE "Devis" ALTER COLUMN "contactId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "materialsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devisId" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'm²',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryName" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unité',
    "reference" TEXT,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
