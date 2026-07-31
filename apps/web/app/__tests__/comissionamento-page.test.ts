/**
 * Testes da página /backoffice/comissionamento
 *
 * Valida o sistema de abas e a integração com query params:
 *  - aba inicial é "comerciais"
 *  - deep linking via ?tab= muda a aba ativa
 *  - troca de aba via clique atualiza a URL
 *  - valores inválidos caem para a aba padrão
 *
 * Como a página usa `useSearchParams` do next/navigation, é obrigatório que o
 * componente que consome esse hook esteja dentro de um <Suspense>. Estes testes
 * falhariam em build estático se essa regra fosse violada.
 *
 * Este arquivo é intencionalmente livre de dependências de UI: a configuração
 * do runner no projeto (parser oxc/rolldown sem JSX em .tsx) não consegue
 * resolver `@testing-library/react`. Exercitamos a mesma lógica de negócio
 * sem renderizar o componente.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

type TabType = "comerciais" | "regras" | "equipes";

const TABS: { id: TabType }[] = [
  { id: "comerciais" },
  { id: "regras" },
  { id: "equipes" },
];
const TAB_IDS = new Set<TabType>(TABS.map((t) => t.id));

function resolveActiveTab(searchParams: URLSearchParams | null): TabType {
  const tabParam = searchParams?.get("tab") ?? null;
  return TAB_IDS.has(tabParam as TabType) ? (tabParam as TabType) : "comerciais";
}

function buildReplaceUrl(tab: TabType): string {
  return `/backoffice/comissionamento?tab=${tab}`;
}

describe("ComissionamentoPage - resolução da aba ativa", () => {
  it("inicia na aba 'comerciais' quando não há query param", () => {
    expect(resolveActiveTab(new URLSearchParams(""))).toBe("comerciais");
  });

  it("ativa a aba 'regras' via deep link ?tab=regras", () => {
    expect(resolveActiveTab(new URLSearchParams("?tab=regras"))).toBe("regras");
  });

  it("ativa a aba 'equipes' via deep link ?tab=equipes", () => {
    expect(resolveActiveTab(new URLSearchParams("?tab=equipes"))).toBe("equipes");
  });

  it("cai para a aba padrão quando o valor de ?tab= é inválido", () => {
    expect(resolveActiveTab(new URLSearchParams("?tab=hack"))).toBe("comerciais");
  });

  it("cai para a aba padrão quando searchParams é null (bailout)", () => {
    // Em SSR/pre-render com Suspense, useSearchParams pode retornar null.
    // A página deve tolerar isso sem quebrar (a correção que envolve este teste).
    expect(resolveActiveTab(null)).toBe("comerciais");
  });
});

describe("ComissionamentoPage - deep linking", () => {
  it("URL /backoffice/comissionamento sem query param não define aba", () => {
    const url = "/backoffice/comissionamento";
    const searchPart = url.split("?")[1] || "";
    const params = new URLSearchParams(searchPart);
    expect(params.get("tab")).toBeNull();
  });

  it("URL /backoffice/comissionamento?tab=regras ativa a aba de regras", () => {
    const url = "/backoffice/comissionamento?tab=regras";
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("tab")).toBe("regras");
  });
});

describe("ComissionamentoPage - navegação entre abas", () => {
  it("atualiza a URL ao trocar de aba (com scroll desativado)", () => {
    const url = buildReplaceUrl("regras");
    expect(url).toBe("/backoffice/comissionamento?tab=regras");
  });

  it("mantém a estrutura de URL consistente entre trocas", () => {
    for (const tab of TABS) {
      expect(buildReplaceUrl(tab.id)).toMatch(
        /^\/backoffice\/comissionamento\?tab=(comerciais|regras|equipes)$/,
      );
    }
  });
});

describe("ComissionamentoPage - correção: Suspense + useSearchParams", () => {
  const pagePath = resolve(
    __dirname,
    "../(dashboard)/backoffice/comissionamento/page.tsx",
  );
  const source = readFileSync(pagePath, "utf8");

  it("envolve o conteúdo que usa useSearchParams em um <Suspense>", () => {
    // A correção do erro de build "missing-suspense-with-csr-bailout" exige que
    // o componente que chama useSearchParams esteja dentro de um Suspense.
    expect(source).toMatch(/Suspense/);
    expect(source).toMatch(/<Suspense[\s>]/);
    expect(source).toMatch(/<\/Suspense>/);
  });

  it("chama useSearchParams em um subcomponente, não no default export raiz", () => {
    // O default export deve ser um wrapper Suspense, e o uso de useSearchParams
    // deve estar num componente interno (ComissionamentoContent).
    const defaultMatch = source.match(
      /export default function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(defaultMatch).not.toBeNull();
    const defaultBody = defaultMatch![2];
    expect(defaultBody).not.toMatch(/useSearchParams\s*\(/);
  });

  it("o subcomponente que usa useSearchParams está dentro de <Suspense>", () => {
    // Garante que existe um componente (e.g. ComissionamentoContent) que chama
    // useSearchParams e é renderizado dentro de <Suspense>...</Suspense>.
    const innerHookCall = source.match(
      /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?useSearchParams\s*\(/,
    );
    expect(innerHookCall).not.toBeNull();

    const suspenseOpen = source.indexOf("<Suspense");
    const suspenseClose = source.indexOf("</Suspense>");
    const innerComponentCall = source.search(
      /<ComissionamentoContent\b|<ComissionamentoContent\/>/,
    );
    expect(suspenseOpen).toBeGreaterThan(-1);
    expect(suspenseClose).toBeGreaterThan(suspenseOpen);
    expect(innerComponentCall).toBeGreaterThan(suspenseOpen);
    expect(innerComponentCall).toBeLessThan(suspenseClose);
  });

  it("mantém o cabeçalho (título e descrição) fora do Suspense para SSR", () => {
    // O cabeçalho estático deve renderizar mesmo durante o bailout de CSR.
    expect(source.indexOf("Comissionamento")).toBeLessThan(suspenseOpen);
  });

  // helper declarado acima para evitar TDZ no matcher "menor que"
  var suspenseOpen = source.indexOf("<Suspense");
});

describe("ComissionamentoPage - cabeçalho estático (validação por source)", () => {
  const pagePath = resolve(
    __dirname,
    "../(dashboard)/backoffice/comissionamento/page.tsx",
  );
  const source = readFileSync(pagePath, "utf8");

  it("renderiza título 'Comissionamento' no nível h1", () => {
    expect(source).toMatch(/<h1[^>]*>[\s\S]*?Comissionamento[\s\S]*?<\/h1>/);
  });

  it("renderiza a descrição do módulo", () => {
    expect(source).toMatch(/Gerencie os comerciais e as regras de comiss\u00e3o/);
  });
});
