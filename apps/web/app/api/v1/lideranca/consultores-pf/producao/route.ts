import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireLiderancaWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { liderancaId, error } = await requireLiderancaWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  if (!inicio || !fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  const consultores = await prisma.consultorPf.findMany({
    where: { liderancaId, status: "ATIVO" },
    select: { id: true, nome: true, cpf: true },
    orderBy: { nome: "asc" },
  });

  const consultorIds = consultores.map(c => c.id);
  if (consultorIds.length === 0) {
    return ok({
      registros: [],
      resumo: {
        totalProducao: 0,
        totalComissao: 0,
        totalMeta: 0,
        totalAtingido: 0,
        quantidade: 0,
      },
      consultores: [],
      meses: [],
    });
  }

  const [comissoes, metas] = await Promise.all([
    prisma.comissaoConsultorPf.findMany({
      where: {
        consultorPfId: { in: consultorIds },
        mesReferencia: { gte: inicio, lte: fim },
      },
      include: {
        consultorPf: { select: { id: true, nome: true, cpf: true } },
      },
      orderBy: { mesReferencia: "desc" },
    }),
    prisma.metaConsultorPf.findMany({
      where: {
        consultorPfId: { in: consultorIds },
        mesReferencia: { gte: inicio, lte: fim },
      },
      include: {
        consultorPf: { select: { id: true, nome: true, cpf: true } },
      },
    }),
  ]);

  const metaMap = new Map(metas.map(m => [`${m.consultorPfId}-${m.mesReferencia}`, m]));

  let totalProducao = 0;
  let totalComissao = 0;
  let totalMeta = 0;
  let totalAtingido = 0;

  const registros = comissoes.map((c) => {
    const meta = metaMap.get(`${c.consultorPfId}-${c.mesReferencia}`);
    const valorMeta = meta ? Number(meta.valorMeta) : 0;
    const valorAtingido = meta ? Number(meta.valorAtingido) : 0;
    totalProducao += Number(c.valorProducao);
    totalComissao += Number(c.valorComissao);
    totalMeta += valorMeta;
    totalAtingido += valorAtingido;
    return {
      id: c.id,
      mesReferencia: c.mesReferencia,
      consultorPfId: c.consultorPfId,
      consultorPfNome: c.consultorPf.nome,
      consultorPfCpf: c.consultorPf.cpf,
      valorProducao: Number(c.valorProducao),
      valorComissao: Number(c.valorComissao),
      valorMeta,
      valorAtingido,
      status: c.status,
      dataPagamento: c.dataPagamento,
    };
  });

  const meses = Array.from(new Set(comissoes.map(c => c.mesReferencia))).sort().reverse();

  return ok({
    registros,
    resumo: {
      totalProducao,
      totalComissao,
      totalMeta,
      totalAtingido,
      quantidade: comissoes.length,
    },
    consultores: consultores.map(c => ({ id: c.id, nome: c.nome, cpf: c.cpf })),
    meses,
  });
}
