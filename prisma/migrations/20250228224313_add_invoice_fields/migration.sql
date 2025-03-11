/*
  Warnings:

  - Made the column `catalogId` on table `Devis` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Devis" DROP CONSTRAINT "Devis_catalogId_fkey";

-- AlterTable
ALTER TABLE "Devis" ALTER COLUMN "catalogId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contactId" TEXT NOT NULL,
    "devisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentConditions" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "autoliquidation" BOOLEAN NOT NULL DEFAULT false,
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalTVA" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSection" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceMaterial" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "reference" TEXT,
    "tva" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_reference_key" ON "Invoice"("reference");

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSection" ADD CONSTRAINT "InvoiceSection_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "InvoiceSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceMaterial" ADD CONSTRAINT "InvoiceMaterial_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
