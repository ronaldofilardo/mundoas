-- Adicionar coluna conteudo_arquivo (binário) e tamanho_arquivo em uploads_planilha_backoffice
ALTER TABLE "uploads_planilha_backoffice" ADD COLUMN "conteudo_arquivo" BYTEA;
ALTER TABLE "uploads_planilha_backoffice" ADD COLUMN "tamanho_arquivo" INTEGER;

-- Criar tabela procedimentos_pf_raw (auditoria de cada linha da planilha)
CREATE TABLE "procedimentos_pf_raw" (
  "id" UUID NOT NULL,
  "upload_id" UUID NOT NULL,
  "linha_original" INTEGER NOT NULL,
  "dados_originais" JSONB NOT NULL,
  "valido" BOOLEAN NOT NULL DEFAULT false,
  "motivo_rejeicao" VARCHAR(500),
  "orfao" BOOLEAN NOT NULL DEFAULT false,
  "motivo_orfao" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "procedimentos_pf_raw_pkey" PRIMARY KEY ("id")
);

-- FK para upload (com CASCADE para limpar linhas_raw quando upload for removido)
ALTER TABLE "procedimentos_pf_raw" ADD CONSTRAINT "procedimentos_pf_raw_upload_id_fkey"
  FOREIGN KEY ("upload_id") REFERENCES "uploads_planilha_backoffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices para consultas frequentes
CREATE INDEX "procedimentos_pf_raw_upload_id_idx" ON "procedimentos_pf_raw"("upload_id");
CREATE INDEX "procedimentos_pf_raw_valido_idx" ON "procedimentos_pf_raw"("valido");
CREATE INDEX "procedimentos_pf_raw_orfao_idx" ON "procedimentos_pf_raw"("orfao");
