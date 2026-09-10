import { describe, it, expect } from "vitest";
import { formatCpf, formatDate } from "../(dashboard)/backoffice/producao/relatorios/utils";

describe("formatCpf", () => {
  it("formata CPF de 11 dígitos", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
  });

  it("retorna o valor original quando menor que 11 dígitos", () => {
    expect(formatCpf("123")).toBe("123");
  });

  it("retorna '-' para CPF vazio", () => {
    expect(formatCpf("")).toBe("-");
  });
});

describe("formatDate", () => {
  it("formata data no padrão pt-BR", () => {
    expect(formatDate("2026-01-15T12:00:00")).toBe("15/01/2026");
  });

  it("retorna '-' para data vazia", () => {
    expect(formatDate("")).toBe("-");
  });
});