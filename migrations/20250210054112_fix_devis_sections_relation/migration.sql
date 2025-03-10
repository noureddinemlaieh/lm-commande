-- CreateTable
CREATE TABLE "DevisSection" (
    "id" SERIAL NOT NULL,
    "devisId" INTEGER NOT NULL,

    CONSTRAINT "DevisSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisPrestation" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "DevisPrestation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DevisSection" ADD CONSTRAINT "DevisSection_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisPrestation" ADD CONSTRAINT "DevisPrestation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DevisSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
