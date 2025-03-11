-- CreateTable
CREATE TABLE "RetentionGuarantee" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionGuarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionRelease" (
    "id" TEXT NOT NULL,
    "retentionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetentionGuarantee_invoiceId_key" ON "RetentionGuarantee"("invoiceId");

-- AddForeignKey
ALTER TABLE "RetentionGuarantee" ADD CONSTRAINT "RetentionGuarantee_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionRelease" ADD CONSTRAINT "RetentionRelease_retentionId_fkey" FOREIGN KEY ("retentionId") REFERENCES "RetentionGuarantee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
