-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "refKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_refKey_key" ON "documents"("refKey");
