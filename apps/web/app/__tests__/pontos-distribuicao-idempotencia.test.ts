import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");
const singleRoute = read("app", "api", "v1", "backoffice", "pontos", "distribuir", "route.ts");
const batchRoute = read("app", "api", "v1", "backoffice", "pontos", "distribuir-todos", "route.ts");
const bonusRoute = read("app", "api", "v1", "backoffice", "pontos", "bonus", "distribuir", "route.ts");
const migration = read("../../packages", "database", "prisma", "migrations", "20260821000000_hardening_parceiros_pontos", "migration.sql");

describe("Idempotência persistente da distribuição de pontos", () => {
  it("possui constraint única no banco para um crédito por produção", () => {
    expect(migration).toContain('"mov_pontos_credito_producao_unq"');
    expect(migration).toContain('"referencia_procedimento_id", "origem", "tipo"');
    expect(migration).toContain('"origem" = \'PRODUCAO_IMPORTADA\'');
    expect(migration).toContain('"tipo" = \'CREDITO\'');
  });

  it("faz a checagem global antes de distribuir individualmente", () => {
    expect(singleRoute).toContain('referenciaProcedimentoId: producao.id');
    expect(singleRoute).toContain('origem: "PRODUCAO_IMPORTADA"');
    expect(singleRoute).toContain('tipo: "CREDITO"');
    expect(singleRoute).toContain("isUniqueViolation");
    expect(singleRoute).toContain("Pontos já foram distribuídos para esta produção");
  });

  it("faz a checagem global e trata corrida no lote", () => {
    expect(batchRoute).toContain("referenciaProcedimentoId: { in: producoes.map((p) => p.id) }");
    expect(batchRoute).toContain('tipo: "CREDITO"');
    expect(batchRoute).toContain("ignorados");
    expect(batchRoute).toContain("Outra requisição ganhou a corrida");
  });

  it("mantém a trava também no Bônus PF", () => {
    expect(bonusRoute).toContain("isUniqueViolation");
    expect(bonusRoute).toContain("já receberam pontos e não podem ser distribuídas novamente");
  });
});
