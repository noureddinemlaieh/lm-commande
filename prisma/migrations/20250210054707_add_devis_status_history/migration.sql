-- CreateTable
CREATE TABLE "DevisStatusHistory" (
    "id" SERIAL NOT NULL,
    "devisId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,

    CONSTRAINT "DevisStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DevisStatusHistory" ADD CONSTRAINT "DevisStatusHistory_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
