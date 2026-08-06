-- AlterEnum
BEGIN;
CREATE TYPE "PapelGestor_new" AS ENUM ('BACKOFFICE');
ALTER TABLE "usuarios" ALTER COLUMN "papel" TYPE "PapelGestor_new" USING ("papel"::text::"PapelGestor_new");
ALTER TYPE "PapelGestor" RENAME TO "PapelGestor_old";
ALTER TYPE "PapelGestor_new" RENAME TO "PapelGestor";
DROP TYPE "public"."PapelGestor_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoUsuario_new" AS ENUM ('GESTOR', 'ADMIN', 'PARCEIRO', 'COMERCIAL', 'LIDERANCA', 'BACKOFFICE', 'SUPERVISAO', 'GERENCIA', 'CONSULTOR_PF');
ALTER TABLE "usuarios" ALTER COLUMN "tipo" TYPE "TipoUsuario_new" USING ("tipo"::text::"TipoUsuario_new");
ALTER TYPE "TipoUsuario" RENAME TO "TipoUsuario_old";
ALTER TYPE "TipoUsuario_new" RENAME TO "TipoUsuario";
DROP TYPE "public"."TipoUsuario_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "consultas" DROP CONSTRAINT "consultas_cupom_importado_id_fkey";

-- DropForeignKey
ALTER TABLE "consultores" DROP CONSTRAINT "consultores_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "cupons_config" DROP CONSTRAINT "cupons_config_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "cupons_config" DROP CONSTRAINT "cupons_config_estabelecimento_id_fkey";

-- DropForeignKey
ALTER TABLE "cupons_importados" DROP CONSTRAINT "cupons_importados_cupom_config_id_fkey";

-- DropForeignKey
ALTER TABLE "documentos" DROP CONSTRAINT "documentos_estabelecimento_id_fkey";

-- DropForeignKey
ALTER TABLE "estabelecimentos" DROP CONSTRAINT "estabelecimentos_consultor_id_fkey";

-- DropForeignKey
ALTER TABLE "gestores_consultores" DROP CONSTRAINT "gestores_consultores_consultor_id_fkey";

-- DropForeignKey
ALTER TABLE "gestores_consultores" DROP CONSTRAINT "gestores_consultores_gestor_id_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_usuario_estabelecimento_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios_estabelecimentos" DROP CONSTRAINT "usuarios_estabelecimentos_estabelecimento_id_fkey";

-- DropIndex
DROP INDEX "password_reset_tokens_usuario_estabelecimento_id_idx";

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "usuario_estabelecimento_id";

-- DropTable
DROP TABLE "consultas";

-- DropTable
DROP TABLE "consultores";

-- DropTable
DROP TABLE "cupons_config";

-- DropTable
DROP TABLE "cupons_importados";

-- DropTable
DROP TABLE "documentos";

-- DropTable
DROP TABLE "estabelecimentos";

-- DropTable
DROP TABLE "gestores_consultores";

-- DropTable
DROP TABLE "usuarios_estabelecimentos";

-- DropEnum
DROP TYPE "StatusConsulta";

-- DropEnum
DROP TYPE "StatusCupom";

-- DropEnum
DROP TYPE "StatusCupomImportado";

-- DropEnum
DROP TYPE "TipoAcessoEstabelecimento";

-- DropEnum
DROP TYPE "TipoDocumento";

-- DropEnum
DROP TYPE "TipoPix";

