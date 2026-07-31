import type { Prisma } from "@asa/database";
import { prisma } from "@asa/database";

export type ProcedimentoProducao = {
  id: string;
  dataReferencia: Date;
  totalPago: number;
  consultorPfId: string | null;
  parceiroId: string | null;
};

export type GetProcedimentosParams = {
  backofficeId: string;
  ano: number;
  mes?: number | null;
  status?: string | null;
  parceiroId?: string | null;
};

export function buildProducaoWhere(
  params: GetProcedimentosParams,
): Prisma.ProcedimentoPFWhereInput {
  const where: Prisma.ProcedimentoPFWhereInput = {
    OR: [
      { upload: { backofficeId: params.backofficeId } },
      { parceiro: { backofficeId: params.backofficeId } },
    ],
  };

  if (params.parceiroId) {
    where.parceiroId = params.parceiroId;
  }

  if (params.status && params.status !== "TODOS") {
    where.statusComissao = params.status as Prisma.ProcedimentoPFWhereInput["statusComissao"];
  }

  if (params.ano) {
    if (params.mes && params.mes >= 1 && params.mes <= 12) {
      const inicioMes = new Date(Date.UTC(params.ano, params.mes - 1, 1));
      const fimMes = new Date(Date.UTC(params.ano, params.mes, 1));
      where.dataReferencia = { gte: inicioMes, lt: fimMes };
    } else {
      const inicio = new Date(Date.UTC(params.ano, 0, 1));
      const fim = new Date(Date.UTC(params.ano + 1, 0, 1));
      where.dataReferencia = { gte: inicio, lt: fim };
    }
  }

  return where;
}

export async function getProcedimentosDoBackoffice(
  params: GetProcedimentosParams,
): Promise<ProcedimentoProducao[]> {
  const where = buildProducaoWhere(params);

  const rows = await prisma.procedimentoPF.findMany({
    where,
    select: {
      id: true,
      dataReferencia: true,
      totalPago: true,
      consultorPfId: true,
      parceiroId: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    dataReferencia: r.dataReferencia,
    totalPago: Number(r.totalPago),
    consultorPfId: r.consultorPfId,
    parceiroId: r.parceiroId,
  }));
}
