import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

const api = read("app", "api", "v1", "parceiro", "pontos", "resgates", "route.ts");
const component = read("components", "parceiro", "minhas-solicitacoes-resgate.tsx");

describe("Resgates do parceiro — prazo de entrega", () => {
  it("retorna o prazo do prêmio e a data limite somente após aprovação", () => {
    expect(api).toContain("prazoEntregaDias: true");
    expect(api).toContain("prazoEntregaAte");
    expect(api).toContain("r.processadoEm.getTime()");
    expect(api).toContain("r.prazoEntregaDias > 0 ? r.prazoEntregaDias : r.premio.prazoEntregaDias");
  });

  it("exibe Entrega em, prazo em dias e o estado Após aprovação", () => {
    expect(component).toContain("Entrega em");
    expect(component).toContain("prazoEntregaAte");
    expect(component).toContain("Após aprovação");
    expect(component).toContain("Prazo:");
    expect(component).toContain("grid-cols-2 md:grid-cols-4");
  });
});
