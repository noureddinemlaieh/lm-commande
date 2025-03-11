/*
  Warnings:

  - You are about to drop the `Prestation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Prestation";

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
