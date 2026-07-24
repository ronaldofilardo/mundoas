-- AlterTable
ALTER TABLE "comerciais" ADD COLUMN     "backoffice_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "comerciais_backoffice_id_idx" ON "comerciais"("backoffice_id");

-- AddForeignKey
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_backoffice_id_fkey" FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
