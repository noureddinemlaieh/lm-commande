-- CreateTable
CREATE TABLE "Prestation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Prestation_pkey" PRIMARY KEY ("id")
);
