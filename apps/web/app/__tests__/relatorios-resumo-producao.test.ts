import { describe, it, expect } from "vitest";
import { calcularResumoProducao } from "../(dashboard)/backoffice/producao/relatorios/lib/resumo-producao";
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

describe("calcularResumoProducao", () => {
  it("retorna resumo vazio para lista vazia", () => {
    const resumo = calcularResumoProducao([]);
    expect(resumo.totalProcedimentos).toBe(0);
    expect(resumo.totalComissao).toBe(0);
    expect(resumo.totalValorTotal).toBe(0);
    expect(resumo.porMes).toHaveLength(0);
    expect(resumo.porComercial).toHaveLength(0);
    expect(resumo.porParceiro).toHaveLength(0);
    expect(resumo.porConsultorPf).toHaveLength(0);
  });

  it("calcula totais e agrupamentos corretamente", () => {
    const procs = [
      makeProcedimento({ id: "1", valorComissao: "100", valorTotal: 1000 }),
      makeProcedimento({ id: "2", valorComissao: "50", valorTotal: 500 }),
    ];
    const resumo = calcularResumoProducao(procs);

    expect(resumo.totalProcedimentos).toBe(2);
    expect(resumo.totalComissao).toBe(150);
    expect(resumo.totalValorTotal).toBe(1500);
    expect(resumo.porMes).toHaveLength(1);
    expect(resumo.porMes[0].qtdProcedimentos).toBe(2);
    expect(resumo.porComercial).toHaveLength(1);
    expect(resumo.porComercial[0].qtdProcedimentos).toBe(2);
    expect(resumo.porParceiro).toHaveLength(1);
    expect(resumo.porConsultorPf).toHaveLength(1);
  });

  it("usa mes da dataReferencia quando upload.mesReferencia ausente", () => {
    const proc = makeProcedimento({
      upload: { id: "u1", nomeArquivo: "arq.xlsx", mesReferencia: "" },
      dataReferencia: "2026-03-10T00:00:00.000Z",
    });
    const resumo = calcularResumoProducao([proc]);
    expect(resumo.porMes[0].mes).toBe("2026-03");
  });

  it("não agrupa comerciais/parceiros/consultores nulos", () => {
    const proc = makeProcedimento({
      comercial: null,
      parceiro: null,
      consultorPf: null,
    });
    const resumo = calcularResumoProducao([proc]);
    expect(resumo.porComercial).toHaveLength(0);
    expect(resumo.porParceiro).toHaveLength(0);
    expect(resumo.porConsultorPf).toHaveLength(0);
  });

  it("valorTotal ausente é tratado como 0", () => {
    const proc = makeProcedimento({ valorTotal: undefined, valorComissao: "10" });
    const resumo = calcularResumoProducao([proc]);
    expect(resumo.totalValorTotal).toBe(0);
    expect(resumo.totalComissao).toBe(10);
  });
});