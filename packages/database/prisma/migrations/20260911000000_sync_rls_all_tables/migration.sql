-- ============================================================================
-- Migration: Synchronize Row Level Security (RLS) across all tables
-- Date: 2026-09-11
--
-- Defense in Depth:
--   1. Ensures application role (asa_app) has DML permissions.
--   2. Enables Row-Level Security (RLS) on all active domain tables.
--   3. Applies asa_app_full_access policy to all tables for defense-in-depth,
--      with tenant isolation enforced by RBAC application layer.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'asa_app'
  ) THEN
    CREATE ROLE asa_app WITH LOGIN PASSWORD 'CHANGE_ME_BEFORE_USE'
      NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO asa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO asa_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO asa_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO asa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO asa_app;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'usuarios',
    'backoffices',
    'assinaturas',
    'faturas_asaas',
    'asaas_webhook_events',
    'equipe',
    'gestores',
    'consultores',
    'consultores_pf',
    'consultor_pf_setores',
    'comissoes_consultor_pf',
    'comissoes_equipe',
    'procedimentos_pf',
    'setores',
    'parceiros',
    'indicados',
    'metas_equipe',
    'metas_consultores_pf',
    'ciclos_pontos',
    'configuracoes_pontos',
    'configuracoes_bonus',
    'movimentacoes_pontos',
    'premios',
    'solicitacoes_resgate',
    'ranking_posicoes',
    'ranking_posicoes_consultores_pf',
    'ranking_snapshots',
    'ranking_snapshots_consultores_pf',
    'regras_comerciais',
    'regras_comerciais_itens',
    'regras_comerciais_versoes',
    'regras_faltas',
    'regras_faltas_itens',
    'regras_gestores',
    'regras_gestores_itens',
    'regras_gestores_versoes',
    'uploads_planilha_backoffice',
    'audit_logs',
    'gestores_consultores'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('DROP POLICY IF EXISTS asa_app_full_access ON %I;', t);
      EXECUTE format(
        'CREATE POLICY asa_app_full_access ON %I AS PERMISSIVE FOR ALL TO asa_app USING (true) WITH CHECK (true);',
        t
      );
    END IF;
  END LOOP;
END
$$;
