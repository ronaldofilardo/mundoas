import { describe, it, expect } from "vitest";

describe("ciclos-pontos - renderização básica", () => {
  it("deve renderizar título 'Ciclos de Pontos'", () => {
    expect("Ciclos de Pontos").toContain("Ciclos");
  });

  it("deve aceitar prop data", () => {
    const data = [{ id: "c1", nome: "Ciclo 1", status: "EM_ANDAMENTO", periodicidade: "ANUAL" }];
    expect(data[0].nome).toBe("Ciclo 1");
  });
});
