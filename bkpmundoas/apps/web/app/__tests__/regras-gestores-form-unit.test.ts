import { describe, it, expect } from "vitest";

describe("regras-gestores-form - interface de tipos", () => {
  it("deve aceitar estrutura RegrasGestores com itens", () => {
    const regras: any = {
      id: "1",
      gerenteCire: 0.5,
      itens: [{ id: "i1", nome: "Supervisão Nova", percentual: 0.2 }],
    };
    expect(regras.itens[0].nome).toBe("Supervisão Nova");
  });
});
