import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    equipe: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn() },
    gestor: { findMany: vi.fn() },
    parceiro: { findMany: vi.fn() },
    procedimentoPF: { findMany: vi.fn() },
    upload: { findMany: vi.fn() },
  },
}));

vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: { sheet_to_json: vi.fn() },
}));

import { parsePlanilhaProducao } from "@/lib/parse-planilha-producao";
import { prisma } from "@/lib/db";
import { read, utils } from "xlsx";

const prismaMock = vi.mocked(prisma);
const readMock = vi.mocked(read);
const sheetToJsonMock = vi.mocked(utils.sheet_to_json);

// Cabeçalho: linha 0 = título, linha 1 = cabeçalhos (índice 1), linha 2+ = dados.
function montarPlanilha(
  rows: Array<Array<string | number | Date | null>>,
): void {
  const [titulo, ...resto] = rows;
  const jsonData: Array<Array<string | number | Date | null>> = [titulo, ...resto];
  readMock.mockReturnValue({
    SheetNames: ["Sheet1"],
    Sheets: { Sheet1: {} },
  } as never);
  sheetToJsonMock.mockReturnValue(jsonData as never);
}

function makeFile(): File {
  return new File(["x"], "producao.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

const CABECALHO = [
  "Data de Referência",
  "Paciente",
  "Procedimento",
  "Usuário da conta",
  "CPF",
  "Unidade",
  "Tipo Procedimento",
  "Total Pago",
];

function linhaPadrao(): (string | number | Date | null)[] {
  return [
    "01/02/2026",
    "Paciente A",
    "Limpeza",
    "Consultor X",
    "12345678901",
    "Unidade 1",
    "PARTICULAR",
    "100,00",
  ];
}

describe("parsePlanilhaProducao - regressão", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock padrão de dados do banco: sem lideranças/parceiros (linhas órfãs).
    prismaMock.equipe.findMany.mockResolvedValue([]);
    prismaMock.consultorPf.findMany.mockResolvedValue([]);
    prismaMock.gestor.findMany.mockResolvedValue([]);
    prismaMock.parceiro.findMany.mockResolvedValue([]);
    prismaMock.procedimentoPF.findMany.mockResolvedValue([]);
  });

  describe("colunas e cabeçalho", () => {
    it("rejeita planilha vazia ou sem cabeçalhos", async () => {
      readMock.mockReturnValue({
        SheetNames: ["Sheet1"],
        Sheets: { Sheet1: {} },
      } as never);
      sheetToJsonMock.mockReturnValue([] as never);

      await expect(
        parsePlanilhaProducao(makeFile(), "bo-1"),
      ).rejects.toThrow("Planilha vazia ou sem cabeçalhos");
    });

    it("rejeita quando colunas obrigatórias faltam", async () => {
      readMock.mockReturnValue({
        SheetNames: ["Sheet1"],
        Sheets: { Sheet1: {} },
      } as never);
      sheetToJsonMock.mockReturnValue([
        ["título"],
        ["Data de Referência", "Paciente", "Outra Coluna"],
      ] as never);

      await expect(
        parsePlanilhaProducao(makeFile(), "bo-1"),
      ).rejects.toThrow("Colunas obrigatórias faltando");
    });

    it("rejeita quando coluna financeira está ausente", async () => {
      readMock.mockReturnValue({
        SheetNames: ["Sheet1"],
        Sheets: { Sheet1: {} },
      } as never);
      sheetToJsonMock.mockReturnValue([
        ["título"],
        ["Data de Referência", "Paciente", "Procedimento", "Usuário da conta"],
      ] as never);

      await expect(
        parsePlanilhaProducao(makeFile(), "bo-1"),
      ).rejects.toThrow("Coluna financeira obrigatória faltando");
    });

    it("reconhece colunas encontradas no summary", async () => {
      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");

      expect(result.summary.colunasEncontradas).toEqual(expect.arrayContaining([
        "Data de Referência",
        "Paciente",
        "Procedimento",
        "Usuário da conta",
      ]));
      expect(result.summary.colunasObrigatorias).toContain("Data de Referência");
      expect(result.totalRows).toBe(1);
    });
  });

  describe("parsing de data de referência", () => {
    it("aceita formato ISO aaaa-mm-dd", async () => {
      const linha = linhaPadrao();
      linha[0] = "2026-02-01";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].dataReferencia).toBe("2026-02-01");
    });

    it("aceita formato dd-mm-aaaa", async () => {
      const linha = linhaPadrao();
      linha[0] = "01-02-2026";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].dataReferencia).toBe("2026-02-01");
    });

    it("aceita data numérica (serial Excel)", async () => {
      // 01/02/2026 = serial Excel
      const serial = Math.round(
        (new Date(2026, 1, 1).getTime() - new Date(1899, 11, 30).getTime()) /
          (24 * 60 * 60 * 1000),
      );
      const linha = linhaPadrao();
      linha[0] = serial;
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].dataReferencia).toBe("2026-02-01");
    });

    it("aceita data ISO por fallback", async () => {
      const linha = linhaPadrao();
      linha[0] = new Date(2026, 1, 1);
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].dataReferencia).toBe("2026-02-01");
    });
  });

  describe("parsing financeiro (valor total)", () => {
    it("converte valor BR com vírgula", async () => {
      const linha = linhaPadrao();
      linha[7] = "1.234,56";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].valorTotal).toBe(1234.56);
    });

    it("converte decimal simples", async () => {
      const linha = linhaPadrao();
      linha[7] = "1234.50";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].valorTotal).toBe(1234.5);
    });

    it("marca REJEITADO quando valor total é inválido", async () => {
      const linha = linhaPadrao();
      linha[7] = "abc";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("REJEITADO");
    });
  });

  describe("status VALIDO/ORFAO/REJEITADO", () => {
    it("marca ORFAO quando CPF não corresponde a parceiro", async () => {
      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");

      expect(result.previewRows[0].status).toBe("ORFAO");
      expect(result.previewRows[0].motivo).toBe("Parceiro não encontrado");
    });

    it("marca ORFAO quando CPF está ausente", async () => {
      const linha = linhaPadrao();
      linha[4] = "";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("ORFAO");
      expect(result.previewRows[0].motivo).toBe("CPF ausente");
    });

    it("marca REJEITADO quando data de referência é inválida", async () => {
      const linha = linhaPadrao();
      linha[0] = "data-invalida";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("REJEITADO");
      expect(result.previewRows[0].motivo).toContain("Data de referência inválida");
    });

    it("marca REJEITADO quando paciente está ausente", async () => {
      const linha = linhaPadrao();
      linha[1] = "";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("REJEITADO");
      expect(result.previewRows[0].motivo).toContain("Paciente ausente");
    });

    it("marca REJEITADO quando procedimento está ausente", async () => {
      const linha = linhaPadrao();
      linha[2] = "";
      montarPlanilha([["título"], CABECALHO, linha]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("REJEITADO");
      expect(result.previewRows[0].motivo).toContain("Procedimento ausente");
    });

    it("marca VALIDO e preenche parceiroNome quando CPF corresponde", async () => {
      prismaMock.parceiro.findMany.mockResolvedValue([
        {
          id: "p1",
          nome: "Parceiro Um",
          cpf: "123.456.789-01",
          comercialId: "c1",
          gestorId: null,
          indicacoes: [],
        },
      ] as never);

      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");

      expect(result.previewRows[0].status).toBe("VALIDO");
      expect(result.previewRows[0].parceiroNome).toBe("Parceiro Um");
    });

    it("marca VALIDO por indicado do parceiro", async () => {
      prismaMock.parceiro.findMany.mockResolvedValue([
        {
          id: "p1",
          nome: "Parceiro Um",
          cpf: "000.000.000-00",
          comercialId: null,
          gestorId: null,
          indicacoes: [{ id: "i1", cpf: "123.456.789-01" }],
        },
      ] as never);

      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("VALIDO");
    });
  });

  describe("resgate por Consultor PF", () => {
    it("marca VALIDO com resgate quando usuário da conta é consultor PF", async () => {
      prismaMock.consultorPf.findMany.mockResolvedValue([
        { id: "cpf1", nome: "Consultor X" },
      ] as never);

      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");

      expect(result.previewRows[0].status).toBe("VALIDO");
      expect(result.previewRows[0].resgatadoPorConsultorPf).toBe(true);
      expect(result.previewRows[0].consultorPfNome).toBe("Consultor X");
    });
  });

  describe("duplicidade", () => {
    it("marca DUPLICADA quando produção já existe no banco", async () => {
      prismaMock.parceiro.findMany.mockResolvedValue([
        {
          id: "p1",
          nome: "Parceiro Um",
          cpf: "123.456.789-01",
          comercialId: null,
          gestorId: null,
          indicacoes: [],
        },
      ] as never);
      prismaMock.procedimentoPF.findMany.mockResolvedValue([
        {
          dataReferencia: new Date("2026-02-01T00:00:00.000Z"),
          cpf: "123.456.789-01",
          procedimento: "Limpeza",
          unidade: "Unidade 1",
        },
      ] as never);

      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("DUPLICADA");
    });
  });

  describe("falha de banco não bloqueante", () => {
    it("continua com preview mesmo se a busca de parceiros falhar", async () => {
      prismaMock.equipe.findMany.mockRejectedValue(new Error("DB down"));

      montarPlanilha([["título"], CABECALHO, linhaPadrao()]);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");
      expect(result.previewRows[0].status).toBe("ORFAO");
    });
  });

  describe("summary e limites", () => {
    it("limita preview a 100 linhas e calcula hasMore corretamente", async () => {
      const rows = [["título"], CABECALHO];
      for (let i = 0; i < 150; i++) {
        rows.push(linhaPadrao());
      }
      montarPlanilha(rows);

      const result = await parsePlanilhaProducao(makeFile(), "bo-1");

      expect(result.previewRows.length).toBe(100);
      expect(result.hasMore).toBe(true);
      expect(result.totalRows).toBe(150);
    });
  });
});