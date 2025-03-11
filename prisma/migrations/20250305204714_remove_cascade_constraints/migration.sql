-- DropForeignKey
ALTER TABLE "CatalogCategory" DROP CONSTRAINT "CatalogCategory_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogMaterial" DROP CONSTRAINT "CatalogMaterial_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogProduct" DROP CONSTRAINT "CatalogProduct_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogProduct" DROP CONSTRAINT "CatalogProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogService" DROP CONSTRAINT "CatalogService_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogService" ADD CONSTRAINT "CatalogService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogMaterial" ADD CONSTRAINT "CatalogMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "CatalogService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
