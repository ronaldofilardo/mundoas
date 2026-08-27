-- A janela de resgate começa no primeiro dia do ciclo.
-- Compatibilidade: ciclos antigos sem início de resgate recebem o início do acúmulo.
UPDATE "ciclos_pontos"
SET "inicio_resgate_em" = "inicio_acumulo_em"
WHERE "inicio_resgate_em" IS NULL
   OR "inicio_resgate_em" <> "inicio_acumulo_em";

ALTER TABLE "ciclos_pontos"
  ALTER COLUMN "inicio_resgate_em" SET NOT NULL;

-- O período de resgate pode se sobrepor ao período de acúmulo.
-- A única restrição temporal necessária continua sendo:
-- inicio_acumulo_em < fim_acumulo_em < fim_resgate_em.
