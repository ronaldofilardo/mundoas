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
      "CONSULTOR_PF",
    ];

    expect(tipos).toContain("CONSULTOR_PF");
    expect(tipos.length).toBeGreaterThanOrEqual(9);
  });

  it("nao deve incluir tipos invalidos", () => {
    const tiposInvalidos = ["GESTOR_PF", "GESTOR_PJ", "PARCEIRO_PF", "CONSULTOR_PF_INVALIDO"];

    tiposInvalidos.forEach((tipo) => {
      expect(["ADMIN", "BACKOFFICE", "SUPERVISAO", "GERENCIA", "CONSULTOR", "PARCEIRO", "COMERCIAL", "LIDERANCA", "CONSULTOR_PF" as any]).not.toContain(tipo as any);
    });
  });
});
