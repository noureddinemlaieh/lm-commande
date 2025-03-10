-- CreateTable
CREATE TABLE "Devis" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisStatusHistory" (
    "id" SERIAL NOT NULL,
    "devisId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,

    CONSTRAINT "DevisStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisSequence" (
    "id" SERIAL NOT NULL,
    "lastNum" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DevisSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");

-- AddForeignKey
ALTER TABLE "DevisStatusHistory" ADD CONSTRAINT "DevisStatusHistory_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
