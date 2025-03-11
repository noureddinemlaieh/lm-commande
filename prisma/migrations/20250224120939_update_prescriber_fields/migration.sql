/*
  Warnings:

  - You are about to drop the column `address` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `Prescriber` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `Prescriber` table. All the data in the column will be lost.
  - Added the required column `nom` to the `Prescriber` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prescriber" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "company",
DROP COLUMN "country",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "phone",
DROP COLUMN "postalCode",
DROP COLUMN "profession",
DROP COLUMN "specialty",
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "cp" TEXT,
ADD COLUMN     "mail1" TEXT,
ADD COLUMN     "mail2" TEXT,
ADD COLUMN     "mail3" TEXT,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "pays" TEXT,
ADD COLUMN     "rue" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "siteweb" TEXT,
ADD COLUMN     "tel" TEXT,
ADD COLUMN     "tel1" TEXT,
ADD COLUMN     "tel2" TEXT,
ADD COLUMN     "tel3" TEXT,
ADD COLUMN     "tva" TEXT,
ADD COLUMN     "ville" TEXT;
