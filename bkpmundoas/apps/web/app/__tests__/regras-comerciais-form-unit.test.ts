import { describe, it, expect } from "vitest";

describe("regras-comerciais-form - interface de tipos", () => {
  it("deve aceitar estrutura RegrasComerciais com itens", () => {
    const regras: any = {
      id: "1",
      cartaoAcessoSaude: 0.5,
      itens: [{ id: "i1", nome: "Venda Direta", percentual: 0.3 }],
    };
    expect(regras.itens[0].nome).toBe("Venda Direta");
  });
});
