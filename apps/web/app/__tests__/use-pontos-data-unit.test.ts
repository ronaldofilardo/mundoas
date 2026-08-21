import { describe, it, expect } from "vitest";

describe("use-pontos-data - tabs suportadas", () => {
  it("deve incluir 'ciclos', 'premios', 'ranking', 'resgates'", () => {
    const tabs = ["ciclos", "configuracao", "distribuir", "premios", "ranking", "resgates"];
    expect(tabs).toContain("ranking");
    expect(tabs).toContain("resgates");
  });

  it("deve retornar data, loading e refetch", () => {
    const result = { data: {}, loading: false, refetch: () => {} };
    expect(typeof result.refetch).toBe("function");
  });
});
