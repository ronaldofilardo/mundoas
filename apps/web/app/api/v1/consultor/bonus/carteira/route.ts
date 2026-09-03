import { NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { calcularSaldoBonusConsultorPf, obterCicloBonusConsultorPf } from "@/lib/pontos-utils";
import { requireConsultorPfWithScope } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { consultorPfId, backofficeId, error } = await requireConsultorPfWithScope();
  if (error) return error;

  const consultor = await prisma.consultorPf.findFirst({
    where: { id: consultorPfId! },
    include: {
      lideranca: { select: { id: true, nome: true } },
    },
  });

  const ciclo = await obterCicloBonusConsultorPf(backofficeId!);
  if (!ciclo) {
    return NextResponse.json({
      ciclo: null,
      gestor: consultor?.lideranca ? { id: consultor.lideranca.id, nome: consultor.lideranca.nome } : null,
      saldo: 0,
      totalResgates: 0,
      ultimaProducao: null,
      movimentacoes: [],
    });
  }

  const [saldo, movimentacoes, ultimaProducaoRaw, totalResgates] = await Promise.all([
    calcularSaldoBonusConsultorPf(consultorPfId!, ciclo.id),
    prisma.movimentacaoPontos.findMany({
      where: { consultorPfId: consultorPfId!, cicloPontosId: ciclo.id },
      orderBy: { criadoEm: "desc" },
      take: 100,
      select: {
        id: true,
        tipo: true,
        origem: true,
        quantidade: true,
        descricao: true,
        observacao: true,
        criadoEm: true,
        referenciaProcedimentoId: true,
      },
    }),
    prisma.procedimentoPF.findFirst({
      where: { consultorPfId: consultorPfId!, modalidadeContemplacao: "BONUS_PONTOS" },
      orderBy: { dataReferencia: "desc" },
      select: { dataReferencia: true },
    }),
    prisma.solicitacaoResgate.count({
      where: { consultorPfId: consultorPfId!, cicloPontosId: ciclo.id },
    }),
  ]);

  return NextResponse.json({
    ciclo: {
      id: ciclo.id,
      nome: ciclo.nome,
      inicioAcumuloEm: ciclo.inicioAcumuloEm,
      fimAcumuloEm: ciclo.fimAcumuloEm,
      status: ciclo.status,
    },
    gestor: consultor?.lideranca ? { id: consultor.lideranca.id, nome: consultor.lideranca.nome } : null,
    saldo,
    totalResgates,
    ultimaProducao: ultimaProducaoRaw?.dataReferencia ? new Date(ultimaProducaoRaw.dataReferencia).toISOString() : null,
    movimentacoes,
  });
}
