import { describe, it, expect } from "vitest";
import { buildProducaoCsv } from "../(dashboard)/backoffice/producao/relatorios/lib/export-producao-csv";
import type { Procedimento } from "../(dashboard)/backoffice/producao/relatorios/types";

function makeProcedimento(overrides: Partial<Procedimento> = {}): Procedimento {
  return {
    id: "1",
    dataReferencia: "2026-01-15T00:00:00.000Z",
    dataPagamento: "",
    formaPagamento: "PIX",
    paciente: "Paciente A",
    procedimento: "Procedimento A",
    cpf: "12345678901",
    tipoProcedimento: "",
    unidade: "Unidade A",
    valorComissao: "100",
    valorTotal: 1000,
    parceiro: { id: "p1", nome: "Parceiro 1", cpf: "111" },
    indicado: null,
    comercial: { id: "c1", nome: "Comercial 1", funcao: "GESTOR" },
    consultorPf: { id: "cp1", nome: "Consultor 1" },
    upload: { id: "u1", nomeArquivo: "arq.xlsx", mesReferencia: "2026-01" },
    ...overrides,
  };
}

describe("buildProducaoCsv", () => {
  it("gera cabeçalho e linhas separadas por ponto e vírgula", () => {
    const csv = buildProducaoCsv([makeProcedimento()]);
    const linhas = csv.split("\n");
    expect(linhas[0]).toContain("Data Referência");
    expect(linhas[0]).toContain("Paciente");
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toContain("Paciente A");
    expect(linhas[1]).toContain("123.456.789-01");
    expect(linhas[1]).toContain("1000.00");
    expect(linhas[1]).toContain("100.00");
  });

  it("trata campos ausentes com fallbacks", () => {
    const csv = buildProducaoCsv([
      makeProcedimento({ parceiro: null, comercial: null, consultorPf: null }),
    ]);
    const linha = csv.split("\n")[1];
    expect(linha).toContain("Sem vínculo");
    expect(linha).toContain("-");
  });

  it("retorna apenas cabeçalho para lista vazia", () => {
    const csv = buildProducaoCsv([]);
    expect(csv.split("\n")).toHaveLength(1);
  });
});