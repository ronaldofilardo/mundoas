import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

const component = read("app", "(dashboard)", "backoffice", "pontos", "components", "premios-pontos.tsx");
const premiosRoute = read("app", "api", "v1", "backoffice", "pontos", "premios", "route.ts");
const parceiroResgateRoute = read("app", "api", "v1", "parceiro", "pontos", "resgates", "route.ts");
const consultorResgateRoute = read("app", "api", "v1", "consultor", "bonus", "resgates", "route.ts");
const backofficeResgatesRoute = read("app", "api", "v1", "backoffice", "pontos", "resgates", "route.ts");
const approvalRoute = read("app", "api", "v1", "backoffice", "pontos", "resgates", "[id]", "route.ts");
const migration = read("..", "..", "packages", "database", "prisma", "migrations", "20260827130000_add_delivery_deadline_to_prizes", "migration.sql");

describe("Prêmios de Indicação — prazo de entrega", () => {
  it("exibe o campo inteiro em dias e o layout de cadastro da referência", () => {
    expect(component).toContain('id="premio-prazo-entrega"');
    expect(component).toContain('type="number"');
    expect(component).toContain('min="0"');
    expect(component).toContain("Prazo de entrega");
    expect(component).toContain("Após a aprovação do resgate");
    expect(component).toContain("xl:grid-cols-4");
    expect(component).toContain('aria-labelledby="premios-title"');
  });

  it("valida, persiste e retorna prazoEntregaDias na API de prêmios", () => {
    expect(premiosRoute).toContain("prazoEntregaDias: z.number().int().min(0");
    expect(premiosRoute).toContain("prazoEntregaDias: p.prazoEntregaDias");
    expect(premiosRoute).toContain("prazoEntregaDias,");
    expect(premiosRoute).toContain("prazoEntregaDias: validation.data.prazoEntregaDias");
  });

  it("congela o prazo no momento da solicitação para parceiro e Consultor PF", () => {
    expect(parceiroResgateRoute).toContain("prazoEntregaDias: premio.prazoEntregaDias");
    expect(consultorResgateRoute).toContain("prazoEntregaDias: premio.prazoEntregaDias");
  });

  it("calcula a data limite somente após aprovação e a expõe na fila", () => {
    expect(backofficeResgatesRoute).toContain("prazoEntregaAte");
    expect(backofficeResgatesRoute).toContain("const prazoEntregaDias = r.prazoEntregaDias > 0 ? r.prazoEntregaDias : r.premio.prazoEntregaDias");
    expect(backofficeResgatesRoute).toContain("r.processadoEm.getTime() + prazoEntregaDias * 86400000");
    expect(approvalRoute).toContain("prazoEntregaAte");
    expect(approvalRoute).toContain("updatedResgate.processadoEm.getTime() + updatedResgate.prazoEntregaDias * 86400000");
  });

  it("aplica migration incremental sem remover dados existentes", () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "prazo_entrega_dias" INTEGER NOT NULL DEFAULT 0');
    expect(migration).toContain('UPDATE "solicitacoes_resgate" AS sr');
    expect(migration).toContain("prazo_entrega_dias_check");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
  });
});
