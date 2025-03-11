/*
  Warnings:

  - You are about to drop the column `order` on the `DevisMaterial` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DevisMaterial" DROP CONSTRAINT "DevisMaterial_serviceId_fkey";

-- AlterTable
ALTER TABLE "DevisMaterial" DROP COLUMN "order",
ADD COLUMN     "billable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "DevisMaterial" ADD CONSTRAINT "DevisMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DevisService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
