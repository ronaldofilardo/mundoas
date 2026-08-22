-- Migration corretiva: alinhamento do banco com o schema.prisma.
--
-- Items corrigidos:
--   1. comerciais.backoffice_id: NOT NULL -> NULL (schema declara String?)
--   2. parceiros.backoffice_id: NOT NULL -> NULL (schema declara String?)
--   3. comerciais.lideranca_id: ON DELETE SET NULL -> RESTRICT (schema declara Restrict)
--   4. documentos.estabelecimento_id: ON DELETE RESTRICT -> CASCADE (schema declara Cascade)
--
-- Itens NAO corrigidos (drift puramente operacional, nao quebram a aplicacao):
--   - Defaults removidos de varias colunas (backoffices.updated_at,
--     ciclos_pontos.backoffice_id, configuracoes_pontos.backoffice_id,
--     consultores_pf.atualizado_em, metas_*.updated_at, setores.atualizado_em,
--     uploads_planilha_backoffice.backoffice_id): o Prisma envia valores
--     explicitos via @default/@updatedAt, nao depende do default do banco.
--   - TipoUsuario.GESTOR: o cliente Prisma nao usa o enum como restricao em
--     inserts padrao, e nao ha dados usando GESTOR.

BEGIN;

-- 1. comerciais.backoffice_id -> NULL
ALTER TABLE "comerciais" ALTER COLUMN "backoffice_id" DROP NOT NULL;

-- 2. parceiros.backoffice_id -> NULL
ALTER TABLE "parceiros" ALTER COLUMN "backoffice_id" DROP NOT NULL;

-- 3. comerciais.lideranca_id FK -> RESTRICT
ALTER TABLE "comerciais" DROP CONSTRAINT IF EXISTS "comerciais_lideranca_id_fkey";
ALTER TABLE "comerciais" ADD CONSTRAINT "comerciais_lideranca_id_fkey"
  FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. documentos.estabelecimento_id FK -> CASCADE
ALTER TABLE "documentos" DROP CONSTRAINT IF EXISTS "documentos_estabelecimento_id_fkey";
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_estabelecimento_id_fkey"
  FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
