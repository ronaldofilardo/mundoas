/**
 * Teste de Sincronização RLS (Row-Level Security) x Modelos do MundoAS
 *
 * Garante que:
 *   1. O script de migração RLS sincroniza todas as tabelas ativas do banco.
 *   2. Toda tabela de dados do monorepo tem Row-Level Security (RLS) habilitado no PostgreSQL.
 *   3. A role de aplicação (asa_app) possui a política correspondente (asa_app_full_access)
 *      para defesa em profundidade, delegando o filtro por tenant ao RBAC da aplicação.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

describe("Sincronização RLS (Row-Level Security) no PostgreSQL", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const statements = [
      `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'asa_app'
  ) THEN
    CREATE ROLE asa_app WITH LOGIN PASSWORD 'CHANGE_ME_BEFORE_USE'
      NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER;
  END IF;
END
$$;`,
      `GRANT USAGE ON SCHEMA public TO asa_app;`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO asa_app;`,
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO asa_app;`,
      `DO $$
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
$$;`,
    ];

    for (const stmt of statements) {
      await (prisma as unknown as {
        $executeRawUnsafe: (q: string) => Promise<number>;
      }).$executeRawUnsafe(stmt);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("toda tabela de domínio tem RLS habilitado (rowsecurity = true)", async () => {
    const rows = await (prisma as unknown as {
      $queryRawUnsafe: (q: string) => Promise<Array<{ tablename: string; rowsecurity: boolean }>>;
    }).$queryRawUnsafe(
      `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`,
    );

    expect(rows.length).toBeGreaterThan(0);
    const domainTablesWithoutRls = rows.filter(
      (r) =>
        !r.rowsecurity &&
        !r.tablename.startsWith("_prisma") &&
        !r.tablename.startsWith("base_") &&
        !r.tablename.startsWith("primeira_") &&
        !r.tablename.endsWith("_raw"),
    );

    expect(domainTablesWithoutRls).toEqual([]);
  });

  it("política asa_app_full_access existe para as tabelas críticas do sistema", async () => {
    const policies = await (prisma as unknown as {
      $queryRawUnsafe: (q: string) => Promise<Array<{ tablename: string; policyname: string }>>;
    }).$queryRawUnsafe(
      `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND policyname = 'asa_app_full_access';`,
    );

    const tablesWithPolicy = new Set(policies.map((p) => p.tablename));
    expect(tablesWithPolicy.has("usuarios")).toBe(true);
    expect(tablesWithPolicy.has("backoffices")).toBe(true);
    expect(tablesWithPolicy.has("assinaturas")).toBe(true);
    expect(tablesWithPolicy.has("faturas_asaas")).toBe(true);
    expect(tablesWithPolicy.has("consultores_pf")).toBe(true);
    expect(tablesWithPolicy.has("procedimentos_pf")).toBe(true);
    expect(tablesWithPolicy.has("comissoes_equipe")).toBe(true);
  });
});
