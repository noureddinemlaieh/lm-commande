/*
  Warnings:

  - You are about to drop the column `description` on the `DevisCategory` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `DevisCategory` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `DevisMaterial` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `DevisMaterial` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "DevisCategory" DROP COLUMN "description",
DROP COLUMN "order";

-- AlterTable
ALTER TABLE "DevisMaterial" DROP COLUMN "description",
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "DevisService" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'SERVICE',
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "order" DROP DEFAULT;
