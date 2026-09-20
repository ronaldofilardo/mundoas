/**
 * Testes das correções de layout/UX na view "Validação de Resultados"
 * do sistema de comissões.
 *
 * Após refatoração, a view foi extraída para componentes separados:
 * - validacao-resultados-view.tsx (container)
 * - validacao-item-card.tsx (card por liderança/comercial)
 * - validacao-subtables.tsx (tabelas de subordinados/consultores)
 * - falta-checkbox.tsx (checkbox de falta)
 *
 * Os testes são source-level: garantem que os anti-padrões não voltem
 * e que a estrutura nova se mantém.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const VIEW_SRC = readFileSync(
  resolve(
    __dirname,
    "../(dashboard)/backoffice/comissionamento/equipe/components/validacao-resultados-view.tsx",
  ),
  "utf-8",
);

const CARD_SRC = readFileSync(
  resolve(
    __dirname,
    "../(dashboard)/backoffice/comissionamento/equipe/components/validacao-item-card.tsx",
  ),
  "utf-8",
);

const ALL_SRC = VIEW_SRC + "\n" + CARD_SRC;

describe("tab-comissoes - correções de layout (Validação de Resultados)", () => {
  describe("anti-padrões removidos", () => {
    it("não deve mais usar min-w-[1600px] que forçava scroll horizontal", () => {
      expect(ALL_SRC).not.toContain("min-w-[1600px]");
    });

    it("não deve mais ter a coluna 'Subordinados / Consultores' na tabela principal", () => {
      expect(ALL_SRC).not.toContain("Subordinados / Consultores");
    });
  });

  describe("nova estrutura em cards", () => {
    it("cada item de validação deve renderizar um card", () => {
      expect(CARD_SRC).toContain('className="card overflow-hidden"');
    });

    it("deve exibir métricas com rótulos (Meta, Produção, Meta Batida, Comissão Líder, Projeção Comissão)", () => {
      for (const label of [
        "Meta",
        "Produção",
        "Meta Batida",
        "Comissão Líder",
        "Projeção Comissão",
      ]) {
        expect(CARD_SRC).toContain(`>${label}<`);
      }
    });

    it("checkbox de falta do líder deve ter label de texto", () => {
      expect(CARD_SRC).toContain("FaltaCheckbox");
    });

    it("seções de subordinados/consultores devem usar componentes dedicados", () => {
      expect(CARD_SRC).toContain("SubordinadosTable");
      expect(CARD_SRC).toContain("ConsultoresPfTable");
    });
  });
});
