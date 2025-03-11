/*
  Warnings:

  - Changed the type of `category` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "category" "ProductCategory" NOT NULL;

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "selectedCatalogue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisSection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "materialsTotal" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "devisId" TEXT NOT NULL,

    CONSTRAINT "DevisSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisPrestation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "DevisPrestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisMaterial" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisMaterial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DevisSection" ADD CONSTRAINT "DevisSection_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisPrestation" ADD CONSTRAINT "DevisPrestation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DevisSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
