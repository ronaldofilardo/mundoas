import { describe, expect, it } from "vitest";
import { reprocessarComissoesSchema, valorTotalFinanceiroSchema } from "../src/schemas";

describe("contratos financeiros compartilhados", () => {
  it("rejeita valorTotal ausente", () => {
    expect(valorTotalFinanceiroSchema.safeParse("").success).toBe(false);
  });

  it("aceita zero explicitamente informado", () => {
    const result = valorTotalFinanceiroSchema.safeParse("R$ 0,00");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });

  it("rejeita valorTotal inválido ou negativo", () => {
    expect(valorTotalFinanceiroSchema.safeParse("abc").success).toBe(false);
    expect(valorTotalFinanceiroSchema.safeParse(-1).success).toBe(false);
  });

  it("valida o contrato do reprocessamento", () => {
    expect(
      reprocessarComissoesSchema.safeParse({
        comercialId: "00000000-0000-0000-0000-000000000001",
        mesReferencia: "2026-08",
      }).success,
    ).toBe(true);
    expect(
      reprocessarComissoesSchema.safeParse({
        comercialId: "c-1",
        mesReferencia: "2026-13",
      }).success,
    ).toBe(false);
  });
});
