-- A-11: invariantes de competência e não sobreposição de ciclos.
-- Os checks são adicionados como NOT VALID para não bloquear a implantação por
-- dados históricos; novas inserções e alterações passam a ser validadas.

ALTER TABLE "metas_equipe"
  ADD CONSTRAINT "metas_equipe_mes_referencia_format_chk"
  CHECK ("mes_referencia" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
  NOT VALID;

ALTER TABLE "metas_consultores_pf"
  ADD CONSTRAINT "metas_consultores_pf_mes_referencia_format_chk"
  CHECK ("mes_referencia" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
  NOT VALID;

ALTER TABLE "comissoes_equipe"
  ADD CONSTRAINT "comissoes_equipe_mes_referencia_format_chk"
  CHECK ("mes_referencia" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
  NOT VALID;

ALTER TABLE "uploads_planilha_backoffice"
  ADD CONSTRAINT "uploads_planilha_mes_referencia_format_chk"
  CHECK ("mes_referencia" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
  NOT VALID;

ALTER TABLE "ranking_snapshots"
  ADD CONSTRAINT "ranking_snapshots_referencia_mes_format_chk"
  CHECK ("referencia_mes" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
  NOT VALID;

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ciclos_pontos" a
    JOIN "ciclos_pontos" b
      ON a.id < b.id
     AND a.backoffice_id = b.backoffice_id
     AND tsrange(a.inicio_acumulo_em, a.fim_acumulo_em, '[]')
         && tsrange(b.inicio_acumulo_em, b.fim_acumulo_em, '[]')
  ) THEN
    RAISE EXCEPTION
      'A-11: existem ciclos de pontos sobrepostos por backoffice; corrija os dados antes de aplicar a constraint';
  END IF;
END $$;

ALTER TABLE "ciclos_pontos"
  ADD CONSTRAINT "ciclos_pontos_backoffice_periodo_excl"
  EXCLUDE USING gist (
    "backoffice_id" WITH =,
    tsrange("inicio_acumulo_em", "fim_acumulo_em", '[]') WITH &&
  );
