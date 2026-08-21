import { describe, it, expect } from "vitest";

describe("resgate-pontos - interface", () => {
  it("deve aceitar estrutura de resgates", () => {
    const resgates = [{ id: "r1", nome: "João", valor: 500, status: "ABERTO" }];
    expect(resgates[0].valor).toBe(500);
  });
});
