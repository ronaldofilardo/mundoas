import { describe, it, expect } from "vitest";

describe("ranking-pontos - interface", () => {
  it("deve aceitar estrutura de ranking", () => {
    const ranking = { posicoes: [{ id: "1", nome: "Ana", pontos: 100 }] };
    expect(ranking.posicoes[0].nome).toBe("Ana");
  });
});
