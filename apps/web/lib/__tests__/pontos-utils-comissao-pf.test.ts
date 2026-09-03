import { describe, expect, it } from "vitest";
import { calcularValorComissaoPf } from "../pontos-utils";

const itensCustom = [
  { nome: "Cartao Acesso Saude", percentual: 6 },
  { nome: "Cire Ativo", percentual: 4 },
  { nome: "Cire Receptivo", percentual: 1.4 },
  { nome: "Franchising Acesso", percentual: 1.1 },
  { nome: "Franchising Cartao", percentual: 0.8 },
  { nome: "Unidade", percentual: 0.9 },
];

describe("Comissão PF por tipo de procedimento", () => {
  it.each([
    ["Cartão Acesso Saúde", 60],
    ["CIRE Ativo", 40],
    ["CIRE Receptivo", 14],
    ["Franchising Acesso", 11],
    ["Franchising Cartão", 8],
    ["Unidade", 9],
  ])("aplica o percentual de %s via itens custom", (tipo, valorEsperado) => {
    expect(
      calcularValorComissaoPf({
        valorProcedimento: 1000,
        tipoProcedimento: tipo,
        itensCustom,
      }),
    ).toBe(Number(valorEsperado));
  });

  it("deve retornar 0 se não houver item correspondente", () => {
    expect(
      calcularValorComissaoPf({
        valorProcedimento: 1000,
        tipoProcedimento: "Desconhecido",
        itensCustom,
      }),
    ).toBe(0);
  });
});
