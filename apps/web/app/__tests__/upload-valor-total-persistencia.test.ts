/**
 * Teste de regressão para a correção do parsing de "Total Pago" no
 * processamento em background (processar-upload-pf.ts).
 *
 * Bug: o regex de limpeza (/[^\d,-]/) removia o PONTO decimal, corrompendo
 * valores como "17.03" -> 1703 e "69.9" -> 699. O xlsx (raw:false) retorna
 * células numéricas com ponto decimal.
 *
 * Aqui validamos o valor EFETIVAMENTE PERSISTIDO em procedimentoPF.valorTotal.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    uploadPlanilhaBackoffice: { update: vi.fn(), findUnique: vi.fn() },
    equipe: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn() },
    gestor: { findMany: vi.fn() },
    parceiro: { findMany: vi.fn() },
    procedimentoPFRaw: { createMany: vi.fn(), deleteMany: vi.fn() },
    procedimentoPF: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
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

// CPF válido (11 dígitos) que bate com o parceiro cadastrado.
const CPF_VALIDO = "52998224725";

import { processarUploadPlanilhaPF } from "@/lib/processar-upload-pf";

describe("Regressão: valorTotal persistido (processar-upload-pf)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // update do uploadPlanilhaBackoffice (conteúdo + status) e createMany: resolvem vazios
    mockPrisma.uploadPlanilhaBackoffice.update.mockResolvedValue({});
    mockPrisma.uploadPlanilhaBackoffice.findUnique.mockResolvedValue({ mesReferencia: "2026-07" });
    mockPrisma.procedimentoPFRaw.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.procedimentoPFRaw.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.procedimentoPF.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.procedimentoPF.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.procedimentoPF.findMany.mockResolvedValue([]);

    // equipe.findMany: 1) liderancas, 2) comerciais
    mockPrisma.equipe.findMany
      .mockResolvedValueOnce([{ id: "lid1" }])
      .mockResolvedValueOnce([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
    mockPrisma.parceiro.findMany.mockResolvedValue([
      {
        id: "p1",
        nome: "João",
        cpf: CPF_VALIDO,
        comercialId: "1",
        gestorId: null,
        indicacoes: [],
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function processarPlanilhaComTotal(totalPago: unknown) {
    const planilha = [
      ["REceita bruta analitica"],
      ["Data de Referência", "Paciente", "CPF", "Procedimento", "Total Pago", "Usuário da conta"],
      ["01/07/2026", "João", CPF_VALIDO, "Consulta", totalPago, "admin"],
    ];
    const file = createMockExcel(planilha);
    await processarUploadPlanilhaPF("upload-1", file, BACKOFFICE_ID);

    // Captura os dados enviados a procedimentoPF.createMany
    const calls = mockPrisma.procedimentoPF.createMany.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const data = calls[0][0].data as Array<{ valorTotal: number }>;
    expect(data.length).toBe(1);
    return data[0].valorTotal;
  }

  it("deve persistir 17.03 (ponto decimal vindo do xlsx) sem multiplicar por 100", async () => {
    const valor = await processarPlanilhaComTotal(17.03);
    expect(valor).toBe(17.03);
  });

  it("deve persistir 69.9 corretamente", async () => {
    expect(await processarPlanilhaComTotal(69.9)).toBe(69.9);
  });

  it("deve persistir 169.9 corretamente", async () => {
    expect(await processarPlanilhaComTotal(169.9)).toBe(169.9);
  });

  it("deve tratar vírgula decimal brasileira '17,03' como 17.03", async () => {
    const valor = await processarPlanilhaComTotal("17,03");
    expect(valor).toBe(17.03);
  });

  it("deve tratar milhar brasileiro '1.234,56' como 1234.56", async () => {
    const valor = await processarPlanilhaComTotal("1.234,56");
    expect(valor).toBe(1234.56);
  });

  it("deve manter inteiros inalterados (150)", async () => {
    const valor = await processarPlanilhaComTotal(150);
    expect(valor).toBe(150);
  });

  it("deve tornar o re-upload idempotente via skipDuplicates e chaves existentes", async () => {
    // Simula um re-upload: registros antigos não são apagados, mas
    // skipDuplicates + chavesExistentes garantem que não sejam duplicados.
    mockPrisma.procedimentoPF.findMany.mockResolvedValue([
      {
        dataReferencia: new Date("2026-07-01"),
        cpf: CPF_VALIDO,
        procedimento: "Consulta",
        unidade: "UBS Central",
      },
    ]);

    await processarPlanilhaComTotal(17.03);

    expect(mockPrisma.uploadPlanilhaBackoffice.findUnique).toHaveBeenCalledWith({
      where: { id: "upload-1" },
      select: { mesReferencia: true },
    });
    expect(mockPrisma.procedimentoPF.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.procedimentoPF.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
      }),
    );
  });
});
