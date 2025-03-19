/*
  Warnings:

  - You are about to drop the column `billable` on the `DevisMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `DevisMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `DevisMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `tva` on the `DevisMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `DevisService` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `DevisService` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `DevisService` table. All the data in the column will be lost.
  - Made the column `unit` on table `DevisMaterial` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `catalogId` to the `DevisService` table without a default value. This is not possible if the table is not empty.
  - Made the column `unit` on table `DevisService` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit` on table `DevisTemplateMaterial` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit` on table `DevisTemplateService` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DevisTemplateMaterial" DROP CONSTRAINT "DevisTemplateMaterial_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "DevisTemplateSection" DROP CONSTRAINT "DevisTemplateSection_templateId_fkey";

-- DropForeignKey
ALTER TABLE "DevisTemplateService" DROP CONSTRAINT "DevisTemplateService_sectionId_fkey";

-- AlterTable
ALTER TABLE "DevisMaterial" DROP COLUMN "billable",
DROP COLUMN "description",
DROP COLUMN "order",
DROP COLUMN "tva",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" SET DEFAULT 'm²';

-- AlterTable
ALTER TABLE "DevisService" DROP COLUMN "category",
DROP COLUMN "order",
DROP COLUMN "quantity",
ADD COLUMN     "catalogId" TEXT NOT NULL,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" SET DEFAULT 'm²';

-- AlterTable
ALTER TABLE "DevisTemplateMaterial" ADD COLUMN     "reference" TEXT,
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" SET DEFAULT 'm²';

-- AlterTable
ALTER TABLE "DevisTemplateService" ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" SET DEFAULT 'm²';

-- AddForeignKey
ALTER TABLE "DevisTemplateSection" ADD CONSTRAINT "DevisTemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DevisTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisTemplateService" ADD CONSTRAINT "DevisTemplateService_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DevisTemplateSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisTemplateMaterial" ADD CONSTRAINT "DevisTemplateMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DevisTemplateService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
