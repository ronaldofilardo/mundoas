import { describe, expect, it } from "vitest";
import { intervaloMesReferencia, validarMesReferencia } from "../competencia";

describe("competência mensal", () => {
  it("aceita somente o formato YYYY-MM com mês válido", () => {
    expect(validarMesReferencia("2026-01")).toBe(true);
    expect(validarMesReferencia("2026-12")).toBe(true);
    expect(validarMesReferencia("2026-13")).toBe(false);
    expect(validarMesReferencia("26-01")).toBe(false);
    expect(validarMesReferencia("2026-1")).toBe(false);
    expect(validarMesReferencia(null)).toBe(false);
  });

  it("calcula intervalo fechado-aberto sem aproximar a quantidade de dias", () => {
    const intervalo = intervaloMesReferencia("2024-02");

    expect(intervalo.inicio.toISOString()).toBe("2024-02-01T00:00:00.000Z");
    expect(intervalo.fim.toISOString()).toBe("2024-03-01T00:00:00.000Z");
  });
});
