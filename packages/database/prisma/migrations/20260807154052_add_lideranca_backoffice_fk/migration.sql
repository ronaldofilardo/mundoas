-- AddForeignKey: liderancas.backoffice_id -> backoffices(id)
-- Pre-condition cleanup: drop liderancas órfãs (backoffice_id inexistente)
-- e seus dependentes para permitir criação da FK com ON DELETE RESTRICT.
-- Apenas relevante em bancos de teste onde houve drift histórico.

-- Limpa dependentes das liderancas órfãs antes de deletá-las.
DELETE FROM "metas_liderancas"
WHERE "lideranca_id" IN (
  SELECT l.id FROM "liderancas" l
  LEFT JOIN "backoffices" b ON b.id = l.backoffice_id
  WHERE b.id IS NULL
);

DELETE FROM "consultores_pf"
WHERE "lideranca_id" IN (
  SELECT l.id FROM "liderancas" l
  LEFT JOIN "backoffices" b ON b.id = l.backoffice_id
  WHERE b.id IS NULL
);

DELETE FROM "comerciais"
WHERE "lideranca_id" IN (
  SELECT l.id FROM "liderancas" l
  LEFT JOIN "backoffices" b ON b.id = l.backoffice_id
  WHERE b.id IS NULL
);

DELETE FROM "gestores"
WHERE "lideranca_id" IN (
  SELECT l.id FROM "liderancas" l
  LEFT JOIN "backoffices" b ON b.id = l.backoffice_id
  WHERE b.id IS NULL
);

DELETE FROM "liderancas"
WHERE NOT EXISTS (
  SELECT 1 FROM "backoffices" WHERE "backoffices"."id" = "liderancas"."backoffice_id"
);

ALTER TABLE "liderancas" ADD CONSTRAINT "liderancas_backoffice_id_fkey"
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
