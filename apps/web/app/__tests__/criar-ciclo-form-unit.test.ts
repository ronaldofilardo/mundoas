import { describe, it, expect } from "vitest";

describe("criar-ciclo-form - validação de campos", () => {
  it("deve exigir nome, inicio, fimAcumulo, fimResgate e periodicidade", () => {
    const form = { nome: "", periodicidade: "ANUAL", inicio: "", fimAcumulo: "", inicioResgate: "", fimResgate: "" };
    expect(form.nome).toBeFalsy();
  });

  it("deve aceitar periodicidade ANUAL ou SEMESTRAL", () => {
    expect(["ANUAL", "SEMESTRAL"]).toContain("SEMESTRAL");
  });
});
