-- Permite funções cadastradas dinamicamente nas regras comerciais e de gestores.
-- Os valores legados do enum são preservados como texto durante a conversão.
ALTER TABLE "equipe"
  ALTER COLUMN "funcao" TYPE TEXT
  USING "funcao"::text;

DROP TYPE IF EXISTS "FuncaoComercial";

-- Não há dados sendo removidos nesta migration.

