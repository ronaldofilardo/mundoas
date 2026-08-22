import { describe, expect, it } from "vitest";
import { calcularValorComissaoPf } from "../pontos-utils";

const regras = {
  cartaoAcessoSaude: 6,
  cireAtivo: 4,
  cireReceptivo: 1.4,
  franchisingAcesso: 1.1,
  franchisingCartao: 0.8,
  unidade: 0.9,
};

describe("Comissão PF por tipo de procedimento", () => {
  it.each([
    ["Cartão Acesso Saúde", 60],
    ["CIRE Ativo", 40],
    ["CIRE Receptivo", 14],
    ["Franchising Acesso", 11],
    ["Franchising Cartão", 8],
    ["Unidade", 9],
  ])("aplica o percentual de %s", (tipo, percentual) => {
    expect(
      calcularValorComissaoPf({
        valorProcedimento: 1000,
        tipoProcedimento: tipo,
        regraComercial: regras,
      }),
    ).toBe(Number(percentual));
  });

  it("usa unidade quando o tipo não é informado", () => {
    expect(
      calcularValorComissaoPf({
        valorProcedimento: 1000,
        regraComercial: regras,
      }),
    ).toBe(9);
  });

  it("retorna zero sem regra comercial", () => {
    expect(
      calcularValorComissaoPf({
        valorProcedimento: 1000,
        tipoProcedimento: "CIRE Ativo",
        regraComercial: null,
      }),
    ).toBe(0);
  });
});
