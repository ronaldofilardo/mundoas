import { describe, it, expect, vi, beforeEach } from "vitest";
import { processarBonusPfPosUpload } from "@/lib/bonus-pf-pos-upload";

const mocks = vi.hoisted(() => ({
  prisma: {
    procedimentoPF: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    movimentacaoPontos: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@asa/database", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/pontos-utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pontos-utils")>("@/lib/pontos-utils");
  return {
    ...actual,
    obterCicloBonusConsultorPf: vi.fn(),
    creditarBonusConsultorPfPorProducao: vi.fn(),
  };
});

import { obterCicloBonusConsultorPf, creditarBonusConsultorPfPorProducao } from "@/lib/pontos-utils";

const uploadId = "upload-1";
const backofficeId = "bo-1";
const cicloId = "ciclo-1";

beforeEach(() => {
  vi.clearAllMocks();
  (obterCicloBonusConsultorPf as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: cicloId,
    nome: "Ciclo 2026",
    status: "EM_ANDAMENTO",
    inicioAcumuloEm: new Date("2026-01-01"),
    fimAcumuloEm: new Date("2026-12-31"),
  });
});

describe("processarBonusPfPosUpload", () => {
  it("não distribui quando não há ciclo ativo", async () => {
    (obterCicloBonusConsultorPf as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const resultado = await processarBonusPfPosUpload(uploadId, backofficeId);
    expect(resultado.bonusPfDistribuidos).toBe(0);
    expect(resultado.bonusPfIgnorados).toBe(0);
    expect(resultado.bonusPfIgnoradosExistente).toBe(0);
    expect(resultado.bonusPfErros).toBe(0);
  });

  it("distribui bônus para procedimentos dentro da vigência e com consultor", async () => {
    mocks.prisma.procedimentoPF.findMany.mockResolvedValue([
      {
        id: "proc-1",
        consultorPfId: "cpf-1",
        valorTotal: 100,
        dataReferencia: new Date("2026-06-15"),
        procedimento: "Consulta",
      },
    ]);
    (creditarBonusConsultorPfPorProducao as ReturnType<typeof vi.fn>).mockResolvedValue({ criado: true, movimentacao: { id: "mov-1", quantidade: 10 } });
    mocks.prisma.procedimentoPF.update.mockResolvedValue({});

    const resultado = await processarBonusPfPosUpload(uploadId, backofficeId);

    expect(resultado.bonusPfDistribuidos).toBe(1);
    expect(resultado.bonusPfIgnorados).toBe(0);
    expect(resultado.bonusPfIgnoradosExistente).toBe(0);
    expect(resultado.bonusPfErros).toBe(0);
    expect(creditarBonusConsultorPfPorProducao).toHaveBeenCalledWith(
      expect.objectContaining({
        procedimentoId: "proc-1",
        consultorPfId: "cpf-1",
        cicloPontosId: cicloId,
        valorTotal: 100,
      }),
    );
    expect(mocks.prisma.procedimentoPF.update).toHaveBeenCalledWith({
      where: { id: "proc-1" },
      data: { modalidadeContemplacao: "BONUS_PONTOS" },
    });
  });

  it("ignora procedimentos fora da vigência do ciclo", async () => {
    mocks.prisma.procedimentoPF.findMany.mockResolvedValue([
      {
        id: "proc-2",
        consultorPfId: "cpf-1",
        valorTotal: 100,
        dataReferencia: new Date("2025-06-15"),
        procedimento: "Consulta",
      },
    ]);

    const resultado = await processarBonusPfPosUpload(uploadId, backofficeId);

    expect(resultado.bonusPfIgnorados).toBe(1);
    expect(resultado.bonusPfDistribuidos).toBe(0);
    expect(creditarBonusConsultorPfPorProducao).not.toHaveBeenCalled();
  });

  it("conta como já existente quando creditarBonusConsultorPfPorProducao retorna criado=false", async () => {
    mocks.prisma.procedimentoPF.findMany.mockResolvedValue([
      {
        id: "proc-3",
        consultorPfId: "cpf-1",
        valorTotal: 100,
        dataReferencia: new Date("2026-06-15"),
        procedimento: "Consulta",
      },
    ]);
    (creditarBonusConsultorPfPorProducao as ReturnType<typeof vi.fn>).mockResolvedValue({ criado: false, movimentacao: { id: "mov-2", quantidade: 10 } });
    mocks.prisma.procedimentoPF.update.mockResolvedValue({});

    const resultado = await processarBonusPfPosUpload(uploadId, backofficeId);

    expect(resultado.bonusPfIgnoradosExistente).toBe(1);
    expect(resultado.bonusPfDistribuidos).toBe(0);
    expect(mocks.prisma.procedimentoPF.update).toHaveBeenCalledWith({
      where: { id: "proc-3" },
      data: { modalidadeContemplacao: "BONUS_PONTOS" },
    });
  });

  it("conta erro quando creditarBonusConsultorPfPorProducao lança exceção", async () => {
    mocks.prisma.procedimentoPF.findMany.mockResolvedValue([
      {
        id: "proc-4",
        consultorPfId: "cpf-1",
        valorTotal: 100,
        dataReferencia: new Date("2026-06-15"),
        procedimento: "Consulta",
      },
    ]);
    (creditarBonusConsultorPfPorProducao as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falha"));

    const resultado = await processarBonusPfPosUpload(uploadId, backofficeId);

    expect(resultado.bonusPfErros).toBe(1);
    expect(resultado.bonusPfDistribuidos).toBe(0);
  });
});
