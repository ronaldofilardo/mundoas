/**
 * Testes de regressão dos fluxos de validação, matching de parceiro e
 * parsing de datas do processamento em background (processar-upload-pf.ts).
 *
 * Estes testes estabelecem a linha base ANTES da refatoração (política v2.0),
 * cobrindo fluxos que os testes existentes não cobriam:
 *  - Rejeição de linhas (valor_total / data / paciente / procedimento)
 *  - Matching de parceiro direto e por indicação
 *  - Resgate por Consultor PF (usuário da conta)
 *  - Parsing de datas em múltiplos formatos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    uploadPlanilhaBackoffice: { update: vi.fn(), findUnique: vi.fn() },
    equipe: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn() },
    gestor: { findMany: vi.fn() },
    parceiro: { findMany: vi.fn() },
    procedimentoPFRaw: { createMany: vi.fn() },
    procedimentoPF: { findMany: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock("@asa/database", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/bonus-pf-pos-upload", async () => ({
  processarBonusPfPosUpload: vi.fn().mockResolvedValue({
    bonusPfDistribuidos: 0,
    bonusPfIgnorados: 0,
    bonusPfIgnoradosExistente: 0,
    bonusPfErros: 0,
  }),
}));

const { utils, write } = require("xlsx");

const createMockExcel = (data: any[][], fileName = "test.xlsx"): File => {
  const ws = utils.aoa_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = write(wb, { type: "buffer", bookType: "xlsx" });
  return new File([buffer], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

const BACKOFFICE_ID = "bo-teste";
const CPF_VALIDO = "52998224725";

import { processarUploadPlanilhaPF } from "@/lib/processar-upload-pf";

const CABECALHO = [
  "Data de Referência",
  "Paciente",
  "CPF",
  "Procedimento",
  "Total Pago",
  "Usuário da conta",
  "Unidade",
  "Tipo Procedimento",
  "Forma Pagamento",
];

function linha(data: unknown, paciente: unknown, cpf: unknown, procedimento: unknown, total: unknown, usuario = ""): any[] {
  return [data, paciente, cpf, procedimento, total, usuario, "UBS Central", "PARTICULAR", "PARTICULAR"];
}

describe("processarUploadPlanilhaPF - validação e matching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.uploadPlanilhaBackoffice.update.mockResolvedValue({});
    mockPrisma.uploadPlanilhaBackoffice.findUnique.mockResolvedValue({ mesReferencia: "2026-07" });
    mockPrisma.procedimentoPFRaw.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.procedimentoPF.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.procedimentoPF.findMany.mockResolvedValue([]);

    mockPrisma.equipe.findMany
      .mockResolvedValueOnce([{ id: "lid1" }])
      .mockResolvedValueOnce([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function capturarRaw(): Array<any> {
    const calls = mockPrisma.procedimentoPFRaw.createMany.mock.calls;
    if (calls.length === 0) return [];
    return calls[0][0].data;
  }

  function capturarProcedimentos(): Array<any> {
    const calls = mockPrisma.procedimentoPF.createMany.mock.calls;
    if (calls.length === 0) return [];
    return calls[0][0].data;
  }

  describe("validação de linha (rejeição)", () => {
    it("rejeita linha com valor total ausente/inválido", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "Paciente", CPF_VALIDO, "Consulta", "abc"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const raw = capturarRaw();
      expect(raw.length).toBe(1);
      expect(raw[0].valido).toBe(false);
      expect(raw[0].motivoRejeicao).toContain("valor_total_ausente_ou_invalido");
    });

    it("rejeita linha sem data de referência", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("", "Paciente", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const raw = capturarRaw();
      expect(raw[0].valido).toBe(false);
      expect(raw[0].motivoRejeicao).toContain("data_referencia_ausente");
    });

    it("rejeita linha sem paciente e sem procedimento acumulando motivos", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "", CPF_VALIDO, "", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const raw = capturarRaw();
      expect(raw[0].valido).toBe(false);
      expect(raw[0].motivoRejeicao).toContain("paciente_ausente");
      expect(raw[0].motivoRejeicao).toContain("procedimento_ausente");
    });
  });

  describe("matching de parceiro", () => {
    it("encontra parceiro pelo CPF e grava procedimento válido", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: "c1", gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "João", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      expect(procs[0].parceiroId).toBe("p1");
      expect(procs[0].comercialId).toBe("c1");
    });

    it("marca órfão quando CPF não corresponde a parceiro", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "Alguém", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const raw = capturarRaw();
      expect(raw[0].orfao).toBe(true);
      expect(raw[0].motivoOrfao).toContain("parceiro_nao_encontrado");
      expect(capturarProcedimentos().length).toBe(0);
    });

    it("encontra parceiro pela indicação (CPF do indicado)", async () => {
      const cpfIndicado = "52998224725";
      mockPrisma.parceiro.findMany.mockResolvedValue([
        {
          id: "p1",
          nome: "Parceiro Pai",
          cpf: "000.000.000-00",
          comercialId: null,
          gestorId: null,
          indicacoes: [{ id: "i1", cpf: cpfIndicado }],
        },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "Indicado", cpfIndicado, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      expect(procs[0].parceiroId).toBe("p1");
      expect(procs[0].indicadoId).toBe("i1");
    });
  });

  describe("resgate por consultor PF", () => {
    it("resgata órfão quando usuário da conta é consultor PF", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      mockPrisma.consultorPf.findMany.mockResolvedValue([
        { id: "cpf1", nome: "Consultor X" },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "Alguém", CPF_VALIDO, "Consulta", "100", "Consultor X"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      expect(procs[0].consultorPfId).toBe("cpf1");
      expect(procs[0].parceiroId).toBeNull();
    });
  });

  describe("parsing de data", () => {
    it("aceita dd/mm/aaaa", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "João", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      const dt = new Date(procs[0].dataReferencia);
      expect(dt.getUTCMonth()).toBe(6);
      expect(dt.getUTCDate()).toBe(1);
    });

    it("aceita aaaa-mm-dd (ISO)", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("2026-07-01", "João", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
    });

    it("rejeita data inválida como data_referencia_invalida", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("data-invalida", "Paciente", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const raw = capturarRaw();
      expect(raw[0].valido).toBe(false);
      expect(raw[0].motivoRejeicao).toContain("data_referencia_invalida");
    });

    it("aceita dd-mm-aaaa", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01-07-2026", "João", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      const dt = new Date(procs[0].dataReferencia);
      expect(dt.getUTCMonth()).toBe(6);
      expect(dt.getUTCDate()).toBe(1);
    });

    it("aceita data numérica (serial Excel)", async () => {
      const serial = Math.round(
        (new Date(2026, 6, 1).getTime() - new Date(1899, 11, 30).getTime()) /
          (24 * 60 * 60 * 1000),
      );
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha(serial, "João", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
    });

    it("aceita data ISO por fallback new Date(str)", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("May 1 2026", "João", CPF_VALIDO, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
    });
  });

  describe("resgate por comercial / gestor", () => {
    it("define comercialId quando usuário da conta é comercial", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      mockPrisma.consultorPf.findMany.mockResolvedValue([]);
      mockPrisma.gestor.findMany.mockResolvedValue([]);
      mockPrisma.equipe.findMany
        .mockReset()
        .mockResolvedValueOnce([{ id: "lid1" }])
        .mockResolvedValueOnce([{ id: "com1", nome: "Comercial X" }]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "João", CPF_VALIDO, "Consulta", "100", "Comercial X"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      expect(procs[0].comercialId).toBe("com1");
    });

    it("define gestorId quando usuário da conta é gestor", async () => {
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      mockPrisma.consultorPf.findMany.mockResolvedValue([]);
      mockPrisma.gestor.findMany.mockResolvedValue([{ id: "gest1", nome: "Gestor Y" }]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "João", CPF_VALIDO, "Consulta", "100", "Gestor Y"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      expect(procs[0].gestorId).toBe("gest1");
    });
  });

  describe("cpf inválido", () => {
    it("marca cpf_invalido_ou_ausente quando CPF é inválido, sem parceiro", async () => {
      const cpfInvalido = "111111111";
      mockPrisma.parceiro.findMany.mockResolvedValue([
        { id: "p1", nome: "João", cpf: CPF_VALIDO, comercialId: null, gestorId: null, indicacoes: [] },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "Alguém", cpfInvalido, "Consulta", "100"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const raw = capturarRaw();
      expect(raw[0].orfao).toBe(true);
      expect(raw[0].motivoOrfao).toContain("cpf_invalido_ou_ausente");
      expect(capturarProcedimentos().length).toBe(0);
    });

    it("resgata CPF inválido quando usuário da conta é consultor PF", async () => {
      const cpfInvalido = "111111111";
      mockPrisma.parceiro.findMany.mockResolvedValue([]);
      mockPrisma.consultorPf.findMany.mockReset().mockResolvedValue([
        { id: "cpf1", nome: "Consultor X" },
      ]);
      const file = createMockExcel([
        ["título"],
        CABECALHO,
        linha("01/07/2026", "Alguém", cpfInvalido, "Consulta", "100", "Consultor X"),
      ]);
      await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

      const procs = capturarProcedimentos();
      expect(procs.length).toBe(1);
      expect(procs[0].consultorPfId).toBe("cpf1");
    });
  });
});