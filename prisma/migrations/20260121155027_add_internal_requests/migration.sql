-- CreateEnum
CREATE TYPE "InternalCategory" AS ENUM ('INTERNET', 'ELECTRICITY', 'WATER', 'PHONE', 'COFFEE', 'OFFICE_SUPPLIES', 'MAINTENANCE', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "InternalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploadedById_fkey";

-- CreateTable
CREATE TABLE "InternalRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "InternalCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "InternalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "internalRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalApproval" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "internalRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InternalRequestActivityLogs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InternalRequestActivityLogs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalRequest_reference_key" ON "InternalRequest"("reference");

-- CreateIndex
CREATE INDEX "InternalRequest_requestedById_idx" ON "InternalRequest"("requestedById");

-- CreateIndex
CREATE INDEX "InternalRequest_status_idx" ON "InternalRequest"("status");

-- CreateIndex
CREATE INDEX "InternalRequest_category_idx" ON "InternalRequest"("category");

-- CreateIndex
CREATE INDEX "InternalRequest_createdAt_idx" ON "InternalRequest"("createdAt");

-- CreateIndex
CREATE INDEX "InternalDocument_internalRequestId_idx" ON "InternalDocument"("internalRequestId");

-- CreateIndex
CREATE INDEX "InternalDocument_uploadedById_idx" ON "InternalDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "InternalApproval_internalRequestId_idx" ON "InternalApproval"("internalRequestId");

-- CreateIndex
CREATE INDEX "InternalApproval_userId_idx" ON "InternalApproval"("userId");

-- CreateIndex
CREATE INDEX "_InternalRequestActivityLogs_B_index" ON "_InternalRequestActivityLogs"("B");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalRequest" ADD CONSTRAINT "InternalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalDocument" ADD CONSTRAINT "InternalDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalDocument" ADD CONSTRAINT "InternalDocument_internalRequestId_fkey" FOREIGN KEY ("internalRequestId") REFERENCES "InternalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalApproval" ADD CONSTRAINT "InternalApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalApproval" ADD CONSTRAINT "InternalApproval_internalRequestId_fkey" FOREIGN KEY ("internalRequestId") REFERENCES "InternalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InternalRequestActivityLogs" ADD CONSTRAINT "_InternalRequestActivityLogs_A_fkey" FOREIGN KEY ("A") REFERENCES "activity_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InternalRequestActivityLogs" ADD CONSTRAINT "_InternalRequestActivityLogs_B_fkey" FOREIGN KEY ("B") REFERENCES "InternalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
