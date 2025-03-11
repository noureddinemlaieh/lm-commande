-- DropForeignKey
ALTER TABLE "CatalogCategory" DROP CONSTRAINT "CatalogCategory_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogMaterial" DROP CONSTRAINT "CatalogMaterial_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogService" DROP CONSTRAINT "CatalogService_categoryId_fkey";

-- AlterTable
ALTER TABLE "Prescriber" ADD COLUMN     "defaultAutoliquidation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultBillToPrescriber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultRetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "requiresRetentionGuarantee" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_catalogId_productId_key" ON "CatalogProduct"("catalogId", "productId");

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogService" ADD CONSTRAINT "CatalogService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogMaterial" ADD CONSTRAINT "CatalogMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "CatalogService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
