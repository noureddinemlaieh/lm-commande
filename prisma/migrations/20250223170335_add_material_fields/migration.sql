-- AlterTable
ALTER TABLE "CatalogMaterial" ADD COLUMN     "reference" TEXT,
ADD COLUMN     "toChoose" BOOLEAN NOT NULL DEFAULT false;
