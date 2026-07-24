-- AlterTable
ALTER TABLE "parceiros" ADD COLUMN "backoffice_id" UUID;

-- CreateIndex
CREATE INDEX "parceiros_backoffice_id_idx" ON "parceiros"("backoffice_id");

-- Populate
UPDATE "parceiros" SET "backoffice_id" = 'd27a1bcc-e538-4496-8946-39cfc646689f' WHERE "backoffice_id" IS NULL;

-- AlterTable
ALTER TABLE "parceiros" ALTER COLUMN "backoffice_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "parceiros" ADD CONSTRAINT "parceiros_backoffice_id_fkey" FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
