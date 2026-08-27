import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { calcularPontosComConfiguracao } from "@/lib/pontos-utils";

describe("Pontos por produção — valor em reais por ponto", () => {
  it("calcula pontos usando o valor por ponto cadastrado", () => {
    expect(
      calcularPontosComConfiguracao(250, {
        valorPorPonto: new Decimal(100),
        tipoArredondamento: "PADRAO",
      }),
    ).toBe(3);
  });

  it("aplica PISO e TETO sobre a mesma produção", () => {
    const config = { valorPorPonto: new Decimal(100), tipoArredondamento: "PISO" };
    expect(calcularPontosComConfiguracao(250, config)).toBe(2);
    expect(
      calcularPontosComConfiguracao(250, {
        ...config,
        tipoArredondamento: "TETO",
      }),
    ).toBe(3);
  });

  it("não gera pontos para valor não positivo", () => {
    const config = { valorPorPonto: new Decimal(100), tipoArredondamento: "PADRAO" };
    expect(calcularPontosComConfiguracao(0, config)).toBe(0);
    expect(calcularPontosComConfiguracao(-50, config)).toBe(0);
  });
});
