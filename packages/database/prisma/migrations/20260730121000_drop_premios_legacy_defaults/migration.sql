-- Drop legacy defaults from premios columns to align with schema.prisma
ALTER TABLE "premios" ALTER COLUMN "backoffice_id" DROP DEFAULT;
ALTER TABLE "premios" ALTER COLUMN "codigo" DROP DEFAULT;
ALTER TABLE "premios" ALTER COLUMN "tipo" DROP DEFAULT;
