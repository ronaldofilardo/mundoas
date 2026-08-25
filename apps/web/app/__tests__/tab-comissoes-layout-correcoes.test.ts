/**
 * Testes das correções de layout/UX aplicadas nesta conversa na view
 * "Validação de Resultados" de tab-comissoes.tsx:
 *
 *   1) Remoção da tabela única com min-w-[1600px] que forçava scroll
 *      horizontal e espremer as colunas.
 *   2) Remoção de <tbody> aninhado dentro de <tbody> com colSpan={9}
 *      (HTML inválido) que desalinhava as sub-tabelas do cabeçalho.
 *   3) Novo layout em cards: cada liderança/comercial é um card com
 *      métricas rotuladas, e Comerciais/Consultores PF viram seções
 *      com título e contagem.
 *   4) Checkbox de falta do líder com label de texto "Falta".
 *   5) Valores monetários com whitespace-nowrap para não quebrar linha.
 *
 * Os testes são source-level: garantem que os anti-padrões não voltem
 * e que a estrutura nova se mantém.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(
    __dirname,
    "../(dashboard)/backoffice/comissionamento/equipe/components/tab-comissoes.tsx",
  ),
  "utf-8",
);

// Isola apenas o bloco da view de validação (entre os dois marcadores de seção)
const VALIDACAO_BLOCK = (() => {
  const start = SRC.indexOf("VIEW: VALIDAÇÃO DE RESULTADOS");
  const end = SRC.indexOf("VIEW: GRADE DE FALTAS");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return SRC.slice(start, end);
})();

describe("tab-comissoes - correções de layout (Validação de Resultados)", () => {
  describe("anti-padrões removidos", () => {
    it("não deve mais usar min-w-[1600px] que forçava scroll horizontal", () => {
      expect(VALIDACAO_BLOCK).not.toContain("min-w-[1600px]");
    });

    it("não deve mais aninhar tbody dentro de tbody", () => {
      // A estrutura antiga abria um <tbody> por item dentro do <tbody> principal.
      const tbodyOpens = (VALIDACAO_BLOCK.match(/<tbody/g) ?? []).length;
      // Agora só existem os tbodies das tabelas de subordinados/consultores,
      // cada um dentro de sua própria <table> filha.
      const tables = (VALIDACAO_BLOCK.match(/<table/g) ?? []).length;
      expect(tbodyOpens).toBeLessThanOrEqual(tables);
    });

    it("não deve mais usar colSpan={9} para embutir sub-tabelas em células", () => {
      expect(VALIDACAO_BLOCK).not.toContain("colSpan={9}");
    });

    it("não deve mais ter a coluna 'Subordinados / Consultores' na tabela principal", () => {
      expect(VALIDACAO_BLOCK).not.toContain("Subordinados / Consultores");
    });
  });

  describe("nova estrutura em cards", () => {
    it("cada item de validação deve renderizar um card", () => {
      expect(VALIDACAO_BLOCK).toContain('className="card overflow-hidden"');
    });

    it("deve exibir métricas com rótulos (Meta, Produção, Meta Batida, Comissão Líder, Projeção Comissão)", () => {
      for (const label of [
        "Meta",
        "Produção",
        "Meta Batida",
        "Comissão Líder",
        "Projeção Comissão",
      ]) {
        expect(VALIDACAO_BLOCK).toContain(`>${label}<`);
      }
    });

    it("Comerciais devem ser uma seção com título e contagem", () => {
      expect(VALIDACAO_BLOCK).toMatch(/Comerciais \(\{item\.subordinados\.length\}\)/);
    });

    it("Consultores PF devem ser uma seção com título e contagem", () => {
      expect(VALIDACAO_BLOCK).toMatch(/Consultores PF \(\{item\.consultoresPf\.length\}\)/);
    });

    it("checkbox de falta do líder deve ter label de texto 'Falta'", () => {
      expect(VALIDACAO_BLOCK).toMatch(/>\s*Falta\s*<\/label>/);
    });

    it("valores monetários não devem quebrar linha (whitespace-nowrap)", () => {
      const nowrapCount = (VALIDACAO_BLOCK.match(/whitespace-nowrap/g) ?? []).length;
      expect(nowrapCount).toBeGreaterThanOrEqual(4);
    });

    it("seções de subordinados/consultores devem ter fundo destacado (bg-gray-50)", () => {
      const matches = VALIDACAO_BLOCK.match(
        /border-t border-gray-200 bg-gray-50 px-4 py-3/g,
      );
      expect(matches?.length).toBe(2);
    });
  });
});
