/*
  Warnings:

  - You are about to alter the column `quantity` on the `CatalogMaterial` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `contactId` on the `Devis` table. All the data in the column will be lost.
  - The `status` column on the `Devis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `quantity` on the `DevisMaterial` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `autoliquidation` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `billToPrescriber` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `contactId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `hidePrescriber` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentConditions` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `totalTVA` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Invoice` table. All the data in the column will be lost.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentStatus` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `cp` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `pays` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `rue` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `ville` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DevisCatalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DevisCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DevisStatusHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InvoiceItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InvoiceMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InvoiceSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NumberingHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RetentionRelease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sequence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[number]` on the table `Devis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[devisId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalHT` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTTC` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `devisId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `Prescriber` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterEnum
ALTER TYPE "ProductCategory" ADD VALUE 'PRODUCT';

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_prescriberId_fkey";

-- DropForeignKey
ALTER TABLE "Devis" DROP CONSTRAINT "Devis_contactId_fkey";

-- DropForeignKey
ALTER TABLE "DevisCategory" DROP CONSTRAINT "DevisCategory_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "DevisMaterial" DROP CONSTRAINT "DevisMaterial_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "DevisStatusHistory" DROP CONSTRAINT "DevisStatusHistory_devisId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_devisId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceMaterial" DROP CONSTRAINT "InvoiceMaterial_itemId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceSection" DROP CONSTRAINT "InvoiceSection_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "RetentionGuarantee" DROP CONSTRAINT "RetentionGuarantee_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "RetentionRelease" DROP CONSTRAINT "RetentionRelease_retentionId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_devisId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_sectionId_fkey";

-- DropIndex
DROP INDEX "Invoice_reference_key";

-- AlterTable
ALTER TABLE "CatalogMaterial" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "contactId",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "showDescriptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalHT" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalTTC" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
ALTER COLUMN "number" SET DATA TYPE TEXT,
ALTER COLUMN "reference" DROP NOT NULL,
ALTER COLUMN "year" SET DEFAULT 2024,
DROP COLUMN "status",
ADD COLUMN     "status" "DevisStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "pilot" DROP NOT NULL,
ALTER COLUMN "pilot" DROP DEFAULT,
ALTER COLUMN "showDevisComments" SET DEFAULT false,
ALTER COLUMN "showOrderFormComments" SET DEFAULT false;

-- AlterTable
ALTER TABLE "DevisMaterial" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER,
ALTER COLUMN "billable" SET DEFAULT true;

-- AlterTable
ALTER TABLE "DevisSection" ALTER COLUMN "materialsTotal" SET DEFAULT 0,
ALTER COLUMN "subTotal" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "DevisService" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "autoliquidation",
DROP COLUMN "billToPrescriber",
DROP COLUMN "contactId",
DROP COLUMN "hidePrescriber",
DROP COLUMN "invoiceDate",
DROP COLUMN "notes",
DROP COLUMN "paymentConditions",
DROP COLUMN "paymentMethod",
DROP COLUMN "reference",
DROP COLUMN "totalTVA",
DROP COLUMN "year",
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "number" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "devisId" SET NOT NULL,
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Prescriber" DROP COLUMN "cp",
DROP COLUMN "nom",
DROP COLUMN "pays",
DROP COLUMN "rue",
DROP COLUMN "ville",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- DropTable
DROP TABLE "Contact";

-- DropTable
DROP TABLE "DevisCatalog";

-- DropTable
DROP TABLE "DevisCategory";

-- DropTable
DROP TABLE "DevisStatusHistory";

-- DropTable
DROP TABLE "InvoiceItem";

-- DropTable
DROP TABLE "InvoiceMaterial";

-- DropTable
DROP TABLE "InvoiceSection";

-- DropTable
DROP TABLE "Material";

-- DropTable
DROP TABLE "NumberingHistory";

-- DropTable
DROP TABLE "RetentionRelease";

-- DropTable
DROP TABLE "Section";

-- DropTable
DROP TABLE "Sequence";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "Settings";

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
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "company" TEXT,
    "prescriberId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePaymentHistory" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisTemplateSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisTemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisTemplateService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisTemplateService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisTemplateMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisTemplateMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_number_key" ON "Devis"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_devisId_key" ON "Invoice"("devisId");

-- AddForeignKey
ALTER TABLE "DevisMaterial" ADD CONSTRAINT "DevisMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DevisService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_prescriberId_fkey" FOREIGN KEY ("prescriberId") REFERENCES "Prescriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePaymentHistory" ADD CONSTRAINT "InvoicePaymentHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionGuarantee" ADD CONSTRAINT "RetentionGuarantee_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisTemplateSection" ADD CONSTRAINT "DevisTemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DevisTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisTemplateService" ADD CONSTRAINT "DevisTemplateService_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DevisTemplateSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisTemplateMaterial" ADD CONSTRAINT "DevisTemplateMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DevisTemplateService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
