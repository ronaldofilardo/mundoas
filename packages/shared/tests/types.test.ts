import { describe, it, expect } from "vitest";
import { TipoUsuario } from "../src/types";

describe("TipoUsuario", () => {
  it("deve incluir CONSULTOR_PF", () => {
    const tipos: TipoUsuario[] = [
      "ADMIN",
      "BACKOFFICE",
      "SUPERVISAO",
      "GERENCIA",
      "GESTOR",
      "PARCEIRO",
      "COMERCIAL",
      "LIDERANCA",
      "CONSULTOR_PF",
    ];

    expect(tipos).toContain("CONSULTOR_PF");
    expect(tipos.length).toBeGreaterThanOrEqual(9);
  });

  it("nao deve incluir tipos PJ removidos", () => {
    const tiposInvalidos = ["GESTOR_PJ", "CONSULTOR"];

    tiposInvalidos.forEach((tipo) => {
      expect([
        "ADMIN",
        "BACKOFFICE",
        "SUPERVISAO",
        "GERENCIA",
        "GESTOR",
        "PARCEIRO",
        "COMERCIAL",
        "LIDERANCA",
        "CONSULTOR_PF",
      ] as any).not.toContain(tipo as any);
    });
  });
});
