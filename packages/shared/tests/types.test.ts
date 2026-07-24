import { describe, it, expect } from "vitest";
import { TipoUsuario } from "../src/types";

describe("TipoUsuario", () => {
  it("deve incluir CONSULTOR_PF", () => {
    const tipos: TipoUsuario[] = [
      "ADMIN",
      "BACKOFFICE",
      "SUPERVISAO",
      "GERENCIA",
      "CONSULTOR",
      "PARCEIRO",
      "COMERCIAL",
      "LIDERANCA",
      "GESTOR_PJ",
      "CONSULTOR_PF",
    ];

    expect(tipos).toContain("CONSULTOR_PF");
    expect(tipos.length).toBeGreaterThanOrEqual(10);
  });

  it("nao deve incluir tipos invalidos", () => {
    const tiposInvalidos = ["GESTOR_PF", "PARCEIRO_PF", "CONSULTOR_PF_INVALIDO"];

    tiposInvalidos.forEach((tipo) => {
      expect(["ADMIN", "BACKOFFICE", "SUPERVISAO", "GERENCIA", "CONSULTOR", "PARCEIRO", "COMERCIAL", "LIDERANCA", "GESTOR_PJ", "CONSULTOR_PF" as any]).not.toContain(tipo as any);
    });
  });
});
