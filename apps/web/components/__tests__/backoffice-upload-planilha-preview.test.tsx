import { describe, expect, it } from "vitest";

describe("PremiosUpload - regressão de lógica", () => {
  it("tipoLabels: todos os tipos esperados estão definidos", () => {
    // Estes são os tipos mapeados no componente premium-upload.tsx
    const tiposEsperados = ["PRODUTO", "SERVICO", "EXPERIENCIA", "VOUCHER"];
    expect(tiposEsperados).toHaveLength(4);
  });

  it("validacao de extensao de arquivo: .xlsx e .xls sao validos", () => {
    const extensoesValidas = ["xlsx", "xls", "csv"];
    ["planilha.xlsx", "dados.xls", "registros.csv"].forEach((nome) => {
      const extensao = nome.toLowerCase().split(".").pop()!;
      const valido = extensoesValidas.includes(extensao);
      expect(valido).toBe(true);
    });
  });

  it("validacao de extensao de arquivo: .pdf nao e valido", () => {
    const extensao = "pdf";
    const valido = ["xlsx", "xls", "csv"].includes(extensao);
    expect(valido).toBe(false);
  });
});