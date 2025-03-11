/*
  Warnings:

  - The `status` column on the `Devis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DevisMaterial` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `devisId` on the `DevisMaterial` table. All the data in the column will be lost.
  - The primary key for the `DevisSection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DevisStatusHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DevisPrestation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceMaterial` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `DevisMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `DevisMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `DevisMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `DevisMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `DevisSection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DevisSection` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `DevisStatusHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DevisStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "DevisMaterial" DROP CONSTRAINT "DevisMaterial_devisId_fkey";

-- DropForeignKey
ALTER TABLE "DevisPrestation" DROP CONSTRAINT "DevisPrestation_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_productId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_productId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceMaterial" DROP CONSTRAINT "ServiceMaterial_productId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceMaterial" DROP CONSTRAINT "ServiceMaterial_serviceId_fkey";

-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "status",
ADD COLUMN     "status" "DevisStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "DevisMaterial" DROP CONSTRAINT "DevisMaterial_pkey",
DROP COLUMN "devisId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "serviceId" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DevisMaterial_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DevisMaterial_id_seq";

-- AlterTable
ALTER TABLE "DevisSection" DROP CONSTRAINT "DevisSection_pkey",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DevisSection_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DevisSection_id_seq";

-- AlterTable
ALTER TABLE "DevisStatusHistory" DROP CONSTRAINT "DevisStatusHistory_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "DevisStatus" NOT NULL,
ADD CONSTRAINT "DevisStatusHistory_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DevisStatusHistory_id_seq";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "DevisPrestation";

-- DropTable
DROP TABLE "Material";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "ServiceMaterial";

-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sectionId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisService_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogService" ADD CONSTRAINT "CatalogService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogMaterial" ADD CONSTRAINT "CatalogMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "CatalogService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisCategory" ADD CONSTRAINT "DevisCategory_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "DevisCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisSection" ADD CONSTRAINT "DevisSection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DevisCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisService" ADD CONSTRAINT "DevisService_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DevisSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisMaterial" ADD CONSTRAINT "DevisMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DevisService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
