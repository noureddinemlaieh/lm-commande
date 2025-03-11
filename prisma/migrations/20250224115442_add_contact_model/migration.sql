/*
  Warnings:

  - You are about to drop the column `clientAddress` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `clientEmail` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `clientPhone` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `Devis` table. All the data in the column will be lost.
  - You are about to drop the column `selectedCatalogue` on the `Devis` table. All the data in the column will be lost.
  - The `status` column on the `Devis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[reference]` on the table `Devis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[year,number]` on the table `Devis` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Devis` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `DevisStatusHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "clientAddress",
DROP COLUMN "clientEmail",
DROP COLUMN "clientName",
DROP COLUMN "clientPhone",
DROP COLUMN "numero",
DROP COLUMN "selectedCatalogue",
ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "DevisStatusHistory" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Contact" (
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

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devis_reference_key" ON "Devis"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_year_number_key" ON "Devis"("year", "number");
