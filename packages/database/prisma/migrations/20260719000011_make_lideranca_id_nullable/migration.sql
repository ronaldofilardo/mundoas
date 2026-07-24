-- AlterTable
ALTER TABLE "comerciais" ALTER COLUMN "lideranca_id" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "comerciais" DROP CONSTRAINT IF EXISTS "comerciais_lideranca_id_fkey";

-- AddForeignKey
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE SET NULL ON UPDATE CASCADE;