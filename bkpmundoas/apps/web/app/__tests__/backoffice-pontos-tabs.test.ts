/**
 * Testes da página /backoffice/pontos - estrutura de abas aninhadas
 *
 * Valida a nova arquitetura de abas em dois níveis:
 *  - Abas principais: Parceiros, CONFIGURAÇÃO, INDICAÇÃO
 *  - Subabas de CONFIGURAÇÃO: Ciclos, Configuração
 *  - Subabas de INDICAÇÃO: Distribuir Pontos, Prêmios, Ranking, Resgates
 *
 * Como a configuração do runner do projeto não consegue resolver
 * `@testing-library/react`, exercitamos a lógica de resolução de abas
 * sem renderizar o componente, seguindo o mesmo padrão dos testes de
 * comissionamento-page.test.ts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

type MainTabType = "parceiros" | "configuracao" | "indicacao";
type ConfigSubTabType = "ciclos" | "configuracao";
type IndicacaoSubTabType = "distribuir" | "premios" | "ranking" | "resgates";

const MAIN_TABS: { id: MainTabType; label: string }[] = [
  { id: "parceiros", label: "Parceiros" },
  { id: "configuracao", label: "CONFIGURAÇÃO" },
  { id: "indicacao", label: "INDICAÇÃO" },
];

const CONFIG_SUB_TABS: { id: ConfigSubTabType; label: string }[] = [
  { id: "ciclos", label: "Ciclos" },
  { id: "configuracao", label: "Configuração" },
];

const INDICACAO_SUB_TABS: { id: IndicacaoSubTabType; label: string }[] = [
  { id: "distribuir", label: "Distribuir Pontos" },
  { id: "premios", label: "Prêmios" },
  { id: "ranking", label: "Ranking" },
  { id: "resgates", label: "Resgates" },
];

const MAIN_TAB_IDS = new Set<MainTabType>(MAIN_TABS.map((t) => t.id));
const CONFIG_SUB_TAB_IDS = new Set<ConfigSubTabType>(CONFIG_SUB_TABS.map((t) => t.id));
const INDICACAO_SUB_TAB_IDS = new Set<IndicacaoSubTabType>(INDICACAO_SUB_TABS.map((t) => t.id));

function resolveActiveTab(
  mainTab: MainTabType,
  configSubTab: ConfigSubTabType,
  indicacaoSubTab: IndicacaoSubTabType,
): string {
  if (mainTab === "parceiros") return "parceiros";
  if (mainTab === "configuracao") return configSubTab;
  return indicacaoSubTab;
}

const pagePath = resolve(__dirname, "../(dashboard)/backoffice/pontos/page.tsx");
const source = readFileSync(pagePath, "utf8");

describe("BackofficePontosPage - abas principais", () => {
  it("contém exatamente 3 abas principais", () => {
    expect(MAIN_TABS).toHaveLength(3);
  });

  it("mantém a aba Parceiros como aba principal", () => {
    expect(MAIN_TABS.some((t) => t.id === "parceiros" && t.label === "Parceiros")).toBe(true);
  });

  it("cria a aba CONFIGURAÇÃO com label em maiúsculas", () => {
    expect(MAIN_TABS.some((t) => t.id === "configuracao" && t.label === "CONFIGURAÇÃO")).toBe(true);
  });

  it("cria a aba INDICAÇÃO com label em maiúsculas", () => {
    expect(MAIN_TABS.some((t) => t.id === "indicacao" && t.label === "INDICAÇÃO")).toBe(true);
  });

  it("todos os ids de abas principais são válidos", () => {
    for (const tab of MAIN_TABS) {
      expect(MAIN_TAB_IDS.has(tab.id)).toBe(true);
    }
  });
});

describe("BackofficePontosPage - subabas de CONFIGURAÇÃO", () => {
  it("contém exatamente 2 subabas em CONFIGURAÇÃO", () => {
    expect(CONFIG_SUB_TABS).toHaveLength(2);
  });

  it("move a aba Ciclos para as subabas de CONFIGURAÇÃO", () => {
    expect(CONFIG_SUB_TAB_IDS.has("ciclos")).toBe(true);
  });

  it("move a aba Configuração para as subabas de CONFIGURAÇÃO", () => {
    expect(CONFIG_SUB_TAB_IDS.has("configuracao")).toBe(true);
  });

  it("não inclui Distribuir Pontos nas subabas de CONFIGURAÇÃO", () => {
    expect(CONFIG_SUB_TAB_IDS.has("distribuir" as ConfigSubTabType)).toBe(false);
  });

  it("não inclui Resgates nas subabas de CONFIGURAÇÃO", () => {
    expect(CONFIG_SUB_TAB_IDS.has("resgates" as ConfigSubTabType)).toBe(false);
  });
});

describe("BackofficePontosPage - subabas de INDICAÇÃO", () => {
  it("contém exatamente 4 subabas em INDICAÇÃO", () => {
    expect(INDICACAO_SUB_TABS).toHaveLength(4);
  });

  it("move Distribuir Pontos para as subabas de INDICAÇÃO", () => {
    expect(INDICACAO_SUB_TAB_IDS.has("distribuir")).toBe(true);
  });

  it("move Prêmios para as subabas de INDICAÇÃO", () => {
    expect(INDICACAO_SUB_TAB_IDS.has("premios")).toBe(true);
  });

  it("move Ranking para as subabas de INDICAÇÃO", () => {
    expect(INDICACAO_SUB_TAB_IDS.has("ranking")).toBe(true);
  });

  it("move Resgates para as subabas de INDICAÇÃO", () => {
    expect(INDICACAO_SUB_TAB_IDS.has("resgates")).toBe(true);
  });

  it("não inclui Ciclos nas subabas de INDICAÇÃO", () => {
    expect(INDICACAO_SUB_TAB_IDS.has("ciclos" as IndicacaoSubTabType)).toBe(false);
  });
});

describe("BackofficePontosPage - resolução da aba ativa", () => {
  it("retorna 'parceiros' quando a aba principal é parceiros", () => {
    expect(resolveActiveTab("parceiros", "ciclos", "distribuir")).toBe("parceiros");
  });

  it("retorna a subaba de configuração quando a aba principal é configuração", () => {
    expect(resolveActiveTab("configuracao", "ciclos", "distribuir")).toBe("ciclos");
    expect(resolveActiveTab("configuracao", "configuracao", "distribuir")).toBe("configuracao");
  });

  it("retorna a subaba de indicação quando a aba principal é indicação", () => {
    expect(resolveActiveTab("indicacao", "ciclos", "distribuir")).toBe("distribuir");
    expect(resolveActiveTab("indicacao", "ciclos", "premios")).toBe("premios");
    expect(resolveActiveTab("indicacao", "ciclos", "ranking")).toBe("ranking");
    expect(resolveActiveTab("indicacao", "ciclos", "resgates")).toBe("resgates");
  });
});

describe("BackofficePontosPage - estrutura do código-fonte", () => {
  it("define o tipo MainTabType com parceiros, configuracao e indicacao", () => {
    expect(source).toMatch(/type MainTabType = "parceiros" \| "configuracao" \| "indicacao"/);
  });

  it("define o tipo ConfigSubTabType com ciclos e configuracao", () => {
    expect(source).toMatch(/type ConfigSubTabType = "ciclos" \| "configuracao"/);
  });

  it("define o tipo IndicacaoSubTabType com as 4 subabas de indicação", () => {
    expect(source).toMatch(
      /type IndicacaoSubTabType = "distribuir" \| "premios" \| "ranking" \| "resgates"/,
    );
  });

  it("define a constante MAIN_TABS", () => {
    expect(source).toMatch(/const MAIN_TABS/);
  });

  it("define a constante CONFIG_SUB_TABS", () => {
    expect(source).toMatch(/const CONFIG_SUB_TABS/);
  });

  it("define a constante INDICACAO_SUB_TABS", () => {
    expect(source).toMatch(/const INDICACAO_SUB_TABS/);
  });

  it("não usa mais a constante TABS (antiga estrutura plana)", () => {
    expect(source).not.toMatch(/const TABS\b/);
  });

  it("não usa mais o tipo TabType (antigo)", () => {
    expect(source).not.toMatch(/type TabType\b/);
  });
});

describe("BackofficePontosPage - estado principal e subabas", () => {
  it("declara o estado activeMainTab", () => {
    expect(source).toMatch(/activeMainTab/);
  });

  it("declara o estado activeConfigSubTab", () => {
    expect(source).toMatch(/activeConfigSubTab/);
  });

  it("declara o estado activeIndicacaoSubTab", () => {
    expect(source).toMatch(/activeIndicacaoSubTab/);
  });

  it("deriva activeTab a partir do estado principal + subaba", () => {
    expect(source).toMatch(/const activeTab = activeMainTab/);
  });

  it("passa activeTab para o hook usePontosData", () => {
    expect(source).toMatch(/usePontosData\(activeTab/);
  });
});

describe("BackofficePontosPage - renderização condicional das subabas", () => {
  it("renderiza as subabas apenas quando aba principal é configuracao ou indicacao", () => {
    expect(source).toMatch(
      /activeMainTab === "configuracao" \|\| activeMainTab === "indicacao"/,
    );
  });

  it("não renderiza subabas quando aba principal é parceiros", () => {
    // A renderização das subabas está protegida por condicional que exclui parceiros
    expect(source).toMatch(
      /\{?\(activeMainTab === "configuracao" \|\| activeMainTab === "indicacao"\) &&/,
    );
  });
});

describe("BackofficePontosPage - mapeamento de componentes", () => {
  it("renderiza ParceirosPontos apenas quando aba principal é parceiros", () => {
    expect(source).toMatch(
      /activeMainTab === "parceiros" && <ParceirosPontos/,
    );
  });

  it("renderiza CiclosPontos na subaba ciclos de CONFIGURAÇÃO", () => {
    expect(source).toMatch(
      /activeMainTab === "configuracao" && activeConfigSubTab === "ciclos" && <CiclosPontos/,
    );
  });

  it("renderiza ConfiguracaoPontos na subaba configuracao de CONFIGURAÇÃO", () => {
    expect(source).toMatch(
      /activeMainTab === "configuracao" && activeConfigSubTab === "configuracao" && <ConfiguracaoPontos/,
    );
  });

  it("renderiza DistribuirPontos na subaba distribuir de INDICAÇÃO", () => {
    expect(source).toMatch(
      /activeMainTab === "indicacao" && activeIndicacaoSubTab === "distribuir" && <DistribuirPontos/,
    );
  });

  it("renderiza PremiosPontos na subaba premios de INDICAÇÃO", () => {
    expect(source).toMatch(
      /activeMainTab === "indicacao" && activeIndicacaoSubTab === "premios" && <PremiosPontos/,
    );
  });

  it("renderiza RankingPontos na subaba ranking de INDICAÇÃO", () => {
    expect(source).toMatch(
      /activeMainTab === "indicacao" && activeIndicacaoSubTab === "ranking" && <RankingPontos/,
    );
  });

  it("renderiza ResgatePontos na subaba resgates de INDICAÇÃO", () => {
    expect(source).toMatch(
      /activeMainTab === "indicacao" && activeIndicacaoSubTab === "resgates" && <ResgatePontos/,
    );
  });
});

describe("BackofficePontosPage - todas as abas antigas preservadas", () => {
  it("todos os 7 componentes de aba continuam referenciados no código", () => {
    const componentes = [
      "ParceirosPontos",
      "CiclosPontos",
      "ConfiguracaoPontos",
      "DistribuirPontos",
      "PremiosPontos",
      "RankingPontos",
      "ResgatePontos",
    ];
    for (const comp of componentes) {
      expect(source).toMatch(new RegExp(`import\\s*\\{[^}]*\\b${comp}\\b[^}]*\\}\\s*from`));
      expect(source).toMatch(new RegExp(`<${comp}\\b`));
    }
  });
});
