-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "devisComments" TEXT,
ADD COLUMN     "orderFormComments" TEXT,
ADD COLUMN     "showDevisComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOrderFormComments" BOOLEAN NOT NULL DEFAULT true;
