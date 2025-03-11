/*
  Warnings:

  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "globalMaterialTVA" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN     "globalServiceTVA" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "DevisMaterial" ADD COLUMN     "tva" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "DevisService" ADD COLUMN     "tva" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- DropTable
DROP TABLE "Material";
