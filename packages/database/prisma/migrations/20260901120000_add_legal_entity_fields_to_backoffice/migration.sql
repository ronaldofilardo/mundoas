-- Add legal entity fields to backoffices table for pessoa juridica cadastro
-- Razão Social, CNPJ, endereço [CEP, Logradouro, Número, Complemento, Bairro, Cidade e UF]
-- e telefone serão coletados na criação da nova unidade e armazenados aqui.

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "razao_social" VARCHAR(255);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "cnpj" VARCHAR(20);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "cep" VARCHAR(10);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "logradouro" VARCHAR(255);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "numero" VARCHAR(10);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "complemento" VARCHAR(100);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "bairro" VARCHAR(100);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "cidade" VARCHAR(100);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "uf" VARCHAR(2);

ALTER TABLE "backoffices"
  ADD COLUMN IF NOT EXISTS "telefone" VARCHAR(20);