import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizarNomeUnidade } from "@/lib/formatadores-producao";

const appRoot = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(appRoot, ...parts), "utf8");
const producaoPage = read("app", "(dashboard)", "backoffice", "producao", "page.tsx");
const rankingRoute = read("app", "api", "v1", "backoffice", "pontos", "ranking", "route.ts");
const rankingComponent = read("app", "(dashboard)", "backoffice", "pontos", "components", "ranking-pontos.tsx");
const rankingTypes = read("app", "(dashboard)", "backoffice", "pontos", "pontos-types.ts");

describe("Lista de Produção — nome de unidade", () => {
  it("remove o prefixo Acesso Saúde sem alterar o nome da cidade", () => {
    expect(normalizarNomeUnidade("Acesso Saúde Curitiba")).toBe("Curitiba");
    expect(normalizarNomeUnidade("Acesso Saúde Colombo")).toBe("Colombo");
  });

  it("preserva unidades sem o prefixo e trata valor vazio", () => {
    expect(normalizarNomeUnidade("Curitiba")).toBe("Curitiba");
    expect(normalizarNomeUnidade("Acesso Saúde")).toBe("Acesso Saúde");
    expect(normalizarNomeUnidade(null)).toBe("-");
    expect(producaoPage).toContain("normalizarNomeUnidade(p.unidade)");
  });
});

describe("Indicação > Ranking — valor monetário dos pontos", () => {
  it("calcula o valor em reais usando a configuração vigente", () => {
    const pontos = 125;
    const valorPorPonto = 0.5;
    expect(pontos * valorPorPonto).toBe(62.5);
    expect(rankingRoute).toContain("configuracaoVigente");
    expect(rankingRoute).toContain("valorPontos: pontos * valorPorPonto");
  });

  it("expõe e renderiza o valor da pontuação, não o total de produção", () => {
    expect(rankingTypes).toContain("valorPontos?: number | string | null;");
    expect(rankingTypes).toContain("valorPorPonto?: number | string | null;");
    expect(rankingComponent).toContain("Valor dos pontos (R$)");
    expect(rankingComponent).toContain("pos.valorPontos");
    expect(rankingComponent).not.toContain(">Produção (R$)<");
  });
});
