import { describe, it, expect } from "vitest";
import type { RegrasComerciais } from "../(dashboard)/backoffice/usuarios/comerciais/types";

describe("regras-comerciais-form - interface de tipos", () => {
  it("deve aceitar estrutura RegrasComerciais com itens", () => {
    const regras: RegrasComerciais = {
      id: "1",
      cartaoAcessoSaude: 0.5,
      cireAtivo: 0,
      cireReceptivo: 0,
      franchisingAcesso: 0,
      franchisingCartao: 0,
      unidade: 0,
      itens: [{ id: "i1", nome: "Venda Direta", percentual: 0.3, ordem: 1 }],
    };
    expect(regras.itens[0].nome).toBe("Venda Direta");
  });
});
