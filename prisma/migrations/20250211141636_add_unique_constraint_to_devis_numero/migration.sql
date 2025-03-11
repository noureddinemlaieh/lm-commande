/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Devis` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
