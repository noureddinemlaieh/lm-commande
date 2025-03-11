/*
  Warnings:

  - A unique constraint covering the columns `[serviceId,productId]` on the table `ServiceMaterial` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ServiceMaterial_serviceId_productId_key" ON "ServiceMaterial"("serviceId", "productId");
